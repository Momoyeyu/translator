# Translator Agent — Monorepo

## Project Overview

ACPs-compliant translation agent with FastAPI backend + React frontend.
See `docs/specs/2026-03-13-translator-agent-design.md` for full design.

## Code Quality

- Backend: `cd backend && make lint && make test`
- Frontend: `cd frontend && npm run lint && npm run build`

## Workflow

1. Ensure you're on latest `master`, then branch off for new work
2. Make small, meaningful commits with clear messages
3. Each feature branch MUST include development documentation (doc comments, README updates, or docs/ entries)
4. Validate: refer to `# Code Quality`
5. Create a reviewer agent with prompt: "this branch is created by an agent, review carefully and generate a markdown report"
6. Only fix **critical** issues from the report. Flag uncertain fixes for human review in PR description
7. Rebase to latest `master` before opening a PR (other agent branches may already be merged)
8. Open a PR with brief title & description, await human review

## Parallel Development

- Use git worktrees under `.claude/worktrees/` for parallel feature development
- Each worktree follows the same `# Workflow`
- Clean up worktrees after features are merged into `master`
- Coordinate via PR descriptions to avoid conflicting changes

## Branch Naming

- `feat/<module>-<description>` — new features
- `fix/<module>-<description>` — bug fixes
- `docs/<description>` — documentation only
- `test/<description>` — test additions

## Protected Branch

- `master` is protected: no direct commits, PRs only
- All PRs require CI checks to pass

## Architecture Rules

- Backend 4-layer pattern: model → dto → service → handler
- All I/O must be async (no threading unless absolutely necessary)
- File storage goes through StorageService only — never access storage backend directly
- Long-running tasks go through Kafka — never execute in request handlers
- Real-time push via WebSocket + Redis Pub/Sub
