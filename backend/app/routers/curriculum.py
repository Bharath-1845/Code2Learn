import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models.user import User
from app.models.curriculum import Mode, World, Topic, Lesson, MiniPractice
from app.models.progress import UserWorldProgress, UserTopicProgress
from app.schemas.curriculum import ModeOut, WorldOut, TopicOut, LessonOut, MiniPracticeOut, MiniPracticeSubmit
from app.routers.deps import get_current_user_optional, get_current_user
from app.services.progression import award_xp, get_or_create_topic_progress, check_achievements

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/modes", response_model=List[ModeOut])
async def get_modes(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Mode).order_by(Mode.order_index)
    res = await db.execute(stmt)
    modes = res.scalars().all()

    result = []
    for m in modes:
        # Check unlocked
        is_unlocked = not m.is_locked_by_default
        # Count worlds & topics
        w_res = await db.execute(select(World).where(World.mode_id == m.id))
        worlds = w_res.scalars().all()
        w_ids = [w.id for w in worlds]

        t_res = await db.execute(select(Topic).where(Topic.world_id.in_(w_ids)))
        all_topics = t_res.scalars().all()

        mastered_count = 0
        if current_user:
            t_ids = [t.id for t in all_topics]
            if t_ids:
                p_res = await db.execute(
                    select(UserTopicProgress).where(
                        and_(
                            UserTopicProgress.user_id == current_user.id,
                            UserTopicProgress.topic_id.in_(t_ids),
                            UserTopicProgress.is_mastered == True
                        )
                    )
                )
                mastered_count = len(p_res.scalars().all())

        result.append(
            ModeOut(
                id=m.id,
                name=m.name,
                description=m.description,
                order_index=m.order_index,
                is_unlocked=is_unlocked,
                worlds_count=len(worlds),
                mastered_topics_count=mastered_count,
                total_topics_count=len(all_topics),
            )
        )
    return result


@router.get("/worlds", response_model=List[WorldOut])
async def get_worlds(
    mode_id: str = "beginner",
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(World).where(World.mode_id == mode_id).order_by(World.order_index)
    res = await db.execute(stmt)
    worlds = res.scalars().all()

    # Get unlock status for user
    unlocked_world_ids = {"world-1-foundations"}  # World 1 always unlocked
    completed_world_ids = set()
    boss_defeated_world_ids = set()

    if current_user:
        w_prog_res = await db.execute(
            select(UserWorldProgress).where(UserWorldProgress.user_id == current_user.id)
        )
        for wp in w_prog_res.scalars().all():
            if wp.is_unlocked:
                unlocked_world_ids.add(wp.world_id)
            if wp.is_completed:
                completed_world_ids.add(wp.world_id)
            if wp.boss_defeated:
                boss_defeated_world_ids.add(wp.world_id)

    out = []
    for w in worlds:
        topics_res = await db.execute(select(Topic).where(Topic.world_id == w.id).order_by(Topic.order_index))
        topics = topics_res.scalars().all()

        # Map topics
        topics_out = []
        is_world_unlocked = w.id in unlocked_world_ids

        for idx, t in enumerate(topics):
            topic_dict = {
                "id": t.id,
                "world_id": t.world_id,
                "title": t.title,
                "slug": t.slug,
                "description": t.description,
                "order_index": t.order_index,
                "xp_reward": t.xp_reward,
                "lesson_completed": False,
                "practice_completed": False,
                "game_completed": False,
                "challenge_completed": False,
                "assessment_completed": False,
                "is_mastered": False,
                # First topic in unlocked world is unlocked by default
                "is_unlocked": is_world_unlocked and (idx == 0),
            }

            if current_user:
                p_res = await db.execute(
                    select(UserTopicProgress).where(
                        and_(UserTopicProgress.user_id == current_user.id, UserTopicProgress.topic_id == t.id)
                    )
                )
                prog = p_res.scalar_one_or_none()
                if prog:
                    topic_dict["lesson_completed"] = prog.lesson_completed
                    topic_dict["practice_completed"] = prog.practice_completed
                    topic_dict["game_completed"] = prog.game_completed
                    topic_dict["challenge_completed"] = prog.challenge_completed
                    topic_dict["assessment_completed"] = prog.assessment_completed
                    topic_dict["is_mastered"] = prog.is_mastered
                    topic_dict["is_unlocked"] = True
                elif idx > 0 and is_world_unlocked:
                    # Check if previous topic is mastered
                    prev_t = topics[idx - 1]
                    prev_p_res = await db.execute(
                        select(UserTopicProgress).where(
                            and_(UserTopicProgress.user_id == current_user.id, UserTopicProgress.topic_id == prev_t.id)
                        )
                    )
                    prev_prog = prev_p_res.scalar_one_or_none()
                    if prev_prog and prev_prog.is_mastered:
                        topic_dict["is_unlocked"] = True

            topics_out.append(TopicOut(**topic_dict))

        out.append(
            WorldOut(
                id=w.id,
                mode_id=w.mode_id,
                world_number=w.world_number,
                name=w.name,
                slug=w.slug,
                description=w.description,
                icon=w.icon,
                theme_color=w.theme_color,
                order_index=w.order_index,
                is_unlocked=is_world_unlocked,
                is_completed=w.id in completed_world_ids,
                boss_defeated=w.id in boss_defeated_world_ids,
                topics=topics_out,
            )
        )
    return out


@router.get("/lesson/{topic_id}", response_model=LessonOut)
async def get_lesson(topic_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Lesson).where(Lesson.topic_id == topic_id)
    res = await db.execute(stmt)
    lesson = res.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found for this topic")
    return lesson


@router.post("/lesson/{topic_id}/complete")
async def complete_lesson(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prog = await get_or_create_topic_progress(db, current_user.id, topic_id)
    xp_awarded = 0
    if not prog.lesson_completed:
        prog.lesson_completed = True
        xp_awarded = 20
        prog.xp_earned += xp_awarded
        await db.commit()
        await award_xp(db, current_user.id, xp_awarded)
        await check_achievements(db, current_user.id)

    return {
        "status": "success",
        "lesson_completed": True,
        "xp_awarded": xp_awarded
    }


@router.get("/mini-practice/{topic_id}", response_model=List[MiniPracticeOut])
async def get_mini_practices(topic_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(MiniPractice).where(MiniPractice.topic_id == topic_id).order_by(MiniPractice.order_index)
    res = await db.execute(stmt)
    practices = res.scalars().all()

    out = []
    for p in practices:
        options = json.loads(p.options_json) if p.options_json else None
        out.append(
            MiniPracticeOut(
                id=p.id,
                topic_id=p.topic_id,
                question_type=p.question_type,
                prompt=p.prompt,
                code_snippet=p.code_snippet,
                options=options,
                explanation=p.explanation,
                order_index=p.order_index,
            )
        )
    return out


@router.post("/mini-practice/{topic_id}/submit")
async def submit_mini_practice(
    topic_id: str,
    data: MiniPracticeSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MiniPractice).where(MiniPractice.topic_id == topic_id)
    res = await db.execute(stmt)
    practices = res.scalars().all()

    if not practices:
        raise HTTPException(status_code=404, detail="No practices found for this topic")

    correct_count = 0
    feedback = {}

    for p in practices:
        user_ans = data.answers.get(p.id)
        expected = json.loads(p.correct_answer_json)
        is_corr = str(user_ans).strip().lower() == str(expected).strip().lower()
        if is_corr:
            correct_count += 1
        feedback[p.id] = {
            "correct": is_corr,
            "expected": expected,
            "explanation": p.explanation
        }

    all_passed = correct_count >= len(practices) * 0.7  # 70% threshold
    xp_awarded = 0

    if all_passed:
        prog = await get_or_create_topic_progress(db, current_user.id, topic_id)
        if not prog.practice_completed:
            prog.practice_completed = True
            xp_awarded = 20
            prog.xp_earned += xp_awarded
            await db.commit()
            await award_xp(db, current_user.id, xp_awarded)
            await check_achievements(db, current_user.id)

    return {
        "passed": all_passed,
        "correct_count": correct_count,
        "total_count": len(practices),
        "feedback": feedback,
        "xp_awarded": xp_awarded
    }
