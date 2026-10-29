from datetime import datetime, timezone
from typing import Tuple, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.user import User, UserProfile
from app.models.curriculum import Mode, World, Topic
from app.models.progress import (
    UserTopicProgress,
    UserWorldProgress,
    Achievement,
    UserAchievement,
    UserSkillTopicScore
)

# Level definition: (Threshold XP, Title)
LEVEL_TABLE = [
    (0, "Python Rookie"),
    (100, "Code Explorer"),
    (250, "Python Apprentice"),
    (500, "Syntax Solver"),
    (900, "Logic Builder"),
    (1400, "Debug Detective"),
    (2000, "Python Warrior"),
    (2800, "Code Craftsman"),
    (3800, "Algorithm Ace"),
    (5000, "Python Master"),
]


def calculate_level_info(xp: int) -> Tuple[int, str, int, float]:
    """
    Returns (level, title, xp_to_next_level, progress_percentage_in_current_level)
    """
    current_level = 1
    current_title = LEVEL_TABLE[0][1]
    
    for lvl_idx, (threshold, title) in enumerate(LEVEL_TABLE, start=1):
        if xp >= threshold:
            current_level = lvl_idx
            current_title = title
        else:
            break

    if current_level >= len(LEVEL_TABLE):
        return current_level, current_title, 0, 100.0

    current_threshold = LEVEL_TABLE[current_level - 1][0]
    next_threshold = LEVEL_TABLE[current_level][0]
    xp_in_level = xp - current_threshold
    level_span = next_threshold - current_threshold
    xp_to_next = next_threshold - xp
    progress_pct = round(min(100.0, max(0.0, (xp_in_level / level_span) * 100.0)), 1)

    return current_level, current_title, xp_to_next, progress_pct


async def award_xp(db: AsyncSession, user_id: str, xp_amount: int) -> Tuple[int, int, str, bool]:
    """
    Awards XP to user profile and handles level-up.
    Returns (new_xp, new_level, new_title, did_level_up)
    """
    stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        return 0, 1, "Python Rookie", False

    old_level = profile.level
    profile.xp += xp_amount
    new_level, new_title, _, _ = calculate_level_info(profile.xp)

    did_level_up = new_level > old_level
    profile.level = new_level
    profile.level_title = new_title
    profile.last_active_date = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(profile)

    return profile.xp, new_level, new_title, did_level_up


async def get_or_create_topic_progress(db: AsyncSession, user_id: str, topic_id: str) -> UserTopicProgress:
    stmt = select(UserTopicProgress).where(
        and_(UserTopicProgress.user_id == user_id, UserTopicProgress.topic_id == topic_id)
    )
    res = await db.execute(stmt)
    prog = res.scalar_one_or_none()
    if not prog:
        prog = UserTopicProgress(
            user_id=user_id,
            topic_id=topic_id,
            lesson_completed=False,
            practice_completed=False,
            game_completed=False,
            challenge_completed=False,
            assessment_completed=False,
            assessment_score=0.0,
            is_mastered=False,
        )
        db.add(prog)
        await db.commit()
        await db.refresh(prog)
    return prog


async def check_and_apply_topic_mastery(
    db: AsyncSession,
    user_id: str,
    topic_id: str
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Checks if all learning steps are satisfied and marks topic as mastered.
    If mastered, unlocks the next topic or next world.
    Returns (is_now_mastered, next_unlocked_topic_id, next_unlocked_world_id)
    """
    prog = await get_or_create_topic_progress(db, user_id, topic_id)
    
    # Strict Mastery condition: User MUST complete lesson, practice, game, coding challenge, AND pass assessment >= 70%
    is_ready = (
        prog.lesson_completed and
        prog.practice_completed and
        prog.game_completed and
        prog.challenge_completed and
        prog.assessment_completed and
        (prog.assessment_score or 0.0) >= 0.70
    )

    if not is_ready:
        return prog.is_mastered, None, None

    just_became_mastered = False
    if not prog.is_mastered:
        prog.is_mastered = True
        prog.mastered_at = datetime.now(timezone.utc)
        just_became_mastered = True

    # Flush changes to the current database transaction
    await db.flush()

    # Find current topic and world
    topic_res = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = topic_res.scalar_one_or_none()
    if not topic:
        await db.commit()
        return True, None, None

    # Check for next topic in same world
    next_topic_res = await db.execute(
        select(Topic).where(
            and_(Topic.world_id == topic.world_id, Topic.order_index > topic.order_index)
        ).order_by(Topic.order_index).limit(1)
    )
    next_topic = next_topic_res.scalar_one_or_none()

    next_topic_id = None
    next_world_id = None

    if next_topic:
        next_topic_id = next_topic.id
        # Ensure progress row exists for next topic
        await get_or_create_topic_progress(db, user_id, next_topic.id)

    # Check if all topics in current world are mastered
    world_topics_res = await db.execute(select(Topic).where(Topic.world_id == topic.world_id))
    all_topics = world_topics_res.scalars().all()
    topic_ids = [t.id for t in all_topics]

    user_progs_res = await db.execute(
        select(UserTopicProgress).where(
            and_(
                UserTopicProgress.user_id == user_id,
                UserTopicProgress.topic_id.in_(topic_ids)
            )
        )
    )
    user_progs = user_progs_res.scalars().all()
    mastered_topic_ids = {p.topic_id for p in user_progs if p.is_mastered}
    mastered_topic_ids.add(topic_id)  # Current topic is confirmed mastered

    all_world_topics_mastered = all(tid in mastered_topic_ids for tid in topic_ids)

    if all_world_topics_mastered:
        # Mark current world as completed and unlocked
        curr_w_prog_res = await db.execute(
            select(UserWorldProgress).where(
                and_(UserWorldProgress.user_id == user_id, UserWorldProgress.world_id == topic.world_id)
            )
        )
        curr_w_prog = curr_w_prog_res.scalar_one_or_none()
        if not curr_w_prog:
            curr_w_prog = UserWorldProgress(
                user_id=user_id,
                world_id=topic.world_id,
                is_unlocked=True,
                is_completed=True,
                boss_defeated=False
            )
            db.add(curr_w_prog)
        else:
            curr_w_prog.is_unlocked = True
            curr_w_prog.is_completed = True

        # Find next world in the same mode
        world_res = await db.execute(select(World).where(World.id == topic.world_id))
        curr_world = world_res.scalar_one_or_none()
        if curr_world:
            next_w_res = await db.execute(
                select(World).where(
                    and_(World.mode_id == curr_world.mode_id, World.order_index > curr_world.order_index)
                ).order_by(World.order_index).limit(1)
            )
            next_world = next_w_res.scalar_one_or_none()
            if next_world:
                next_world_id = next_world.id
                nw_prog_res = await db.execute(
                    select(UserWorldProgress).where(
                        and_(UserWorldProgress.user_id == user_id, UserWorldProgress.world_id == next_world.id)
                    )
                )
                nw_prog = nw_prog_res.scalar_one_or_none()
                if not nw_prog:
                    nw_prog = UserWorldProgress(
                        user_id=user_id,
                        world_id=next_world.id,
                        is_unlocked=True,
                        is_completed=False,
                        boss_defeated=False
                    )
                    db.add(nw_prog)
                else:
                    nw_prog.is_unlocked = True

                # Ensure first topic of next world exists and has progress initialized
                first_topic_next_w_res = await db.execute(
                    select(Topic).where(Topic.world_id == next_world.id).order_by(Topic.order_index).limit(1)
                )
                first_topic_next_w = first_topic_next_w_res.scalar_one_or_none()
                if first_topic_next_w:
                    await get_or_create_topic_progress(db, user_id, first_topic_next_w.id)
                    if not next_topic_id:
                        next_topic_id = first_topic_next_w.id

                # Update UserProfile to point to next world
                profile_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
                profile = profile_res.scalar_one_or_none()
                if profile:
                    profile.current_world_id = next_world.id
                    if first_topic_next_w:
                        profile.current_topic_id = first_topic_next_w.id

    await db.commit()
    return prog.is_mastered, next_topic_id, next_world_id


async def check_achievements(db: AsyncSession, user_id: str) -> List[Achievement]:
    """
    Checks and awards newly unlocked achievements for the user.
    """
    earned_new: List[Achievement] = []

    # Get user profile and achievements already earned
    profile_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()
    if not profile:
        return []

    earned_res = await db.execute(
        select(UserAchievement.achievement_id).where(UserAchievement.user_id == user_id)
    )
    earned_ids = set(earned_res.scalars().all())

    all_ach_res = await db.execute(select(Achievement))
    all_achievements = all_ach_res.scalars().all()

    # Get mastered topics count
    mastered_count_res = await db.execute(
        select(func.count(UserTopicProgress.id)).where(
            and_(UserTopicProgress.user_id == user_id, UserTopicProgress.is_mastered == True)
        )
    )
    mastered_count = mastered_count_res.scalar_one() or 0

    for ach in all_achievements:
        if ach.id in earned_ids:
            continue
        
        qualifies = False
        if ach.code == "first_step" and profile.xp >= 20:
            qualifies = True
        elif ach.code == "syntax_starter" and mastered_count >= 1:
            qualifies = True
        elif ach.code == "loop_legend" and mastered_count >= 5:
            qualifies = True
        elif ach.code == "streak_master" and profile.streak_days >= 3:
            qualifies = True
        elif ach.code == "warrior_rank" and profile.level >= 7:
            qualifies = True
        elif ach.code == "beginner_champ" and mastered_count >= 7:
            qualifies = True

        if qualifies:
            user_ach = UserAchievement(
                user_id=user_id,
                achievement_id=ach.id,
                earned_at=datetime.now(timezone.utc)
            )
            db.add(user_ach)
            profile.xp += ach.xp_bonus
            earned_new.append(ach)

    if earned_new:
        await db.commit()

    return earned_new
