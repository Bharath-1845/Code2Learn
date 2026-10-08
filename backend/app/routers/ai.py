from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models.user import User
from app.models.challenge import CodingChallenge
from app.models.progress import UserSkillTopicScore, UserTopicProgress
from app.models.curriculum import Topic
from app.schemas.ai import HintRequest, HintResponse, ExplainRequest, ExplainResponse, RecommendResponse
from app.routers.deps import get_current_user
from app.services.ai_service import generate_hint, explain_concept

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/hint", response_model=HintResponse)
async def get_ai_hint(
    data: HintRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CodingChallenge).where(CodingChallenge.id == data.challenge_id)
    res = await db.execute(stmt)
    challenge = res.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    hint_text = await generate_hint(challenge, data.user_code, data.hint_level)
    return HintResponse(
        hint_level=data.hint_level,
        hint=hint_text,
        next_level_available=data.hint_level < 3
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain_python_concept(data: ExplainRequest):
    explanation = await explain_concept(
        concept_title=data.concept_title,
        user_question=data.user_question,
        user_code=data.user_code
    )
    return ExplainResponse(
        explanation=explanation,
        suggested_exercise=f"Try running a quick experiment with {data.concept_title} in the sandbox to test how it responds."
    )


@router.get("/recommend", response_model=RecommendResponse)
async def get_personalized_recommendation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if there is a weak topic (< 70%)
    stmt = select(UserSkillTopicScore, Topic.title).join(
        Topic, UserSkillTopicScore.topic_id == Topic.id
    ).where(
        and_(UserSkillTopicScore.user_id == current_user.id, UserSkillTopicScore.skill_percentage < 70.0)
    ).order_by(UserSkillTopicScore.skill_percentage).limit(1)
    res = await db.execute(stmt)
    weak_item = res.first()

    if weak_item:
        score_rec, title = weak_item
        return RecommendResponse(
            recommended_topic_id=score_rec.topic_id,
            recommended_topic_title=title,
            reason=f"Your accuracy on this topic is {score_rec.skill_percentage}%. Reinforcing this concept will solidify your foundation.",
            suggested_action="Review lesson examples and solve the mini-practice again."
        )

    # Otherwise find first uncompleted topic
    uncompleted_stmt = select(Topic).outerjoin(
        UserTopicProgress,
        and_(UserTopicProgress.topic_id == Topic.id, UserTopicProgress.user_id == current_user.id)
    ).where(
        (UserTopicProgress.id == None) | (UserTopicProgress.is_mastered == False)
    ).order_by(Topic.order_index).limit(1)
    uncomp_res = await db.execute(uncompleted_stmt)
    next_topic = uncomp_res.scalar_one_or_none()

    if next_topic:
        return RecommendResponse(
            recommended_topic_id=next_topic.id,
            recommended_topic_title=next_topic.title,
            reason="This is your next sequential milestone in the curriculum.",
            suggested_action="Start the interactive lesson!"
        )

    return RecommendResponse(
        recommended_topic_id="topic-intro-python",
        recommended_topic_title="Python Foundations",
        reason="You have made stellar progress across all active topics!",
        suggested_action="Explore the Boss Battle or try speed coding challenges."
    )
