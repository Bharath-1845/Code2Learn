import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    
    lesson_completed = Column(Boolean, default=False, nullable=False)
    practice_completed = Column(Boolean, default=False, nullable=False)
    game_completed = Column(Boolean, default=False, nullable=False)
    challenge_completed = Column(Boolean, default=False, nullable=False)
    assessment_completed = Column(Boolean, default=False, nullable=False)
    
    assessment_score = Column(Float, default=0.0, nullable=False)
    is_mastered = Column(Boolean, default=False, nullable=False)
    mastered_at = Column(DateTime, nullable=True)
    xp_earned = Column(Integer, default=0, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="topic_progress")


class UserWorldProgress(Base):
    __tablename__ = "user_world_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    world_id = Column(String(64), ForeignKey("worlds.id"), nullable=False)
    is_unlocked = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    boss_defeated = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="world_progress")


class UserChallengeAttempt(Base):
    __tablename__ = "user_challenge_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(String(64), ForeignKey("coding_challenges.id"), nullable=False)
    code_submitted = Column(Text, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    score = Column(Float, default=0.0, nullable=False)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    output = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    challenge = relationship("CodingChallenge", back_populates="attempts")


class UserAssessmentAttempt(Base):
    __tablename__ = "user_assessment_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(64), ForeignKey("assessments.id"), nullable=False)
    topic_id = Column(String(64), nullable=False)
    score = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    answers_json = Column(Text, nullable=False)
    taken_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(64), primary_key=True)  # e.g. "ach-hello-world"
    code = Column(String(64), unique=True, nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(32), default="🏆", nullable=False)
    category = Column(String(32), default="general", nullable=False)
    xp_bonus = Column(Integer, default=50, nullable=False)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(String(64), ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")


class UserSkillTopicScore(Base):
    __tablename__ = "user_skill_topic_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    skill_percentage = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0

    user = relationship("User", back_populates="skill_scores")
