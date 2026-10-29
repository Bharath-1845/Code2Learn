import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models.user import User
from app.models.assessment import Assessment, Question
from app.models.progress import UserAssessmentAttempt, UserTopicProgress
from app.schemas.assessment import (
    AssessmentOut,
    QuestionOut,
    AssessmentSubmitRequest,
    AssessmentResultOut,
    QuestionFeedback
)
from app.routers.deps import get_current_user
from app.services.adaptive import get_adaptive_questions_for_topic, update_skill_score
from app.services.progression import award_xp, get_or_create_topic_progress, check_and_apply_topic_mastery, check_achievements

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/topic/{topic_id}", response_model=AssessmentOut)
async def get_assessment_for_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Assessment).where(Assessment.topic_id == topic_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found for this topic")

    # Strict prerequisite: Coding challenge must be completed before assessment
    prog = await get_or_create_topic_progress(db, current_user.id, topic_id)
    if not prog.challenge_completed:
        raise HTTPException(
            status_code=403,
            detail="You must complete the coding challenge before unlocking the assessment."
        )

    questions = await get_adaptive_questions_for_topic(db, topic_id, current_user.id, max_questions=5)

    q_out = []
    for q in questions:
        opts = json.loads(q.options_json) if q.options_json else None
        q_out.append(
            QuestionOut(
                id=q.id,
                assessment_id=q.assessment_id,
                question_type=q.question_type,
                prompt=q.prompt,
                code_snippet=q.code_snippet,
                options=opts,
                difficulty=q.difficulty
            )
        )

    return AssessmentOut(
        id=assessment.id,
        topic_id=assessment.topic_id,
        title=assessment.title,
        description=assessment.description,
        passing_threshold=assessment.passing_threshold,
        time_limit_minutes=assessment.time_limit_minutes,
        xp_reward=assessment.xp_reward,
        questions=q_out
    )


@router.post("/topic/{topic_id}/submit", response_model=AssessmentResultOut)
async def submit_assessment(
    topic_id: str,
    data: AssessmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Assessment).where(Assessment.topic_id == topic_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Strict prerequisite: Coding challenge must be completed
    prog = await get_or_create_topic_progress(db, current_user.id, topic_id)
    if not prog.challenge_completed:
        raise HTTPException(
            status_code=403,
            detail="You must complete the coding challenge before submitting the assessment."
        )

    # Map answers
    user_answers = {item.question_id: item.answer for item in data.answers}

    # Fetch question records
    q_ids = list(user_answers.keys())
    q_stmt = select(Question).where(Question.id.in_(q_ids))
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    correct_count = 0
    feedback_list: List[QuestionFeedback] = []

    for q in questions:
        u_ans = user_answers.get(q.id)
        expected = json.loads(q.correct_answer_json)
        is_corr = str(u_ans).strip().lower() == str(expected).strip().lower()
        if is_corr:
            correct_count += 1

        feedback_list.append(
            QuestionFeedback(
                question_id=q.id,
                is_correct=is_corr,
                user_answer=u_ans,
                correct_answer=expected,
                explanation=q.explanation
            )
        )

    total_q = max(len(questions), 1)
    score_pct = round((correct_count / total_q) * 100.0, 1)
    score_ratio = score_pct / 100.0
    passed = score_ratio >= assessment.passing_threshold

    # Record attempt
    attempt = UserAssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment.id,
        topic_id=topic_id,
        score=score_ratio,
        passed=passed,
        answers_json=json.dumps([{item.question_id: item.answer} for item in data.answers]),
        taken_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    await db.commit()

    # Update moving skill score
    await update_skill_score(db, current_user.id, topic_id, score_pct)

    xp_earned = 0
    new_total_xp = 0
    new_level = 1
    topic_mastered = False
    next_unlocked_topic_id = None
    next_unlocked_world_id = None

    if passed:
        prog = await get_or_create_topic_progress(db, current_user.id, topic_id)
        if not prog.assessment_completed:
            prog.assessment_completed = True
            xp_earned = assessment.xp_reward or 100
        else:
            xp_earned = 30  # Quiz review mastery bonus

        prog.assessment_score = max(prog.assessment_score or 0.0, score_ratio)
        prog.xp_earned += xp_earned
        await db.commit()

        new_total_xp, new_level, _, _ = await award_xp(db, current_user.id, xp_earned)

        # Check and unlock mastery
        topic_mastered, next_unlocked_topic_id, next_unlocked_world_id = await check_and_apply_topic_mastery(
            db, current_user.id, topic_id
        )
        await check_achievements(db, current_user.id)

    return AssessmentResultOut(
        passed=passed,
        score_percentage=score_pct,
        passing_threshold=round(assessment.passing_threshold * 100, 1),
        total_questions=total_q,
        correct_count=correct_count,
        feedback=feedback_list,
        xp_earned=xp_earned,
        new_total_xp=new_total_xp,
        new_level=new_level,
        topic_mastered=topic_mastered,
        next_unlocked_topic_id=next_unlocked_topic_id,
        next_unlocked_world_id=next_unlocked_world_id
    )
