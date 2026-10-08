import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    game_type = Column(String(32), nullable=False)  # "quiz", "mission", "debug", "data_collector", "operator_arena"
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    config_json = Column(Text, nullable=False)  # JSON configuration for game state/items/levels
    xp_reward = Column(Integer, default=50, nullable=False)

    topic = relationship("Topic", back_populates="games")


class CodingChallenge(Base):
    __tablename__ = "coding_challenges"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    title = Column(String(128), nullable=False)
    slug = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=False)
    solution_code = Column(Text, nullable=True)
    difficulty = Column(String(20), default="easy", nullable=False)  # "easy", "medium", "hard"
    time_limit_seconds = Column(Integer, default=300, nullable=False)
    xp_reward = Column(Integer, default=75, nullable=False)
    post_concept_question_json = Column(Text, nullable=True)  # Conceptual check question JSON

    topic = relationship("Topic", back_populates="challenges")
    test_cases = relationship("TestCase", back_populates="challenge", cascade="all, delete-orphan")
    attempts = relationship("UserChallengeAttempt", back_populates="challenge", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String(64), ForeignKey("coding_challenges.id"), nullable=False)
    input_data = Column(Text, default="", nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)

    challenge = relationship("CodingChallenge", back_populates="test_cases")


class BossBattle(Base):
    __tablename__ = "boss_battles"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    world_id = Column(String(64), ForeignKey("worlds.id"), unique=True, nullable=False)
    title = Column(String(128), nullable=False)
    boss_name = Column(String(128), nullable=False)
    boss_avatar = Column(String(32), default="👹", nullable=False)
    description = Column(Text, nullable=False)
    storyline = Column(Text, nullable=False)
    challenges_json = Column(Text, nullable=False)  # Array of multi-concept challenge stages
    xp_reward = Column(Integer, default=200, nullable=False)

    world = relationship("World", back_populates="boss_battle")
