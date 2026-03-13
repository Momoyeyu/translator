# Remaining Features — Parallel Implementation Plan

> Goal: From current state to fully functional, deployable product

## Current State
- ✅ Backend: models, services, handlers, pipeline executor, chat executor
- ✅ Frontend: project list/create/detail, pipeline progress, glossary editor, artifacts, chat
- ✅ Docker Compose: PostgreSQL, Redis, Kafka

## Remaining Work — 4 Parallel Features

### Feature A: Backend Integration & Alembic (branch: feat/backend-integration)
Owner: Coding Agent A

1. Update Alembic env.py to import all new models
2. Generate initial migration
3. Update main.py lifespan: health/ready endpoints
4. Fix Kafka producer serialization (ensure json bytes)
5. Create backend .env from .env.example with dev defaults
6. Verify: `docker-compose up` + `uv run uvicorn main:app` starts cleanly
7. Add sidebar nav entry for Projects in frontend

### Feature B: ACPs Partner Integration (branch: feat/acps-integration)
Owner: Coding Agent B

1. Create `backend/src/acps/__init__.py`
2. Create `backend/src/acps/acs.json` — ACS capability spec
3. Create `backend/src/acps/handler.py` — AIP RPC endpoint at `/acps/rpc`
4. Create `backend/src/acps/service.py` — Map TaskCommands to pipeline operations
5. Mock mTLS auth middleware
6. Register ACPs router in main.py
7. Test: AIP RPC roundtrip (start → get → continue → complete)

### Feature C: Docker Full Stack (branch: feat/docker-fullstack)
Owner: Coding Agent C

1. Add `backend` service to docker-compose.yml (with Dockerfile)
2. Add `frontend` service (nginx + vite build)
3. Add nginx reverse proxy config (API + WebSocket + frontend)
4. Add `worker` service for Kafka consumers
5. Create `scripts/start-dev.sh` for local development
6. Verify: `docker-compose up` serves the full app on localhost

### Feature D: Tests & Smoke (branch: feat/tests-smoke)
Owner: Coding Agent D

1. Backend integration tests for project CRUD API
2. Backend integration tests for pipeline lifecycle
3. Backend unit tests for pipeline executor (mocked LLM)
4. Frontend: verify `npm run build` produces dist/
5. Create smoke test script that tests the full flow

## Merge Order
All features are independent. Merge in order: A → B → C → D (rebase each before merge).

## Release
After all merged: tag v0.1.0, update README with quickstart.
