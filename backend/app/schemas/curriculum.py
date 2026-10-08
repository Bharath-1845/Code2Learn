from typing import Optional, List, Any
from pydantic import BaseModel


class MiniPracticeOut(BaseModel):
    id: str
    topic_id: str
    question_type: str
    prompt: str
    code_snippet: Optional[str] = None
    options: Optional[List[Any]] = None
    explanation: Optional[str] = None
    order_index: int


class MiniPracticeSubmit(BaseModel):
    answers: dict  # {practice_id: answer_val}


class LessonOut(BaseModel):
    id: str
    topic_id: str
    title: str
    content_markdown: str


class TopicOut(BaseModel):
    id: str
    world_id: str
    title: str
    slug: str
    description: Optional[str] = None
    order_index: int
    xp_reward: int
    
    # Progress status for current user
    lesson_completed: bool = False
    practice_completed: bool = False
    game_completed: bool = False
    challenge_completed: bool = False
    assessment_completed: bool = False
    is_mastered: bool = False
    is_unlocked: bool = False


class WorldOut(BaseModel):
    id: str
    mode_id: str
    world_number: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: str
    theme_color: str
    order_index: int
    is_unlocked: bool = False
    is_completed: bool = False
    boss_defeated: bool = False
    topics: List[TopicOut] = []


class ModeOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    order_index: int
    is_unlocked: bool = False
    worlds_count: int = 0
    mastered_topics_count: int = 0
    total_topics_count: int = 0
