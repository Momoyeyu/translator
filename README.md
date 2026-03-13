# Translator Agent

An ACPs-compliant multi-language document translation agent with intelligent chunking, term clarification, and post-translation chat assistant.

## Features

- **Multi-format support**: Plain text, Markdown, PDF, DOCX, HTML
- **Intelligent pipeline**: Plan → Clarify → Translate → Unify
- **Term management**: Automatic specialized term extraction with user confirmation
- **Large document handling**: Smart chunking with cross-chunk context coherence
- **Multi-language**: Any target language supported via LLM
- **ACPs compliant**: Discoverable and callable by other agents via AIP RPC
- **Export**: Markdown and PDF output

## Architecture

- **Backend**: FastAPI (async) + PostgreSQL + Redis + Kafka
- **Frontend**: React + Arco Design + TypeScript
- **Protocol**: ACPs v2.0.0 (AIP Partner)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.12+ with [uv](https://docs.astral.sh/uv/) (for backend development)

### Run with Docker (recommended)
```bash
docker-compose up
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Local Development
```bash
# Start infrastructure
./scripts/start-dev.sh

# Backend (in another terminal)
cd backend
cp .env.example .env  # Edit .env with your LLM API key
uv sync
PYTHONPATH=src uv run alembic -c migration/alembic.ini upgrade head
PYTHONPATH=src uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev

# Workers (in another terminal)
cd backend
PYTHONPATH=src uv run python -m worker.run
```

### Run Tests
```bash
# Backend
cd backend && uv run pytest tests/ -v

# Frontend
cd frontend && npm run build
```

## Architecture

See [Design Document](docs/specs/2026-03-13-translator-agent-design.md) for full architecture details.

## License

[MIT](LICENSE)
