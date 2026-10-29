from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str = Field(..., description="Email or Username")
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    user_id: str
    username: str
    role: str


class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None


class UserProfileOut(BaseModel):
    avatar: str
    bio: Optional[str] = None
    xp: int
    level: int
    level_title: str
    streak_days: int
    current_mode_id: str
    current_world_id: Optional[str] = None
    current_topic_id: Optional[str] = None
    theme: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    profile: Optional[UserProfileOut] = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    avatar: Optional[str] = None
    bio: Optional[str] = None
    theme: Optional[str] = None
