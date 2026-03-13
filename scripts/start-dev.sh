#!/bin/bash
set -e
echo "Starting translator development stack..."
docker-compose up -d db redis kafka
echo "Waiting for services to be healthy..."
sleep 10
echo "Infrastructure ready!"
echo ""
echo "To start backend: cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo "To start frontend: cd frontend && npm run dev"
echo "To start workers: cd backend && PYTHONPATH=src uv run python -m worker.run"
echo ""
echo "Or run everything in Docker: docker-compose up"
