# 🐍 Code2Learn — Gamified Python Learning Platform

> **Transforming Python education from passive memorization into an interactive, progression-based mastery adventure.**  
> *Core Learning Loop: Learn → Practice → Play → Code → Assess → Master → Unlock*

---

## 🌟 Project Highlights

- **Progression-Based Curriculum**: 7 full Beginner Worlds + Grand Finale Boss Battle.
- **In-Browser Sandboxed Python Execution**: Monaco code editor powered by isolated code runners with live stdout/stderr and automated test evaluation.
- **Mastery Enforcement**: Topics are only mastered when lessons, mini-practices, interactive games, coding challenges, and adaptive assessments (≥ 70%) are completed.
- **Adaptive Question Engine**: Dynamically matches question difficulty based on student skill history.
- **AI Socratic Learning Assistant**: Progressive hint generator (Levels 1, 2, 3) that guides student thinking without spoiling solutions.
- **Gamification Mechanics**: XP rewards, 10 Player Levels, streak counters, badges/achievements, and celebratory particle animations.
- **Dual Visual Theme**: Dark mode and Light mode with persistent state.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Monaco Editor, Lucide Icons, Canvas Confetti |
| **Styling** | Vanilla CSS Design System with CSS Custom Properties (Dark / Light themes) |
| **Backend** | FastAPI (Python 3.11/3.14), Pydantic v2, Python-Jose / PyJWT, Bcrypt |
| **Database** | SQLite (development) / PostgreSQL (production) with SQLAlchemy 2.0 ORM |
| **Sandbox Execution** | Piston Sandbox API + Fallback Subprocess Runner |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) with intelligent heuristic fallback |

---

## 🗺️ Beginner Curriculum Map

| # | World | Theme | Game Type | Boss / Climax Challenge |
|---|---|---|---|---|
| **1** | **Python Foundations** | 🌱 Forest of Syntax | *Python Explorer Quiz* | Print Galactic Greeting |
| **2** | **Variables & Data** | 📦 Data Vault | *Data Collector Arcade* | Character Profile Generator |
| **3** | **Operator Arena** | ⚡ Electric Colosseum | *Operator Arena Duels* | Price & Discount Calculator |
| **4** | **Decision Dungeon** | 🏰 Castle of Branching | *Decision Dungeon Gates* | Dungeon Gatekeeper Logic |
| **5** | **Loop Mountains** | 🏔️ Peaks of Iteration | *Gear Tower Climber* | Ascent Counter Loop |
| **6** | **Collection City** | 🏙️ Metropolis of Inventories | *Inventory Vault Sorter* | Peak Score Extractor |
| **7** | **Function Factory** | ⚙️ Assembly Line | *Function Factory Modules* | Power Generator Function |
| **Boss** | **The Beginner Boss** | 🐉 Pythos the Synthesizer | *Multi-Stage Showdown* | Grand Multi-Concept Synthesis |

---

## 🚀 Quickstart Guide

### Option 1: Direct Local Execution

#### 1. Start the Backend API
```bash
cd backend

# Create virtual environment (if not already created)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*The database automatically creates all tables and seeds all 7 worlds + achievements on startup!*  
*Swagger API documentation is accessible at: `http://127.0.0.1:8000/docs`*

#### 2. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run Next.js
npm run dev
```
*Open your browser and navigate to: `http://localhost:3000`*

---

### Option 2: Docker Compose
```bash
docker compose up --build
```
This boots PostgreSQL, the Piston sandbox runner, the FastAPI backend, and the Next.js frontend in isolated containers.

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register`: Create student/admin account and unlock World 1
- `POST /login`: Return access & refresh JWT tokens
- `GET /me`: Current user and profile details
- `PUT /profile`: Update avatar, bio, or theme

### Curriculum (`/api/curriculum`)
- `GET /modes`: List modes (Beginner, Intermediate, Advanced)
- `GET /worlds`: List worlds with user unlock status
- `GET /lesson/{topic_id}`: Full markdown lesson
- `POST /lesson/{topic_id}/complete`: Record completion (+20 XP)
- `GET /mini-practice/{topic_id}`: Interactive practice questions
- `POST /mini-practice/{topic_id}/submit`: Check answers (+20 XP)

### Challenges & Sandbox (`/api/challenges`)
- `GET /topic/{topic_id}`: Coding challenge + visible test cases
- `POST /run`: Sandbox code runner (live stdout/stderr)
- `POST /submit`: Evaluate against all test cases (+75 XP)
- `GET /game/{topic_id}`: Interactive game setup
- `POST /game/{game_id}/submit`: Record game score (+50 XP)
- `GET /boss/{world_id}`: Multi-stage Boss Battle
- `POST /boss/{boss_id}/submit`: Record boss defeat (+250 XP)

### Assessments (`/api/assessments`)
- `GET /topic/{topic_id}`: Adaptive randomized question set
- `POST /topic/{topic_id}/submit`: Grade, update skill profile, unlock mastery (+100 XP)

### Progress & Dashboard (`/api/progress`)
- `GET /dashboard`: Full student stats, level progress, streak, skill bars
- `GET /achievements`: List all achievements and unlock status

### AI Assistant (`/api/ai`)
- `POST /hint`: Progressive Socratic hints (Level 1, 2, 3)
- `POST /explain`: Explain programming concepts and errors
- `GET /recommend`: Personalized next recommendation based on weak areas

### Admin (`/api/admin`)
- `GET /stats`: Overall system metrics
- `GET /users`: Student roster and status toggles

---

## 🛡️ License
MIT License. Built with ❤️ for computer science learners worldwide.
