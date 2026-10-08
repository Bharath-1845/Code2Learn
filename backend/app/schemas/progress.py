from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SkillItem(BaseModel):
    topic_id: str
    topic_title: str
    percentage: float


class AchievementOut(BaseModel):
    id: str
    code: str
    title: str
    description: str
    icon: str
    category: str
    xp_bonus: int
    unlocked: bool = False
    earned_at: Optional[datetime] = None


class ActivityHistoryItem(BaseModel):
    id: str
    activity_type: str  # lesson, game, challenge, assessment
    title: str
    xp_earned: int
    timestamp: datetime


class DashboardOut(BaseModel):
    username: str
    avatar: str
    xp: int
    level: int
    level_title: str
    xp_to_next_level: int
    xp_progress_percentage: float
    streak_days: int
    current_mode_id: str
    current_world_id: Optional[str] = None
    current_world_name: Optional[str] = None
    current_topic_id: Optional[str] = None
    current_topic_title: Optional[str] = None
    mastered_topics_count: int
    total_topics_count: int
    overall_progress_percentage: float
    skills: List[SkillItem]
    recent_achievements: List[AchievementOut]
    weak_topics: List[SkillItem]
