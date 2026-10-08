import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)  # "student", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    topic_progress = relationship("UserTopicProgress", back_populates="user", cascade="all, delete-orphan")
    world_progress = relationship("UserWorldProgress", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    skill_scores = relationship("UserSkillTopicScore", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    avatar = Column(String(255), default="🐍", nullable=False)
    bio = Column(Text, default="Eager Python adventurer ready to learn!", nullable=True)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    level_title = Column(String(64), default="Python Rookie", nullable=False)
    streak_days = Column(Integer, default=1, nullable=False)
    last_active_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    current_mode_id = Column(String(64), default="beginner", nullable=False)
    current_world_id = Column(String(64), nullable=True)
    current_topic_id = Column(String(64), nullable=True)
    theme = Column(String(10), default="dark", nullable=False)  # "dark" or "light"

    user = relationship("User", back_populates="profile")
