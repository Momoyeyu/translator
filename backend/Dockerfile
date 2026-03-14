FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/ \
    PIP_TRUSTED_HOST=mirrors.aliyun.com \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH=/app/.venv/bin:$PATH \
    PYTHONPATH=/app/src

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends bash ca-certificates curl \
        libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 \
        libgdk-pixbuf-2.0-0 libffi-dev libcairo2 libglib2.0-0; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN python -m pip install -i "$PIP_INDEX_URL" --trusted-host "$PIP_TRUSTED_HOST" uv && \
    uv sync --frozen --no-dev

COPY src ./src
COPY migration ./migration
COPY scripts/migrate.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/migrate.sh

ENV PYTHONPATH=/app/src:/app

ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8000

EXPOSE ${SERVER_PORT}

HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD curl -fsS http://127.0.0.1:${SERVER_PORT}/api/v1/ >/dev/null || exit 1

CMD ["sh", "-c", "migrate.sh && exec uvicorn main:app --app-dir src --host ${SERVER_HOST} --port ${SERVER_PORT}"]
