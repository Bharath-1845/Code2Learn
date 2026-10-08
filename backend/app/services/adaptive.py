import random
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.assessment import Question
from app.models.progress import UserTopicProgress, UserSkillTopicScore
from app.models.curriculum import Topic


async def get_adaptive_questions_for_topic(
    db: AsyncSession,
    topic_id: str,
    user_id: str,
    max_questions: int = 5
) -> List[Question]:
    """
    Selects questions dynamically:
    - If user has struggled previously, prioritizes easy/medium questions.
    - If user has scored high, mixes medium and hard questions.
    - Shuffles pool to prevent identical consecutive attempts.
    """
    # Check skill score
    skill_stmt = select(UserSkillTopicScore).where(
        and_(UserSkillTopicScore.user_id == user_id, UserSkillTopicScore.topic_id == topic_id)
    )
    skill_res = await db.execute(skill_stmt)
    skill_rec = skill_res.scalar_one_or_none()
    current_skill = skill_rec.skill_percentage if skill_rec else 50.0

    # Fetch all questions for this topic
    q_stmt = select(Question).where(Question.topic_id == topic_id)
    all_q_res = await db.execute(q_stmt)
    all_questions = list(all_q_res.scalars().all())

    if not all_questions:
        return []

    if len(all_questions) <= max_questions:
        random.shuffle(all_questions)
        return all_questions

    # Group by difficulty
    easy_q = [q for q in all_questions if q.difficulty == "easy"]
    med_q = [q for q in all_questions if q.difficulty == "medium"]
    hard_q = [q for q in all_questions if q.difficulty == "hard"]

    selected = []
    if current_skill < 60.0:
        # Beginners / struggling: 3 easy, 2 medium
        selected.extend(random.sample(easy_q, min(3, len(easy_q))))
        selected.extend(random.sample(med_q, min(2, len(med_q))))
    elif current_skill > 80.0:
        # Advanced: 1 easy, 2 medium, 2 hard
        selected.extend(random.sample(hard_q, min(2, len(hard_q))))
        selected.extend(random.sample(med_q, min(2, len(med_q))))
        selected.extend(random.sample(easy_q, min(1, len(easy_q))))
    else:
        # Balanced: 2 easy, 2 medium, 1 hard
        selected.extend(random.sample(easy_q, min(2, len(easy_q))))
        selected.extend(random.sample(med_q, min(2, len(med_q))))
        selected.extend(random.sample(hard_q, min(1, len(hard_q))))

    # Fill remaining if needed
    if len(selected) < max_questions:
        remaining = [q for q in all_questions if q not in selected]
        random.shuffle(remaining)
        selected.extend(remaining[:max_questions - len(selected)])

    random.shuffle(selected)
    return selected[:max_questions]


async def update_skill_score(
    db: AsyncSession,
    user_id: str,
    topic_id: str,
    score_pct: float
) -> float:
    """Updates the moving skill percentage for a student on a specific topic."""
    stmt = select(UserSkillTopicScore).where(
        and_(UserSkillTopicScore.user_id == user_id, UserSkillTopicScore.topic_id == topic_id)
    )
    res = await db.execute(stmt)
    skill_rec = res.scalar_one_or_none()

    if not skill_rec:
        new_val = round(score_pct, 1)
        skill_rec = UserSkillTopicScore(
            user_id=user_id,
            topic_id=topic_id,
            skill_percentage=new_val
        )
        db.add(skill_rec)
    else:
        # Weighted average: 40% old + 60% new
        new_val = round((skill_rec.skill_percentage * 0.4) + (score_pct * 0.6), 1)
        skill_rec.skill_percentage = min(100.0, max(0.0, new_val))

    await db.commit()
    await db.refresh(skill_rec)
    return skill_rec.skill_percentage
