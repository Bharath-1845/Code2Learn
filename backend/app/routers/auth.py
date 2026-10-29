from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserProfile
from app.models.progress import UserWorldProgress, UserTopicProgress
from app.schemas.user import UserRegister, UserLogin, Token, UserOut, UserProfileUpdate
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check existing user
    stmt = select(User).where(or_(User.email == data.email.lower(), User.username == data.username))
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        if existing.email == data.email.lower():
            raise HTTPException(status_code=400, detail="Email is already registered")
        raise HTTPException(status_code=400, detail="Username is already taken")

    # Determine role (first user or admin email can be admin if desired)
    user_count_res = await db.execute(select(User))
    is_first_user = len(user_count_res.scalars().all()) == 0
    role = "admin" if is_first_user else "student"

    new_user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=get_password_hash(data.password),
        role=role,
    )
    db.add(new_user)
    await db.flush()

    # Create profile
    profile = UserProfile(
        user_id=new_user.id,
        avatar="🐍",
        bio="Eager Python adventurer ready to master the code!",
        xp=0,
        level=1,
        level_title="Python Rookie",
        streak_days=1,
        current_mode_id="beginner",
        current_world_id="world-1-foundations",
        current_topic_id="topic-intro-python",
        theme="dark"
    )
    db.add(profile)

    # Unlock World 1 by default
    w1_prog = UserWorldProgress(
        user_id=new_user.id,
        world_id="world-1-foundations",
        is_unlocked=True,
        is_completed=False,
        boss_defeated=False
    )
    db.add(w1_prog)

    # Initialize first topic progress
    t1_prog = UserTopicProgress(
        user_id=new_user.id,
        topic_id="topic-intro-python",
        lesson_completed=False,
        practice_completed=False,
        game_completed=False,
        challenge_completed=False,
        assessment_completed=False,
        is_mastered=False
    )
    db.add(t1_prog)

    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role
    )


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    ident = data.email.strip().lower()

    # Match by email, username, or demo alias
    conditions = [
        func.lower(User.email) == ident,
        func.lower(User.username) == ident
    ]
    if ident in ["demo", "student", "codeexplorer"]:
        conditions.append(func.lower(User.email) == "demo@code2learn.dev")
    elif ident in ["admin", "adminmaster"]:
        conditions.append(func.lower(User.email) == "admin@code2learn.dev")

    stmt = select(User).where(or_(*conditions))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please check your username or email."
        )

    # Password validation: standard hash check + fallback aliases for demo accounts
    is_valid_password = verify_password(data.password, user.hashed_password)

    if not is_valid_password:
        if user.email == "demo@code2learn.dev" and data.password in ["demouser123", "demo", "demo123"]:
            is_valid_password = True
        elif user.email == "admin@code2learn.dev" and data.password in ["adminpassword123", "admin", "admin123"]:
            is_valid_password = True

    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password."
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    # Update streak/last active if on different calendar day
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        now = datetime.now(timezone.utc)
        if profile.last_active_date.date() < now.date():
            days_diff = (now.date() - profile.last_active_date.date()).days
            if days_diff == 1:
                profile.streak_days += 1
            elif days_diff > 1:
                profile.streak_days = 1
        profile.last_active_date = now
        await db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    current_user.profile = profile
    return current_user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        if data.avatar is not None:
            profile.avatar = data.avatar
        if data.bio is not None:
            profile.bio = data.bio
        if data.theme is not None:
            profile.theme = data.theme
        await db.commit()
        await db.refresh(profile)
    current_user.profile = profile
    return current_user
