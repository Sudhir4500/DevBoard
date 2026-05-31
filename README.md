# DevBoard — Backend

DevBoard backend is a FastAPI service that powers the DevBoard development dashboard.
It provides APIs for user, project, and issue management and uses PostgreSQL with async SQLAlchemy and Alembic for migrations.

**Quick Links**
- **Code:** [backend/app/main.py](backend/app/main.py)
- **API routes:** [backend/app/api/v1/router.py](backend/app/api/v1/router.py)
- **Database models:** [backend/models](backend/models)
- **Migrations:** [backend/alembic](backend/alembic)

**Features**
- Authentication (JWT)
- CRUD for projects and issues
- Async DB access with SQLAlchemy + asyncpg
- Alembic migrations

**Tech stack**
- Python 3.10+
- FastAPI
- SQLAlchemy (asyncio)
- PostgreSQL (asyncpg)
- Alembic
- Uvicorn

**Requirements**
- Git
- Docker & Docker Compose (recommended)
- Or Python 3.10+ and a virtualenv if running locally

**Quickstart (Docker)**
1. Copy or create an `.env` file at the repo root with the necessary environment variables (see Environment section).
2. Start services:

```bash
docker compose up --build
```

The backend will be available at http://localhost:8000 by default (unless configured otherwise in `docker-compose.yml`).

**Local development (without Docker)**
1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```
2. Install dependencies from the `backend` package:

```bash
pip install -e backend
```
3. Ensure a PostgreSQL database is running and `DATABASE_URL` is set in your environment.
4. Run Alembic migrations (see below), then start the server:

```bash
uvicorn backend.app.main:app --reload --factory
```

**Environment variables**
At minimum set:
- `DATABASE_URL` — Async PG URL (e.g. `postgresql+asyncpg://user:pass@host:5432/dbname`)
- `SECRET_KEY` — JWT signing key
- `SENTRY_DSN` (optional) — error reporting

**Database migrations (Alembic)**
From the `backend` folder, run:

```bash
cd backend
alembic upgrade head
```

Migration scripts live in [backend/alembic/versions](backend/alembic/versions).

**Testing**
Tests (if present) are configured to run with `pytest`. Run them from the repo root:

```bash
pytest
```

**Project structure (important files)**
- `backend/app/main.py` — application entrypoint
- `backend/app/api/v1/*` — route handlers and routers
- `backend/core` — configuration and dependencies
- `backend/models` — SQLAlchemy models
- `backend/repositories` — DB access layer
- `backend/services` — business logic
- `backend/schemas` — Pydantic request/response schemas

**Contributing**
- Open issues and PRs are welcome. Follow existing code style and run linters (`ruff`) before submitting.

**Contact**
Author: Sudhir Sharma

---
_This README was generated to help contributors and maintainers quickly get started with the DevBoard backend._
