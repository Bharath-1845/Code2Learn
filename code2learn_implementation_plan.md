# Code2Learn — Implementation Plan

## Goal Description

Build **Code2Learn**: a full-stack, gamified Python learning platform where learners progress through a mastery-driven loop of **Learn → Practice → Play → Code → Assess → Master → Unlock**. The platform covers 7 Beginner worlds + a Boss Battle, with XP/leveling, adaptive difficulty, an AI hint system, and sandboxed Python code execution.

---

## Confirmed Technical Decisions

| Decision | Choice |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | PostgreSQL 15 + SQLAlchemy 2.0 + Alembic |
| **Code Sandbox** | Docker-based (Piston API — self-hosted) |
| **AI Provider** | Google Gemini API (gemini-1.5-flash) |
| **Auth** | JWT (access + refresh tokens) + bcrypt |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **MVP Content** | All 7 Beginner worlds + Boss Battle (seeded) |
| **Deployment** | Docker Compose (local dev) |
| **UI Theme** | Dark + Light with toggle |
| **ORM** | SQLAlchemy 2.0 async + Alembic |

---

## User Review Required

> [!IMPORTANT]
> **Complete project scope** means all 7 worlds + boss battle with real content (lessons, questions, games, coding challenges, assessments). This is a large amount of content to write. The plan will structure it so content can be seeded in phases, but the platform shell will support all of it from day one.

> [!WARNING]
> **Docker requirement**: The sandboxed code execution uses Docker. You must have Docker Desktop installed and running on your machine. If Docker is unavailable, we can fall back to the Piston API public instance temporarily.

> [!IMPORTANT]
> **Gemini API Key**: You'll need a Google Gemini API key for the AI hint/assistant features. Set it in the `.env` file.

---

## Open Questions

> [!IMPORTANT]
> Do you want a **leaderboard** in the MVP (even a basic one), or strictly defer it to post-MVP as the PRD suggests?

> [!IMPORTANT]
> Should the **Admin panel** be a separate Next.js route (`/admin/*`) or a completely separate application?

---

## Repository Structure

```
code2learn/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # login, register, onboarding
│   │   │   ├── (dashboard)/    # student dashboard
│   │   │   ├── learn/          # lesson pages
│   │   │   ├── game/           # game pages
│   │   │   ├── code/           # coding challenge pages
│   │   │   ├── assess/         # assessment pages
│   │   │   ├── admin/          # admin panel
│   │   │   └── profile/        # user profile
│   │   ├── components/
│   │   │   ├── ui/             # reusable UI primitives
│   │   │   ├── editor/         # Monaco editor wrapper
│   │   │   ├── game/           # game components
│   │   │   ├── dashboard/      # dashboard widgets
│   │   │   └── layout/         # nav, sidebar, theme toggle
│   │   ├── lib/                # API client, auth helpers
│   │   ├── hooks/              # custom React hooks
│   │   ├── store/              # Zustand global state
│   │   └── styles/             # global CSS, theme tokens
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py        # settings (pydantic-settings)
│   │   │   ├── security.py      # JWT, bcrypt
│   │   │   └── database.py      # async engine, session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── curriculum.py
│   │   │   ├── progress.py
│   │   │   ├── games.py
│   │   │   ├── challenges.py
│   │   │   ├── assessments.py
│   │   │   ├── ai.py
│   │   │   └── admin.py
│   │   ├── services/            # business logic
│   │   │   ├── progression.py   # XP, levels, unlocks
│   │   │   ├── sandbox.py       # code execution via Piston
│   │   │   ├── ai_service.py    # Gemini API calls
│   │   │   ├── adaptive.py      # difficulty & recommendations
│   │   │   └── mastery.py       # mastery calculation
│   │   └── seed/                # database seed scripts
│   │       ├── seed_curriculum.py
│   │       └── content/         # JSON content files per world
│   ├── alembic/                 # migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── sandbox/                     # Piston self-hosted runner
│   └── docker-compose.yml
│
└── nginx/                       # reverse proxy config
    └── nginx.conf
```

---

## Proposed Changes

### Phase 1 — Project Scaffolding & Infrastructure

#### [NEW] `docker-compose.yml`
Orchestrates: PostgreSQL, FastAPI backend, Next.js frontend, Piston sandbox, Nginx.

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: code2learn
      POSTGRES_USER: c2l_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://c2l_user:${POSTGRES_PASSWORD}@postgres:5432/code2learn
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - piston

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

  piston:
    image: ghcr.io/engineer-man/piston
    ports:
      - "2000:2000"
    volumes:
      - piston_data:/piston
```

---

### Phase 2 — Database Schema (SQLAlchemy Models)

#### [NEW] `backend/app/models/` — Core Models

**Users & Auth**
```python
class User(Base):
    id: UUID
    email: str (unique)
    username: str (unique)
    hashed_password: str
    role: Enum("student", "admin")
    is_active: bool
    created_at: datetime

class UserProfile(Base):
    user_id: UUID (FK → User)
    avatar: str
    bio: str
    xp: int (default 0)
    level: int (default 1)
    streak_days: int
    last_active: datetime
    current_mode: Enum("beginner", "intermediate", "advanced")
    current_world_id: UUID
    current_topic_id: UUID
    theme: Enum("dark", "light") (default "dark")
```

**Curriculum Hierarchy**
```python
class Mode(Base):         # Beginner / Intermediate / Advanced
    id, name, order, is_locked_by_default

class World(Base):        # World 1–7 per mode
    id, mode_id, name, description, order, game_theme, boss_battle_id

class Topic(Base):        # e.g. "for loops"
    id, world_id, name, description, order, xp_reward

class Lesson(Base):       # concept explanation + examples
    id, topic_id, title, content_markdown, order

class MiniPractice(Base): # fill-in, predict-output, etc.
    id, topic_id, question_type, content_json, answer_json, order
```

**Games & Challenges**
```python
class Game(Base):
    id, topic_id, game_type, title, config_json, xp_reward

class CodingChallenge(Base):
    id, topic_id, title, description, starter_code
    difficulty: Enum("easy", "medium", "hard")
    xp_reward, time_limit_seconds

class TestCase(Base):
    id, challenge_id, input_data, expected_output, is_hidden

class BossBattle(Base):
    id, world_id, title, description, config_json, xp_reward
```

**Assessment**
```python
class Question(Base):
    id, topic_id, question_type (mcq/code/debug/output/fill)
    content_json, answer_json
    difficulty: Enum("easy", "medium", "hard")
    explanation: str

class Assessment(Base):
    id, topic_id (or world_id for boss)
    passing_threshold: float (e.g. 0.75)
    time_limit_minutes: int
```

**Progress & Gamification**
```python
class UserProgress(Base):    # per topic/world/mode
    user_id, topic_id, world_id
    lesson_done, practice_done, game_done, challenge_done
    assessment_score, is_mastered
    attempts, xp_earned

class UserSkillProfile(Base): # per topic skill %
    user_id, topic_id, skill_percentage

class Achievement(Base):
    id, name, description, icon, condition_type, condition_value, xp_bonus

class UserAchievement(Base):
    user_id, achievement_id, earned_at

class ChallengeSubmission(Base):
    user_id, challenge_id, code, passed, score
    time_taken_seconds, submitted_at

class HintUsage(Base):
    user_id, challenge_id, hint_level, used_at
```

---

### Phase 3 — FastAPI Backend Routers

#### [NEW] `backend/app/routers/auth.py`
- `POST /auth/register` — register new user
- `POST /auth/login` — returns access + refresh JWT
- `POST /auth/refresh` — refresh access token
- `POST /auth/logout`
- `GET /auth/me` — current user info

#### [NEW] `backend/app/routers/curriculum.py`
- `GET /curriculum/modes` — list modes with lock status for user
- `GET /curriculum/worlds/{mode_id}` — list worlds
- `GET /curriculum/topics/{world_id}` — list topics with user progress
- `GET /curriculum/lesson/{topic_id}` — full lesson content
- `GET /curriculum/mini-practice/{topic_id}` — practice questions

#### [NEW] `backend/app/routers/games.py`
- `GET /games/{topic_id}` — get game config
- `POST /games/{game_id}/submit` — submit game result, award XP

#### [NEW] `backend/app/routers/challenges.py`
- `GET /challenges/{topic_id}` — get coding challenge
- `POST /challenges/{challenge_id}/run` — run code (no save)
- `POST /challenges/{challenge_id}/submit` — evaluate + save result
- `GET /challenges/{challenge_id}/hint` — get next hint via AI

#### [NEW] `backend/app/routers/assessments.py`
- `GET /assessments/{topic_id}/questions` — get randomized question set
- `POST /assessments/{topic_id}/submit` — grade, update mastery, award XP

#### [NEW] `backend/app/routers/ai.py`
- `POST /ai/hint` — contextual hint for challenge
- `POST /ai/explain` — explain a concept
- `POST /ai/recommend` — personalized topic recommendation

#### [NEW] `backend/app/routers/progress.py`
- `GET /progress/dashboard` — full dashboard data
- `GET /progress/profile` — user profile + stats
- `GET /progress/skill-profile` — skill percentages per topic
- `GET /progress/achievements` — earned achievements

---

### Phase 4 — Core Backend Services

#### [NEW] `backend/app/services/sandbox.py`
Integrates with self-hosted **Piston API** for sandboxed Python execution:

```python
async def execute_python(code: str, stdin: str = "", timeout: int = 10) -> ExecutionResult:
    payload = {
        "language": "python",
        "version": "3.10",
        "files": [{"content": code}],
        "stdin": stdin,
        "run_timeout": timeout * 1000  # ms
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.PISTON_URL}/api/v2/execute",
            json=payload,
            timeout=30
        )
    result = response.json()
    return ExecutionResult(
        stdout=result["run"]["stdout"],
        stderr=result["run"]["stderr"],
        exit_code=result["run"]["code"]
    )
```

#### [NEW] `backend/app/services/progression.py`
Handles:
- XP award + level calculation
- World/topic unlock logic
- Mastery evaluation (all steps completed + assessment ≥ threshold)
- Achievement trigger checks

```python
LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, ...]

def calculate_level(xp: int) -> int:
    for level, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp < threshold:
            return level
    return len(LEVEL_THRESHOLDS)
```

#### [NEW] `backend/app/services/ai_service.py`
```python
async def get_hint(challenge: CodingChallenge, user_code: str, hint_level: int) -> str:
    prompt = build_hint_prompt(challenge, user_code, hint_level)
    response = await gemini_client.generate_content(prompt)
    return response.text

async def explain_concept(topic: str, user_question: str) -> str:
    # Socratic guidance — does NOT give away answers
    ...
```

#### [NEW] `backend/app/services/adaptive.py`
- Tracks performance history per topic
- Adjusts difficulty of next question pool
- Generates weak-area recommendations

---

### Phase 5 — Frontend Pages & Components

#### Auth Flow
- `/register` — animated registration with onboarding survey
- `/login` — clean login with theme toggle
- `/onboarding` — 3-step: experience level → learning goal → placement test offer

#### Dashboard (`/dashboard`)
```
┌─────────────────────────────────────────────┐
│ 👋 Hello, Sanju          [🌙 Dark]  [Avatar] │
├────────────────┬────────────────────────────┤
│ Level 7        │  🔥 5-day streak           │
│ ████████░░ 82% │  XP: 2,450                 │
├────────────────┴────────────────────────────┤
│ 🏔️ Current: Loop Mountains → for Loops     │
│ [Continue Learning →]                        │
├─────────────────────────────────────────────┤
│ Skill Profile           Achievements (3)     │
│ Variables  ██████ 92%   🏆 🐞 🔥           │
│ Loops      ███░░░ 52%                        │
│ Functions  ████░░ 63%   [View All →]         │
└─────────────────────────────────────────────┘
```

#### World Map (`/worlds`)
- Visual world map with 7 worlds displayed as connected nodes
- Locked worlds shown with 🔒 and blurred
- Animated unlock transition when a world opens

#### Lesson Page (`/learn/[topicId]`)
- Tabbed layout: **Concept → Examples → Mini Practice**
- Markdown rendered with syntax highlighting (Prism/Shiki)
- Progress bar through lesson steps
- "Next: Play Game →" CTA at end

#### Game Pages (`/game/[gameId]`)

**Quiz Game** — MCQ with animated feedback, timer, combo multiplier
**Debug Challenge** — Monaco editor pre-loaded with broken code
**Mission Game** — narrative-driven coding mission with story panels

#### Coding Challenge (`/code/[challengeId]`)
```
┌─────────────────┬──────────────────────┐
│ Challenge Info  │   Python Editor      │
│                 │                      │
│ 📖 Description  │  def add(a, b):      │
│                 │      return a + b    │
│ 🧪 Test Cases   │                      │
│ Input: 2, 3     ├──────────────────────┤
│ Expected: 5     │  💡 Hint (Level 1)   │
│                 │  [▶ Run] [✅ Submit] │
├─────────────────┴──────────────────────┤
│ Output:  ✓ Test 1 passed               │
│          ✗ Test 2 failed               │
└────────────────────────────────────────┘
```

#### Assessment Page (`/assess/[topicId]`)
- Randomized question set (adaptive)
- Timer per question
- Immediate animated feedback after each answer
- Results screen with score, mastery badge, XP earned

#### Admin Panel (`/admin`)
- Users table with search/filter
- Curriculum tree editor (mode → world → topic → lesson)
- Question bank manager with difficulty tagging
- XP/Achievement configurator
- Analytics dashboards (Chart.js)

---

### Phase 6 — Database Seed Content

All 7 worlds will be seeded via `backend/app/seed/seed_curriculum.py`:

| World | Topics | Lessons | Questions | Challenges | Game Type |
|---|---|---|---|---|---|
| 1 — Python Foundations | 5 | 10 | 30 | 5 | Quiz + Mission |
| 2 — Variables & Data | 8 | 16 | 40 | 8 | Data Collector + Quiz |
| 3 — Operators | 5 | 10 | 35 | 5 | Operator Arena (Quiz) |
| 4 — Decision Making | 4 | 8 | 35 | 6 | Decision Dungeon + Debug |
| 5 — Loops | 5 | 10 | 40 | 8 | Loop Mountains + Debug |
| 6 — Collections | 4 | 8 | 40 | 8 | Collection City + Mission |
| 7 — Functions | 5 | 10 | 40 | 8 | Function Factory + Mission |
| Boss | — | — | 20 | 1 | Boss Battle (Multi-concept) |

---

### Phase 7 — Gamification Systems

#### XP & Level Names
```
Level 1  — Python Rookie         (0 XP)
Level 2  — Code Explorer         (100 XP)
Level 3  — Python Apprentice     (250 XP)
Level 4  — Syntax Solver         (500 XP)
Level 5  — Logic Builder         (900 XP)
Level 6  — Debug Detective       (1,400 XP)
Level 7  — Python Warrior        (2,000 XP)
Level 8  — Code Craftsman        (2,800 XP)
Level 9  — Algorithm Ace         (3,800 XP)
Level 10 — Python Master         (5,000 XP)
```

#### XP Rewards
| Activity | XP |
|---|---:|
| Complete lesson | +20 |
| Mini practice (all correct) | +20 |
| Game completed | +50 |
| Coding challenge (first try) | +75 |
| Coding challenge (retry) | +40 |
| Assessment ≥ 80% | +100 |
| Assessment ≥ 60% | +60 |
| Boss Battle | +200 |
| Achievement unlocked | +50–150 |
| Daily streak bonus | +10 × streak_days |

#### Achievements (Seeded)
| Badge | Condition |
|---|---|
| 🐍 Hello, World! | Complete first lesson |
| 🔥 On Fire | 3-day streak |
| 💡 Variable Master | Master Variables & Data world |
| 🔁 Loop Legend | Complete all loop challenges |
| 🐞 Debug Detective | Fix 10 debugging challenges |
| ⚡ Speed Coder | Complete challenge in under 2 min |
| 🏔️ Mountain Climber | Complete Loop Mountains |
| 🏆 Beginner Champion | Defeat the Beginner Boss |
| 🌟 Perfect Score | Score 100% on any assessment |

---

### Phase 8 — AI Integration (Gemini API)

#### Hint System (Progressive)
```
Hint Level 1: "Think about what your loop condition does on each iteration."
Hint Level 2: "Check if your loop variable is being updated inside the loop body."
Hint Level 3: "You need to increment `i` inside the loop, or the condition will never become False."
```

The AI is instructed via system prompt to:
- Never directly give the answer
- Use Socratic questioning
- Reference the specific concept being tested
- Keep hints short (2–3 sentences max)

#### Post-Submission Concept Check
After passing a coding challenge, 30% of the time the system asks a conceptual follow-up MCQ to verify understanding.

---

## Implementation Phases (Build Order)

```mermaid
gantt
    title Code2Learn Build Phases
    dateFormat  X
    axisFormat  Phase %s

    section Infrastructure
    Docker Compose + Scaffold     :p1, 0, 1
    DB Models + Alembic           :p2, 1, 2

    section Backend
    Auth (JWT + bcrypt)           :p3, 2, 3
    Curriculum API                :p4, 3, 4
    Progress + Progression        :p5, 4, 5
    Code Sandbox (Piston)         :p6, 5, 6
    Games + Challenges API        :p7, 6, 7
    Assessments + Adaptive        :p8, 7, 8
    AI Service (Gemini)           :p9, 8, 9

    section Frontend
    Design System + Theme         :f1, 3, 4
    Auth Pages                    :f2, 4, 5
    Dashboard                     :f3, 5, 6
    World Map + Lesson Pages      :f4, 6, 7
    Game Pages                    :f5, 7, 8
    Code Challenge + Monaco       :f6, 8, 9
    Assessment Pages              :f7, 9, 10
    Admin Panel                   :f8, 10, 11

    section Content
    Seed All 7 Worlds             :c1, 9, 11
    Boss Battle Config            :c2, 11, 12
```

---

## Verification Plan

### Automated Tests
```bash
# Backend unit + integration tests
cd backend && pytest tests/ -v

# Frontend component tests
cd frontend && npm run test

# E2E tests (Playwright)
cd frontend && npx playwright test
```

### Manual Verification Checklist
- [ ] Register → login → onboarding flow works
- [ ] Lessons load with correct markdown rendering
- [ ] Mini-practice saves and awards XP
- [ ] Game completes and XP is awarded
- [ ] Monaco editor runs Python code and shows output
- [ ] Test cases evaluate correctly (pass/fail)
- [ ] Hint system returns Socratic hints, not answers
- [ ] Assessment randomizes questions per attempt
- [ ] Topic mastery triggers after all steps complete
- [ ] World 2 locks until World 1 mastered
- [ ] XP updates and level advances correctly
- [ ] Dark/light theme toggle persists
- [ ] Admin can create/edit a question
- [ ] Docker Compose starts all services cleanly

---

## Key Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Piston sandbox not installed in Docker | Use public Piston API (`emkc.org`) as fallback during dev |
| Gemini API rate limits | Cache common hints/explanations in Redis (Phase 2) |
| Seeding 7 worlds of content is time-consuming | Write content as JSON files, seed script loads them all at once |
| Monaco editor bundle size | Dynamic import `@monaco-editor/react` with Next.js |
| JWT expiry UX | Silent token refresh using interceptors in the API client |
