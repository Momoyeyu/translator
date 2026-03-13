# Backend — FastAPI Translation Service

## Quick Commands

- `make run` — Start dev server (uvicorn with reload)
- `make test` — Run all tests with coverage
- `make lint` — Check code style (ruff)
- `make migrate` — Run database migrations

## Architecture

4-layer module pattern (one directory per domain module):

```
src/{module}/
├── model.py      # SQLAlchemy ORM + async query functions
├── dto.py        # Pydantic request/response schemas
├── service.py    # Business logic (async, raises erri.*)
└── handler.py    # FastAPI routes (thin: calls service, returns ok())
```

## Rules

- **Async everywhere**: All DB, Redis, Kafka, HTTP, LLM calls must use async/await
- **No threading**: Use asyncio patterns. No `threading.Thread` or `concurrent.futures`
- **Handlers are thin**: Only call services and return responses. No business logic
- **Services raise errors**: Use `erri.bad_request()`, `erri.not_found()`, etc.
- **Storage abstraction**: Never access file storage directly. Use `StorageService`
- **Long tasks to Kafka**: Never run LLM calls or pipeline stages in request handlers
- **Soft delete**: Use `is_deleted` flag, never hard delete user data

## Testing

- `tests/unit/` — Mock all external deps (DB, Redis, LLM, Kafka)
- `tests/integration/` — SQLite + FakeRedis, full API lifecycle
- Coverage threshold: 80%

## Dependencies

- Python 3.12+ with uv
- PostgreSQL 16, Redis 7, Kafka
- See pyproject.toml for packages
