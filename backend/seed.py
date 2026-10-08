import os
import sys
import asyncio

# Disable Cython C extensions to run in pure Python mode under Windows AppLocker/Control policies
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from app.core.database import engine, Base, AsyncSessionLocal
from app.seed.seed_data import seed_database


async def test_init():
    print("Initializing tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")

    print("Seeding database...")
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(test_init())
