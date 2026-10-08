from typing import Optional
from pydantic import BaseModel


class HintRequest(BaseModel):
    challenge_id: str
    user_code: str
    hint_level: int = 1  # 1 (conceptual), 2 (targeted), 3 (actionable)


class HintResponse(BaseModel):
    hint_level: int
    hint: str
    next_level_available: bool


class ExplainRequest(BaseModel):
    topic_id: Optional[str] = None
    concept_title: str
    user_question: str
    user_code: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str
    suggested_exercise: Optional[str] = None


class RecommendResponse(BaseModel):
    recommended_topic_id: str
    recommended_topic_title: str
    reason: str
    suggested_action: str
