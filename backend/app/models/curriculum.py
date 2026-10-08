import uuid
from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Mode(Base):
    __tablename__ = "modes"

    id = Column(String(64), primary_key=True)  # "beginner", "intermediate", "advanced"
    name = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    is_locked_by_default = Column(Boolean, default=True, nullable=False)

    worlds = relationship("World", back_populates="mode", cascade="all, delete-orphan", order_by="World.order_index")


class World(Base):
    __tablename__ = "worlds"

    id = Column(String(64), primary_key=True)  # e.g. "world-1-foundations"
    mode_id = Column(String(64), ForeignKey("modes.id"), nullable=False)
    world_number = Column(Integer, nullable=False)
    name = Column(String(128), nullable=False)
    slug = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(32), default="🌐", nullable=False)
    theme_color = Column(String(32), default="#4F46E5", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    mode = relationship("Mode", back_populates="worlds")
    topics = relationship("Topic", back_populates="world", cascade="all, delete-orphan", order_by="Topic.order_index")
    boss_battle = relationship("BossBattle", back_populates="world", uselist=False, cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(64), primary_key=True)  # e.g. "topic-variables-data"
    world_id = Column(String(64), ForeignKey("worlds.id"), nullable=False)
    title = Column(String(128), nullable=False)
    slug = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    xp_reward = Column(Integer, default=50, nullable=False)

    world = relationship("World", back_populates="topics")
    lesson = relationship("Lesson", back_populates="topic", uselist=False, cascade="all, delete-orphan")
    mini_practices = relationship("MiniPractice", back_populates="topic", cascade="all, delete-orphan", order_by="MiniPractice.order_index")
    games = relationship("Game", back_populates="topic", cascade="all, delete-orphan")
    challenges = relationship("CodingChallenge", back_populates="topic", cascade="all, delete-orphan")
    assessment = relationship("Assessment", back_populates="topic", uselist=False, cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(64), primary_key=True)
    topic_id = Column(String(64), ForeignKey("topics.id"), unique=True, nullable=False)
    title = Column(String(128), nullable=False)
    content_markdown = Column(Text, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    topic = relationship("Topic", back_populates="lesson")


class MiniPractice(Base):
    __tablename__ = "mini_practices"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    question_type = Column(String(32), default="mcq", nullable=False)  # mcq, predict_output, fill_blank, arrange_code
    prompt = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options_json = Column(Text, nullable=True)  # JSON string array
    correct_answer_json = Column(Text, nullable=False)  # JSON string or value
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    topic = relationship("Topic", back_populates="mini_practices")
