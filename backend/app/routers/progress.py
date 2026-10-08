from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.database import get_db
from app.models.user import User, UserProfile
from app.models.curriculum import Topic, World
from app.models.progress import (
    UserTopicProgress,
    UserWorldProgress,
    Achievement,
    UserAchievement,
    UserSkillTopicScore
)
from app.schemas.progress import DashboardOut, SkillItem, AchievementOut
from app.routers.deps import get_current_user
from app.services.progression import calculate_level_info

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/dashboard", response_model=DashboardOut)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    xp = profile.xp if profile else 0
    streak = profile.streak_days if profile else 1
    avatar = profile.avatar if profile else "🐍"

    level, level_title, xp_to_next, progress_pct = calculate_level_info(xp)

    # Current world and topic names
    current_world_name = None
    if profile and profile.current_world_id:
        w_res = await db.execute(select(World.name).where(World.id == profile.current_world_id))
        current_world_name = w_res.scalar_one_or_none()

    current_topic_title = None
    if profile and profile.current_topic_id:
        t_res = await db.execute(select(Topic.title).where(Topic.id == profile.current_topic_id))
        current_topic_title = t_res.scalar_one_or_none()

    # Mastered topics count
    all_topics_res = await db.execute(select(func.count(Topic.id)))
    total_topics = all_topics_res.scalar_one() or 1

    mastered_res = await db.execute(
        select(func.count(UserTopicProgress.id)).where(
            and_(UserTopicProgress.user_id == current_user.id, UserTopicProgress.is_mastered == True)
        )
    )
    mastered_count = mastered_res.scalar_one() or 0
    overall_pct = round((mastered_count / total_topics) * 100.0, 1)

    # Skill scores
    skills_stmt = select(UserSkillTopicScore, Topic.title).join(
        Topic, UserSkillTopicScore.topic_id == Topic.id
    ).where(UserSkillTopicScore.user_id == current_user.id)
    skills_res = await db.execute(skills_stmt)
    skills_rows = skills_res.all()

    skills_list: List[SkillItem] = []
    for score_rec, topic_title in skills_rows:
        skills_list.append(
            SkillItem(
                topic_id=score_rec.topic_id,
                topic_title=topic_title,
                percentage=score_rec.skill_percentage
            )
        )

    # If user has no skill records yet, populate default starting view from first few topics
    if not skills_list:
        first_topics = await db.execute(select(Topic).limit(4))
        for ft in first_topics.scalars().all():
            skills_list.append(
                SkillItem(topic_id=ft.id, topic_title=ft.title, percentage=0.0)
            )

    # Weak topics (< 70%)
    weak_topics = [s for s in skills_list if s.percentage < 70.0][:3]

    # Recent achievements
    ach_stmt = select(Achievement, UserAchievement.earned_at).outerjoin(
        UserAchievement,
        and_(UserAchievement.achievement_id == Achievement.id, UserAchievement.user_id == current_user.id)
    ).limit(6)
    ach_res = await db.execute(ach_stmt)
    ach_rows = ach_res.all()

    recent_achievements: List[AchievementOut] = []
    for ach, earned_at in ach_rows:
        recent_achievements.append(
            AchievementOut(
                id=ach.id,
                code=ach.code,
                title=ach.title,
                description=ach.description,
                icon=ach.icon,
                category=ach.category,
                xp_bonus=ach.xp_bonus,
                unlocked=earned_at is not None,
                earned_at=earned_at
            )
        )

    return DashboardOut(
        username=current_user.username,
        avatar=avatar,
        xp=xp,
        level=level,
        level_title=level_title,
        xp_to_next_level=xp_to_next,
        xp_progress_percentage=progress_pct,
        streak_days=streak,
        current_mode_id="beginner",
        current_world_id=profile.current_world_id if profile else "world-1-foundations",
        current_world_name=current_world_name or "Python Foundations",
        current_topic_id=profile.current_topic_id if profile else "topic-intro-python",
        current_topic_title=current_topic_title or "Introduction to Python",
        mastered_topics_count=mastered_count,
        total_topics_count=total_topics,
        overall_progress_percentage=overall_pct,
        skills=skills_list,
        recent_achievements=recent_achievements,
        weak_topics=weak_topics
    )


@router.get("/achievements", response_model=List[AchievementOut])
async def get_all_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Achievement, UserAchievement.earned_at).outerjoin(
        UserAchievement,
        and_(UserAchievement.achievement_id == Achievement.id, UserAchievement.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    rows = res.all()

    out = []
    for ach, earned_at in rows:
        out.append(
            AchievementOut(
                id=ach.id,
                code=ach.code,
                title=ach.title,
                description=ach.description,
                icon=ach.icon,
                category=ach.category,
                xp_bonus=ach.xp_bonus,
                unlocked=earned_at is not None,
                earned_at=earned_at
            )
        )
    return out
