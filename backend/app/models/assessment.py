import uuid
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(64), ForeignKey("topics.id"), unique=True, nullable=False)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    passing_threshold = Column(Float, default=0.75, nullable=False)  # 75%
    time_limit_minutes = Column(Integer, default=15, nullable=False)
    xp_reward = Column(Integer, default=100, nullable=False)

    topic = relationship("Topic", back_populates="assessment")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(64), ForeignKey("assessments.id"), nullable=False)
    topic_id = Column(String(64), ForeignKey("topics.id"), nullable=False)
    question_type = Column(String(32), default="mcq", nullable=False)  # mcq, output_prediction, debugging, code_completion
    prompt = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options_json = Column(Text, nullable=True)  # JSON list of options
    correct_answer_json = Column(Text, nullable=False)  # JSON correct answer
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(20), default="medium", nullable=False)  # easy, medium, hard

    assessment = relationship("Assessment", back_populates="questions")
