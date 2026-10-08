from typing import Optional, List, Any
from pydantic import BaseModel


class QuestionOut(BaseModel):
    id: str
    assessment_id: str
    question_type: str
    prompt: str
    code_snippet: Optional[str] = None
    options: Optional[List[Any]] = None
    difficulty: str


class AssessmentOut(BaseModel):
    id: str
    topic_id: str
    title: str
    description: Optional[str] = None
    passing_threshold: float
    time_limit_minutes: int
    xp_reward: int
    questions: List[QuestionOut] = []


class QuestionAnswerItem(BaseModel):
    question_id: str
    answer: Any


class AssessmentSubmitRequest(BaseModel):
    answers: List[QuestionAnswerItem]
    time_taken_seconds: int = 0


class QuestionFeedback(BaseModel):
    question_id: str
    is_correct: bool
    user_answer: Any
    correct_answer: Any
    explanation: Optional[str] = None


class AssessmentResultOut(BaseModel):
    passed: bool
    score_percentage: float
    passing_threshold: float
    total_questions: int
    correct_count: int
    feedback: List[QuestionFeedback]
    xp_earned: int = 0
    new_total_xp: int = 0
    new_level: int = 1
    topic_mastered: bool = False
    next_unlocked_topic_id: Optional[str] = None
    next_unlocked_world_id: Optional[str] = None
