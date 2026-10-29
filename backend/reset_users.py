import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure Cython cext is disabled for Windows policy
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from app.core.security import get_password_hash
import sqlite3

db_path = "code2learn.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Clear all user data tables
user_tables = [
    "user_challenge_attempts",
    "user_assessment_attempts",
    "user_topic_progress",
    "user_world_progress",
    "user_skill_topic_scores",
    "user_achievements",
    "user_profiles",
    "users",
]

print("Deleting all existing users and progress data...")
for t in user_tables:
    cur.execute(f"DELETE FROM {t};")
    print(f"  - Cleared {t}")

# 2. Create fresh admin credentials
admin_id = str(uuid.uuid4())
admin_email = "admin@code2learn.com"
admin_username = "admin"
admin_password = "admin123"
hashed_pwd = get_password_hash(admin_password)
now = datetime.now(timezone.utc).isoformat()

cur.execute("""
    INSERT INTO users (id, email, username, hashed_password, role, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
""", (admin_id, admin_email, admin_username, hashed_pwd, "admin", 1, now))

# 3. Create fresh admin profile
profile_id = str(uuid.uuid4())
cur.execute("""
    INSERT INTO user_profiles (
        id, user_id, avatar, bio, xp, level, level_title, streak_days,
        last_active_date, current_mode_id, theme
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
""", (
    profile_id, admin_id, "👑", "System Administrator", 0, 1, "Platform Admin", 1,
    now, "beginner", "dark"
))

conn.commit()
conn.close()

print("\nSUCCESS!")
print(f"Created fresh admin user:")
print(f"  Email:    {admin_email}")
print(f"  Username: {admin_username}")
print(f"  Password: {admin_password}")
