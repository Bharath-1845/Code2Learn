import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models.user import User
from app.models.challenge import Game, CodingChallenge, TestCase, BossBattle
from app.models.progress import UserTopicProgress, UserWorldProgress, UserChallengeAttempt
from app.schemas.challenge import (
    CodingChallengeOut,
    TestCaseOut,
    CodeRunRequest,
    CodeRunResult,
    CodeSubmitRequest,
    ChallengeSubmitResult,
    TestCaseResult,
    GameOut,
    GameSubmit,
    BossBattleOut
)
from app.routers.deps import get_current_user
from app.services.sandbox import execute_python_code
from app.services.progression import award_xp, get_or_create_topic_progress, check_and_apply_topic_mastery, check_achievements

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/topic/{topic_id}", response_model=CodingChallengeOut)
async def get_challenge_for_topic(topic_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CodingChallenge).where(CodingChallenge.topic_id == topic_id)
    res = await db.execute(stmt)
    challenge = res.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Coding challenge not found for this topic")

    tc_res = await db.execute(select(TestCase).where(TestCase.challenge_id == challenge.id))
    test_cases = tc_res.scalars().all()

    # Don't show hidden test case expected output to client
    tc_out = [
        TestCaseOut(
            id=tc.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output if not tc.is_hidden else "(Hidden Test Case)",
            is_hidden=tc.is_hidden
        )
        for tc in test_cases
    ]

    concept_q = json.loads(challenge.post_concept_question_json) if challenge.post_concept_question_json else None

    return CodingChallengeOut(
        id=challenge.id,
        topic_id=challenge.topic_id,
        title=challenge.title,
        slug=challenge.slug,
        description=challenge.description,
        instructions=challenge.instructions,
        starter_code=challenge.starter_code,
        difficulty=challenge.difficulty,
        time_limit_seconds=challenge.time_limit_seconds,
        xp_reward=challenge.xp_reward,
        test_cases=tc_out,
        post_concept_question=concept_q
    )


@router.post("/run", response_model=CodeRunResult)
async def run_code(data: CodeRunRequest):
    """Executes arbitrary code in sandboxed Python runner and returns stdout/stderr."""
    result = await execute_python_code(code=data.code, stdin=data.stdin or "", timeout_sec=8)
    return result


@router.post("/submit", response_model=ChallengeSubmitResult)
async def submit_challenge(
    data: CodeSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CodingChallenge).where(CodingChallenge.id == data.challenge_id)
    res = await db.execute(stmt)
    challenge = res.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    tc_res = await db.execute(select(TestCase).where(TestCase.challenge_id == challenge.id))
    test_cases = tc_res.scalars().all()

    if not test_cases:
        raise HTTPException(status_code=400, detail="Challenge has no test cases configured")

    results: List[TestCaseResult] = []
    passed_count = 0
    t0 = time.time()

    for tc in test_cases:
        # Run code against test case input
        run_res = await execute_python_code(
            code=data.code,
            stdin=tc.input_data,
            timeout_sec=challenge.time_limit_seconds or 5
        )

        actual = run_res.stdout.strip()
        expected = tc.expected_output.strip()
        has_error = bool(run_res.stderr.strip())

        passed = (actual == expected) and not has_error
        if passed:
            passed_count += 1

        results.append(
            TestCaseResult(
                test_case_id=tc.id,
                passed=passed,
                input_data=tc.input_data if not tc.is_hidden else "Hidden",
                expected_output=expected if not tc.is_hidden else "Hidden",
                actual_output=actual if not tc.is_hidden else ("Passed" if passed else "Failed"),
                error=run_res.stderr.strip() if run_res.stderr else None,
                is_hidden=tc.is_hidden
            )
        )

    all_passed = passed_count == len(test_cases)
    score = round(passed_count / len(test_cases), 2)
    elapsed_ms = int((time.time() - t0) * 1000)

    # Conceptual check
    concept_correct = None
    if challenge.post_concept_question_json and data.concept_answer is not None:
        try:
            concept_info = json.loads(challenge.post_concept_question_json)
            correct_ans = str(concept_info.get("correct_answer", "")).strip().lower()
            concept_correct = str(data.concept_answer).strip().lower() == correct_ans
        except Exception:
            pass

    # Save attempt
    attempt = UserChallengeAttempt(
        user_id=current_user.id,
        challenge_id=challenge.id,
        code_submitted=data.code,
        passed=all_passed,
        score=score,
        execution_time_ms=elapsed_ms,
        output=json.dumps([r.dict() for r in results])
    )
    db.add(attempt)
    await db.commit()

    xp_earned = 0
    new_total_xp = 0
    new_level = 1
    level_up = False
    topic_mastered = False

    if all_passed:
        prog = await get_or_create_topic_progress(db, current_user.id, challenge.topic_id)
        if not prog.challenge_completed:
            prog.challenge_completed = True
            xp_earned = challenge.xp_reward
            prog.xp_earned += xp_earned
            await db.commit()

            new_total_xp, new_level, _, level_up = await award_xp(db, current_user.id, xp_earned)
            # Check mastery
            topic_mastered, _, _ = await check_and_apply_topic_mastery(db, current_user.id, challenge.topic_id)
            await check_achievements(db, current_user.id)

    return ChallengeSubmitResult(
        passed=all_passed,
        score=score,
        total_test_cases=len(test_cases),
        passed_test_cases=passed_count,
        test_results=results,
        xp_earned=xp_earned,
        new_total_xp=new_total_xp,
        new_level=new_level,
        level_up=level_up,
        topic_mastered=topic_mastered,
        concept_correct=concept_correct
    )


# Games router
@router.get("/game/{topic_id}", response_model=GameOut)
async def get_game_for_topic(topic_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Game).where(Game.topic_id == topic_id)
    res = await db.execute(stmt)
    game = res.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found for this topic")

    config_data = json.loads(game.config_json)
    return GameOut(
        id=game.id,
        topic_id=game.topic_id,
        game_type=game.game_type,
        title=game.title,
        description=game.description,
        instructions=game.instructions,
        config=config_data,
        xp_reward=game.xp_reward
    )


@router.post("/game/{game_id}/submit")
async def submit_game(
    game_id: str,
    data: GameSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Game).where(Game.id == game_id)
    res = await db.execute(stmt)
    game = res.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    xp_earned = 0
    if data.completed and data.score >= 0.6:
        prog = await get_or_create_topic_progress(db, current_user.id, game.topic_id)
        if not prog.game_completed:
            prog.game_completed = True
            xp_earned = game.xp_reward
            prog.xp_earned += xp_earned
            await db.commit()
            await award_xp(db, current_user.id, xp_earned)
            await check_achievements(db, current_user.id)

    return {
        "status": "success",
        "game_completed": data.completed,
        "score": data.score,
        "xp_earned": xp_earned
    }


# Boss Battle endpoints
@router.get("/boss/{world_id}", response_model=BossBattleOut)
async def get_boss_battle(world_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(BossBattle).where(BossBattle.world_id == world_id)
    res = await db.execute(stmt)
    boss = res.scalar_one_or_none()
    if not boss:
        raise HTTPException(status_code=404, detail="Boss battle not found for this world")

    stages = json.loads(boss.challenges_json)
    return BossBattleOut(
        id=boss.id,
        world_id=boss.world_id,
        title=boss.title,
        boss_name=boss.boss_name,
        boss_avatar=boss.boss_avatar,
        description=boss.description,
        storyline=boss.storyline,
        stages=stages,
        xp_reward=boss.xp_reward
    )


@router.post("/boss/{boss_id}/submit")
async def submit_boss_battle(
    boss_id: str,
    passed: bool,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(BossBattle).where(BossBattle.id == boss_id)
    res = await db.execute(stmt)
    boss = res.scalar_one_or_none()
    if not boss:
        raise HTTPException(status_code=404, detail="Boss battle not found")

    xp_earned = 0
    level_up = False
    new_total_xp = 0
    new_level = 1

    if passed:
        # Mark world as boss defeated and completed
        w_res = await db.execute(
            select(UserWorldProgress).where(
                and_(UserWorldProgress.user_id == current_user.id, UserWorldProgress.world_id == boss.world_id)
            )
        )
        wp = w_res.scalar_one_or_none()
        if wp and not wp.boss_defeated:
            wp.boss_defeated = True
            wp.is_completed = True
            xp_earned = boss.xp_reward
            new_total_xp, new_level, _, level_up = await award_xp(db, current_user.id, xp_earned)
            await check_achievements(db, current_user.id)

    return {
        "passed": passed,
        "xp_earned": xp_earned,
        "new_total_xp": new_total_xp,
        "new_level": new_level,
        "level_up": level_up
    }
