from typing import Optional, List, Any
from pydantic import BaseModel


class GameOut(BaseModel):
    id: str
    topic_id: str
    game_type: str
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    config: Any
    xp_reward: int


class GameSubmit(BaseModel):
    score: float = 1.0
    completed: bool = True
    time_taken_seconds: int = 60


class TestCaseOut(BaseModel):
    id: str
    input_data: str
    expected_output: str
    is_hidden: bool = False


class CodingChallengeOut(BaseModel):
    id: str
    topic_id: str
    title: str
    slug: str
    description: str
    instructions: str
    starter_code: str
    difficulty: str
    time_limit_seconds: int
    xp_reward: int
    test_cases: List[TestCaseOut] = []
    post_concept_question: Optional[Any] = None


class CodeRunRequest(BaseModel):
    code: str
    stdin: Optional[str] = ""


class CodeRunResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int = 0


class CodeSubmitRequest(BaseModel):
    challenge_id: str
    code: str
    concept_answer: Optional[str] = None


class TestCaseResult(BaseModel):
    test_case_id: str
    passed: bool
    input_data: str
    expected_output: str
    actual_output: str
    error: Optional[str] = None
    is_hidden: bool = False


class ChallengeSubmitResult(BaseModel):
    passed: bool
    score: float
    total_test_cases: int
    passed_test_cases: int
    test_results: List[TestCaseResult]
    xp_earned: int = 0
    new_total_xp: int = 0
    new_level: int = 1
    level_up: bool = False
    topic_mastered: bool = False
    concept_correct: Optional[bool] = None


class BossBattleOut(BaseModel):
    id: str
    world_id: str
    title: str
    boss_name: str
    boss_avatar: str
    description: str
    storyline: str
    stages: List[Any]
    xp_reward: int
