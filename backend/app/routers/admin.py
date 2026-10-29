from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.user import User, UserProfile
from app.models.curriculum import Topic, World
from app.models.progress import UserChallengeAttempt, UserTopicProgress
from app.routers.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar_one() or 0

    total_attempts_res = await db.execute(select(func.count(UserChallengeAttempt.id)))
    total_attempts = total_attempts_res.scalar_one() or 0

    passed_attempts_res = await db.execute(
        select(func.count(UserChallengeAttempt.id)).where(UserChallengeAttempt.passed == True)
    )
    passed_attempts = passed_attempts_res.scalar_one() or 0

    mastered_count_res = await db.execute(
        select(func.count(UserTopicProgress.id)).where(UserTopicProgress.is_mastered == True)
    )
    mastered_count = mastered_count_res.scalar_one() or 0

    return {
        "total_users": total_users,
        "total_challenge_submissions": total_attempts,
        "successful_submissions": passed_attempts,
        "success_rate": round((passed_attempts / max(total_attempts, 1)) * 100, 1),
        "total_topics_mastered": mastered_count
    }


@router.get("/users")
async def list_users(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User, UserProfile).outerjoin(UserProfile, User.id == UserProfile.user_id)
    res = await db.execute(stmt)
    rows = res.all()

    users_list = []
    for user, profile in rows:
        users_list.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "xp": profile.xp if profile else 0,
            "level": profile.level if profile else 1,
            "level_title": profile.level_title if profile else "Python Rookie",
            "streak_days": profile.streak_days if profile else 1,
        })
    return users_list


@router.post("/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active admin account.")

    res = await db.execute(select(User).where(User.id == user_id))
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(target_user)
    await db.commit()
    return {"status": "success", "message": f"User {target_user.username} deleted successfully"}

