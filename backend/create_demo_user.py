import asyncio
import os
import sys
from datetime import datetime, timezone

# Ensure Cython cext is disabled for Windows policy
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserProfile
from app.models.curriculum import Topic, World
from app.models.progress import (
    UserTopicProgress,
    UserWorldProgress,
    Achievement,
    UserAchievement,
    UserSkillTopicScore
)


async def create_demo_users():
    async with AsyncSessionLocal() as db:
        print("Creating demo users...")

        # 1. Student Demo User
        student_email = "demo@code2learn.dev"
        res = await db.execute(select(User).where(User.email == student_email))
        student = res.scalar_one_or_none()

        if not student:
            student = User(
                email=student_email,
                username="CodeExplorer",
                hashed_password=get_password_hash("demouser123"),
                role="student",
                is_active=True
            )
            db.add(student)
            await db.flush()

            # Profile with realistic progress: Level 3, 420 XP, 4-day streak
            profile = UserProfile(
                user_id=student.id,
                avatar="🧙",
                bio="Adventurer on a quest to master all 7 Python realms!",
                xp=420,
                level=3,
                level_title="Python Apprentice",
                streak_days=4,
                current_mode_id="beginner",
                current_world_id="world-2-variables",
                current_topic_id="topic-variables-types",
                theme="dark"
            )
            db.add(profile)

            # World 1 completed & World 2 unlocked
            w1 = UserWorldProgress(
                user_id=student.id,
                world_id="world-1-foundations",
                is_unlocked=True,
                is_completed=True,
                boss_defeated=False
            )
            w2 = UserWorldProgress(
                user_id=student.id,
                world_id="world-2-variables",
                is_unlocked=True,
                is_completed=False,
                boss_defeated=False
            )
            db.add_all([w1, w2])

            # Topic 1 (Intro) Mastered
            t1_prog = UserTopicProgress(
                user_id=student.id,
                topic_id="topic-intro-python",
                lesson_completed=True,
                practice_completed=True,
                game_completed=True,
                challenge_completed=True,
                assessment_completed=True,
                assessment_score=0.92,
                is_mastered=True,
                mastered_at=datetime.now(timezone.utc),
                xp_earned=245
            )
            # Topic 2 (Variables) In Progress
            t2_prog = UserTopicProgress(
                user_id=student.id,
                topic_id="topic-variables-types",
                lesson_completed=True,
                practice_completed=True,
                game_completed=False,
                challenge_completed=False,
                assessment_completed=False,
                assessment_score=0.0,
                is_mastered=False,
                xp_earned=40
            )
            db.add_all([t1_prog, t2_prog])

            # Skill scores
            s1 = UserSkillTopicScore(
                user_id=student.id,
                topic_id="topic-intro-python",
                skill_percentage=92.0
            )
            s2 = UserSkillTopicScore(
                user_id=student.id,
                topic_id="topic-variables-types",
                skill_percentage=75.0
            )
            db.add_all([s1, s2])

            # Achievements: First Step, Syntax Starter, On Fire
            for ach_id in ["ach-first-step", "ach-syntax-starter", "ach-streak-master"]:
                ach_rec = await db.execute(select(Achievement).where(Achievement.id == ach_id))
                if ach_rec.scalar_one_or_none():
                    db.add(UserAchievement(
                        user_id=student.id,
                        achievement_id=ach_id,
                        earned_at=datetime.now(timezone.utc)
                    ))

            print("[OK] Created Student Demo User: demo@code2learn.dev / demouser123")
        else:
            print("Student demo user already exists.")

        # 2. Admin Demo User
        admin_email = "admin@code2learn.dev"
        admin_res = await db.execute(select(User).where(User.email == admin_email))
        admin = admin_res.scalar_one_or_none()

        if not admin:
            admin = User(
                email=admin_email,
                username="AdminMaster",
                hashed_password=get_password_hash("adminpassword123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            await db.flush()

            admin_prof = UserProfile(
                user_id=admin.id,
                avatar="👑",
                bio="Code2Learn Platform Overseer",
                xp=2500,
                level=7,
                level_title="Python Warrior",
                streak_days=14,
                current_mode_id="beginner",
                current_world_id="world-1-foundations",
                current_topic_id="topic-intro-python",
                theme="dark"
            )
            db.add(admin_prof)

            # Initialize World 1 for admin
            db.add(UserWorldProgress(
                user_id=admin.id,
                world_id="world-1-foundations",
                is_unlocked=True,
                is_completed=False,
                boss_defeated=False
            ))

            print("[OK] Created Admin Demo User: admin@code2learn.dev / adminpassword123")
        else:
            print("Admin demo user already exists.")

        await db.commit()
        print("Demo users ready!")


if __name__ == "__main__":
    asyncio.run(create_demo_users())
