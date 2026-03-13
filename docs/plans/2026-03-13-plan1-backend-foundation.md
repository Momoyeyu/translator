# Plan 1: Backend Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the backend from the FastAPI boilerplate with all core infrastructure: config, database models, storage abstraction, LLM service, and Kafka producer/consumer skeleton.

**Architecture:** Copy the fastapi-boilerplate as `backend/`, adapt configuration for translator-specific needs (Kafka, storage, LLM profiles, ACPs), create all ORM models matching the design spec, implement the storage abstraction layer, and wire up the LLM service with multi-profile support.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16, Redis 7, Kafka (aiokafka), LangChain, Pydantic v2, Alembic, pytest

**Depends on:** Design spec at `docs/specs/2026-03-13-translator-agent-design.md`

**Boilerplate source:** `.boilerplate-ref/backend/` (local clone of github.com/Momoyeyu/fastapi-boilerplate)

---

## File Map

### Files to copy from boilerplate (then adapt)

| Source | Destination | Adapt |
|--------|-------------|-------|
| `.boilerplate-ref/backend/src/main.py` | `backend/src/main.py` | Add Kafka lifespan, new routers |
| `.boilerplate-ref/backend/src/conf/` | `backend/src/conf/` | Add Kafka, storage, LLM profile, ACPs config |
| `.boilerplate-ref/backend/src/common/` | `backend/src/common/` | Keep as-is |
| `.boilerplate-ref/backend/src/middleware/` | `backend/src/middleware/` | Keep as-is |
| `.boilerplate-ref/backend/src/auth/` | `backend/src/auth/` | Keep as-is |
| `.boilerplate-ref/backend/src/user/` | `backend/src/user/` | Keep as-is |
| `.boilerplate-ref/backend/src/tenant/` | `backend/src/tenant/` | Keep as-is |
| `.boilerplate-ref/backend/migration/` | `backend/migration/` | Reset migrations |
| `.boilerplate-ref/backend/tests/` | `backend/tests/` | Keep existing, add new |
| `.boilerplate-ref/backend/scripts/` | `backend/scripts/` | Keep as-is |
| `.boilerplate-ref/backend/pyproject.toml` | `backend/pyproject.toml` | Add new deps |
| `.boilerplate-ref/backend/Makefile` | `backend/Makefile` | Keep as-is |
| `.boilerplate-ref/backend/Dockerfile` | `backend/Dockerfile` | Adapt for translator |
| `.boilerplate-ref/backend/.env.example` | `backend/.env.example` | Add new vars |
| `.boilerplate-ref/backend/.gitignore` | `backend/.gitignore` | Add uploads/ |

### New files to create

| File | Responsibility |
|------|---------------|
| `backend/src/conf/kafka.py` | Kafka producer/consumer singleton |
| `backend/src/conf/storage.py` | Storage backend factory |
| `backend/src/project/model.py` | TranslationProject ORM + queries |
| `backend/src/project/dto.py` | Project request/response schemas |
| `backend/src/document/model.py` | Document ORM + queries |
| `backend/src/document/dto.py` | Document schemas |
| `backend/src/document/extractor.py` | Text extraction by MIME type |
| `backend/src/chunk/model.py` | Chunk ORM + queries |
| `backend/src/chunk/dto.py` | Chunk schemas |
| `backend/src/glossary/model.py` | GlossaryTerm ORM + queries |
| `backend/src/glossary/dto.py` | GlossaryTerm schemas |
| `backend/src/pipeline/model.py` | PipelineTask ORM + queries |
| `backend/src/pipeline/dto.py` | PipelineTask schemas |
| `backend/src/artifact/model.py` | Artifact ORM + queries |
| `backend/src/artifact/dto.py` | Artifact schemas |
| `backend/src/conversation/model.py` | Conversation + Message ORM + queries |
| `backend/src/conversation/dto.py` | Conversation/Message schemas |
| `backend/src/storage/backend.py` | StorageBackend ABC + Local + S3 implementations |
| `backend/src/storage/service.py` | StorageService (key gen, validation, wraps backend) |
| `backend/src/llm/service.py` | LLMService with multi-profile support |
| `backend/src/llm/prompts/plan.py` | Plan stage prompt template |
| `backend/src/llm/prompts/clarify.py` | Clarify stage prompt template |
| `backend/src/llm/prompts/translate.py` | Translate stage prompt template |
| `backend/src/llm/prompts/unify.py` | Unify stage prompt template |
| `backend/src/llm/prompts/chat.py` | Chat assistant prompt template |
| `backend/src/ws/manager.py` | WebSocket + Redis Pub/Sub manager |
| `backend/src/worker/base.py` | Kafka consumer base class |
| `backend/tests/unit/test_storage.py` | Storage abstraction tests |
| `backend/tests/unit/test_llm_service.py` | LLM service tests |
| `backend/tests/unit/test_extractor.py` | Document extractor tests |
| `backend/tests/unit/test_models.py` | ORM model creation tests |

---

## Chunk 1: Scaffold & Configuration

### Task 1: Copy boilerplate and adapt project metadata

**Files:**
- Copy: `.boilerplate-ref/backend/` → `backend/`
- Modify: `backend/pyproject.toml`
- Modify: `backend/.env.example`

- [ ] **Step 1: Copy boilerplate into backend/**

```bash
# Remove placeholder backend dir, copy boilerplate
rm -rf backend/src backend/CLAUDE.md
cp -r .boilerplate-ref/backend/* backend/
cp .boilerplate-ref/backend/.gitignore backend/.gitignore
cp .boilerplate-ref/backend/.env.example backend/.env.example
# Restore our CLAUDE.md (it was overwritten)
```

Then restore `backend/CLAUDE.md` with the content from git:
```bash
git checkout HEAD -- backend/CLAUDE.md
```

- [ ] **Step 2: Update pyproject.toml project name and add dependencies**

In `backend/pyproject.toml`, change the project name and add new dependencies:

```toml
[project]
name = "translator-backend"
version = "0.1.0"
description = "ACPs-compliant translation agent backend"
```

Add to `dependencies`:
```toml
    "aiokafka>=0.12.0",
    "aiobotocore>=2.15.0",
    "python-docx>=1.1.0",
    "PyMuPDF>=1.25.0",
    "beautifulsoup4>=4.12.0",
    "markdown>=3.7",
    "weasyprint>=63.0",
    "python-multipart>=0.0.9",
```

- [ ] **Step 3: Update .env.example with translator-specific variables**

Append to `backend/.env.example`:

```env
# ===========================================
# Kafka Configuration
# ===========================================
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP=translator-workers

# ===========================================
# Storage Configuration
# ===========================================
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_S3_BUCKET=
STORAGE_S3_ENDPOINT=
STORAGE_S3_ACCESS_KEY=
STORAGE_S3_SECRET_KEY=
STORAGE_S3_REGION=

# ===========================================
# LLM Profiles
# ===========================================
# LLM_API_KEY, LLM_BASE_URL, LLM_MODEL_NAME already defined above
LLM_FAST_MODEL_NAME=
LLM_PRO_MODEL_NAME=

# ===========================================
# ACPs Configuration
# ===========================================
ACPS_ENABLED=false
ACPS_AIC=1.2.156.3088.0001.00001.000001.0.1.0000
ACPS_CERT_DIR=./certs
ACPS_MOCK_AUTH=true

# ===========================================
# Pipeline Configuration
# ===========================================
MAX_CONCURRENT_PROJECTS_PER_USER=3
MAX_UPLOAD_SIZE_MB=50
```

- [ ] **Step 4: Verify boilerplate structure is intact**

```bash
cd backend && ls src/main.py src/conf/config.py src/common/resp.py src/auth/handler.py
```

Expected: all files exist, no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend from fastapi-boilerplate

Copy boilerplate structure, add translator-specific dependencies
(aiokafka, aiobotocore, PyMuPDF, python-docx, etc.) and
environment variables for Kafka, storage, LLM profiles, ACPs."
```

---

### Task 2: Extend configuration with Kafka, Storage, LLM profiles

**Files:**
- Modify: `backend/src/conf/config.py`
- Create: `backend/src/conf/kafka.py`
- Create: `backend/src/conf/storage.py`

- [ ] **Step 1: Read existing config.py to understand Settings class**

Read `backend/src/conf/config.py` fully to understand existing fields and patterns.

- [ ] **Step 2: Add new settings fields to config.py**

Add to the `Settings` class in `backend/src/conf/config.py`:

```python
# Kafka
KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
KAFKA_CONSUMER_GROUP: str = "translator-workers"

# Storage
STORAGE_BACKEND: str = "local"  # "local" or "s3"
STORAGE_LOCAL_PATH: str = "./uploads"
STORAGE_S3_BUCKET: str = ""
STORAGE_S3_ENDPOINT: str = ""
STORAGE_S3_ACCESS_KEY: str = ""
STORAGE_S3_SECRET_KEY: str = ""
STORAGE_S3_REGION: str = ""

# LLM Profiles
LLM_FAST_MODEL_NAME: str = ""
LLM_PRO_MODEL_NAME: str = ""

# ACPs
ACPS_ENABLED: bool = False
ACPS_AIC: str = "1.2.156.3088.0001.00001.000001.0.1.0000"
ACPS_CERT_DIR: str = "./certs"
ACPS_MOCK_AUTH: bool = True

# Pipeline
MAX_CONCURRENT_PROJECTS_PER_USER: int = 3
MAX_UPLOAD_SIZE_MB: int = 50
```

- [ ] **Step 3: Create backend/src/conf/kafka.py**

```python
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from conf.config import settings
import json

_producer: AIOKafkaProducer | None = None


async def get_kafka_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await _producer.start()
    return _producer


def create_kafka_consumer(topic: str) -> AIOKafkaConsumer:
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_CONSUMER_GROUP,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        enable_auto_commit=False,
    )


async def close_kafka_producer():
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None
```

- [ ] **Step 4: Create backend/src/conf/storage.py**

```python
from conf.config import settings


def get_storage_config() -> dict:
    return {
        "backend": settings.STORAGE_BACKEND,
        "local_path": settings.STORAGE_LOCAL_PATH,
        "s3_bucket": settings.STORAGE_S3_BUCKET,
        "s3_endpoint": settings.STORAGE_S3_ENDPOINT,
        "s3_access_key": settings.STORAGE_S3_ACCESS_KEY,
        "s3_secret_key": settings.STORAGE_S3_SECRET_KEY,
        "s3_region": settings.STORAGE_S3_REGION,
    }
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/conf/
git commit -m "feat(conf): add Kafka, storage, LLM profile, ACPs settings"
```

---

## Chunk 2: ORM Models

### Task 3: Create TranslationProject model

**Files:**
- Create: `backend/src/project/__init__.py`
- Create: `backend/src/project/model.py`
- Create: `backend/src/project/dto.py`
- Test: `backend/tests/unit/test_project_model.py`

- [ ] **Step 1: Create backend/src/project/__init__.py**

Empty file.

- [ ] **Step 2: Write failing test for TranslationProject model**

Create `backend/tests/unit/test_project_model.py`:

```python
import pytest
from project.model import TranslationProject, ProjectStatus


def test_project_status_enum():
    assert ProjectStatus.CREATED == "created"
    assert ProjectStatus.PLANNING == "planning"
    assert ProjectStatus.COMPLETED == "completed"
    assert ProjectStatus.FAILED == "failed"


def test_project_model_has_required_columns():
    columns = {c.name for c in TranslationProject.__table__.columns}
    required = {
        "id", "user_id", "tenant_id", "title",
        "source_language", "target_language", "status", "config",
        "created_at", "updated_at", "is_deleted", "deleted_at",
    }
    assert required.issubset(columns)
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_project_model.py -v
```

Expected: `ModuleNotFoundError: No module named 'project'`

- [ ] **Step 4: Implement TranslationProject model**

Create `backend/src/project/model.py`:

```python
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, DateTime, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ProjectStatus(StrEnum):
    CREATED = "created"
    PLANNING = "planning"
    CLARIFYING = "clarifying"
    TRANSLATING = "translating"
    UNIFYING = "unifying"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TranslationProject(Base):
    __tablename__ = "translation_project"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    tenant_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_language: Mapped[str | None] = mapped_column(String(10))
    target_language: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ProjectStatus.CREATED
    )
    config: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))


async def get_project(project_id: UUID, user_id: UUID) -> TranslationProject | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject).where(
                TranslationProject.id == project_id,
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,
            )
        )
        return result.scalars().one_or_none()


async def list_projects(user_id: UUID, page: int = 1, page_size: int = 20) -> list[TranslationProject]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject)
            .where(
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,
            )
            .order_by(TranslationProject.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all())
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_project_model.py -v
```

Expected: PASS

- [ ] **Step 6: Create backend/src/project/dto.py**

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectConfig(BaseModel):
    formality: str = "neutral"
    domain: str | None = None
    skip_clarify: bool = False
    chunk_strategy: str = "auto"
    max_chunk_tokens: int = 2000


class CreateProjectRequest(BaseModel):
    title: str = Field(max_length=255)
    target_language: str = Field(max_length=10)
    source_language: str | None = Field(None, max_length=10)
    config: ProjectConfig = Field(default_factory=ProjectConfig)


class UpdateProjectRequest(BaseModel):
    title: str | None = Field(None, max_length=255)
    config: ProjectConfig | None = None


class ProjectResponse(BaseModel):
    id: UUID
    title: str
    source_language: str | None
    target_language: str
    status: str
    config: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/project/ backend/tests/unit/test_project_model.py
git commit -m "feat(project): add TranslationProject model, DTOs, and queries"
```

---

### Task 4: Create Document model with text extractor

**Files:**
- Create: `backend/src/document/__init__.py`
- Create: `backend/src/document/model.py`
- Create: `backend/src/document/dto.py`
- Create: `backend/src/document/extractor.py`
- Test: `backend/tests/unit/test_extractor.py`

- [ ] **Step 1: Create backend/src/document/__init__.py**

Empty file.

- [ ] **Step 2: Write failing test for text extractor**

Create `backend/tests/unit/test_extractor.py`:

```python
import pytest
from document.extractor import extract_text, UnsupportedFormatError


def test_extract_plain_text():
    data = b"Hello, world!"
    result = extract_text(data, "text/plain")
    assert result == "Hello, world!"


def test_extract_markdown():
    data = "# Title\n\nParagraph".encode("utf-8")
    result = extract_text(data, "text/markdown")
    assert result == "# Title\n\nParagraph"


def test_unsupported_format_raises():
    with pytest.raises(UnsupportedFormatError):
        extract_text(b"data", "application/zip")
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_extractor.py -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 4: Implement text extractor**

Create `backend/src/document/extractor.py`:

```python
import io


class UnsupportedFormatError(Exception):
    def __init__(self, mime_type: str):
        super().__init__(f"Unsupported document format: {mime_type}")
        self.mime_type = mime_type


SUPPORTED_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/html",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def extract_text(data: bytes, mime_type: str) -> str:
    if mime_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedFormatError(mime_type)

    if mime_type in ("text/plain", "text/markdown"):
        return data.decode("utf-8")

    if mime_type == "text/html":
        return _extract_html(data)

    if mime_type == "application/pdf":
        return _extract_pdf(data)

    if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _extract_docx(data)

    raise UnsupportedFormatError(mime_type)


def _extract_html(data: bytes) -> str:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(data, "html.parser")
    return soup.get_text(separator="\n", strip=True)


def _extract_pdf(data: bytes) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(stream=data, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


def _extract_docx(data: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_extractor.py -v
```

Expected: PASS

- [ ] **Step 6: Create Document model and DTO**

Create `backend/src/document/model.py`:

```python
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class Document(Base):
    __tablename__ = "document"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False, unique=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(127), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


async def get_document_by_project(project_id: UUID) -> "Document | None":
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Document).where(Document.project_id == project_id)
        )
        return result.scalars().one_or_none()
```

Create `backend/src/document/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    project_id: UUID
    file_name: str
    mime_type: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/document/ backend/tests/unit/test_extractor.py
git commit -m "feat(document): add Document model, text extractor with multi-format support"
```

---

### Task 5: Create remaining ORM models (Chunk, GlossaryTerm, PipelineTask, Artifact, Conversation, Message)

**Files:**
- Create: `backend/src/chunk/__init__.py`, `model.py`, `dto.py`
- Create: `backend/src/glossary/__init__.py`, `model.py`, `dto.py`
- Create: `backend/src/pipeline/__init__.py`, `model.py`, `dto.py`
- Create: `backend/src/artifact/__init__.py`, `model.py`, `dto.py`
- Create: `backend/src/conversation/__init__.py`, `model.py`, `dto.py`
- Test: `backend/tests/unit/test_models.py`

- [ ] **Step 1: Write failing test for all model imports**

Create `backend/tests/unit/test_models.py`:

```python
from chunk.model import Chunk, ChunkStatus
from glossary.model import GlossaryTerm
from pipeline.model import PipelineTask, PipelineStage, PipelineTaskStatus
from artifact.model import Artifact, ArtifactFormat
from conversation.model import Conversation, Message, MessageRole


def test_chunk_status_enum():
    assert ChunkStatus.PENDING == "pending"
    assert ChunkStatus.TRANSLATING == "translating"
    assert ChunkStatus.COMPLETED == "completed"


def test_pipeline_stage_enum():
    assert PipelineStage.PLAN == "plan"
    assert PipelineStage.CLARIFY == "clarify"
    assert PipelineStage.TRANSLATE == "translate"
    assert PipelineStage.UNIFY == "unify"


def test_pipeline_task_status_enum():
    assert PipelineTaskStatus.PENDING == "pending"
    assert PipelineTaskStatus.AWAITING_INPUT == "awaiting_input"
    assert PipelineTaskStatus.COMPLETED == "completed"


def test_artifact_format_enum():
    assert ArtifactFormat.MARKDOWN == "markdown"
    assert ArtifactFormat.PDF == "pdf"


def test_message_role_enum():
    assert MessageRole.USER == "user"
    assert MessageRole.ASSISTANT == "assistant"


def test_all_models_have_id_column():
    for model in [Chunk, GlossaryTerm, PipelineTask, Artifact, Conversation, Message]:
        assert "id" in {c.name for c in model.__table__.columns}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_models.py -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 3: Create Chunk model**

Create `backend/src/chunk/__init__.py` (empty) and `backend/src/chunk/model.py`:

```python
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ChunkStatus(StrEnum):
    PENDING = "pending"
    TRANSLATING = "translating"
    COMPLETED = "completed"
    FAILED = "failed"


class Chunk(Base):
    __tablename__ = "chunk"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False
    )
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ChunkStatus.PENDING
    )
    token_count: Mapped[int | None] = mapped_column(Integer)
    metadata: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


async def get_chunks_by_project(project_id: UUID) -> list[Chunk]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Chunk)
            .where(Chunk.project_id == project_id)
            .order_by(Chunk.chunk_index)
        )
        return list(result.scalars().all())
```

Create `backend/src/chunk/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ChunkResponse(BaseModel):
    id: UUID
    chunk_index: int
    source_text: str
    translated_text: str | None
    status: str
    token_count: int | None
    metadata: dict | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create GlossaryTerm model**

Create `backend/src/glossary/__init__.py` (empty) and `backend/src/glossary/model.py`:

```python
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class GlossaryTerm(Base):
    __tablename__ = "glossary_term"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False, index=True
    )
    source_term: Mapped[str] = mapped_column(String(255), nullable=False)
    translated_term: Mapped[str] = mapped_column(String(255), nullable=False)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    context: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


async def get_glossary_by_project(project_id: UUID) -> list[GlossaryTerm]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GlossaryTerm).where(GlossaryTerm.project_id == project_id)
        )
        return list(result.scalars().all())
```

Create `backend/src/glossary/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GlossaryTermResponse(BaseModel):
    id: UUID
    source_term: str
    translated_term: str
    confirmed: bool
    context: str | None

    model_config = {"from_attributes": True}


class UpdateGlossaryTermRequest(BaseModel):
    translated_term: str = Field(max_length=255)
```

- [ ] **Step 5: Create PipelineTask model**

Create `backend/src/pipeline/__init__.py` (empty) and `backend/src/pipeline/model.py`:

```python
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class PipelineStage(StrEnum):
    PLAN = "plan"
    CLARIFY = "clarify"
    TRANSLATE = "translate"
    UNIFY = "unify"


class PipelineTaskStatus(StrEnum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    AWAITING_INPUT = "awaiting_input"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PipelineTask(Base):
    __tablename__ = "pipeline_task"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False
    )
    stage: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=PipelineTaskStatus.PENDING
    )
    result: Mapped[dict | None] = mapped_column(JSONB)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


async def get_pipeline_tasks(project_id: UUID) -> list[PipelineTask]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PipelineTask)
            .where(PipelineTask.project_id == project_id)
            .order_by(PipelineTask.created_at)
        )
        return list(result.scalars().all())
```

Create `backend/src/pipeline/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PipelineTaskResponse(BaseModel):
    id: UUID
    stage: str
    status: str
    result: dict | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create Artifact model**

Create `backend/src/artifact/__init__.py` (empty) and `backend/src/artifact/model.py`:

```python
from enum import StrEnum
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func, select
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ArtifactFormat(StrEnum):
    MARKDOWN = "markdown"
    PDF = "pdf"


class Artifact(Base):
    __tablename__ = "artifact"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False, index=True
    )
    document_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("document.id")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


async def get_artifacts_by_project(project_id: UUID) -> list[Artifact]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Artifact).where(Artifact.project_id == project_id)
        )
        return list(result.scalars().all())
```

Create `backend/src/artifact/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ArtifactResponse(BaseModel):
    id: UUID
    title: str
    format: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 7: Create Conversation and Message models**

Create `backend/src/conversation/__init__.py` (empty) and `backend/src/conversation/model.py`:

```python
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(Base):
    __tablename__ = "conversation"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("translation_project.id"), nullable=False, unique=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Message(Base):
    __tablename__ = "message"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7)
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("conversation.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    type: Mapped[str] = mapped_column(String(31), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    detail: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


async def get_or_create_conversation(project_id: UUID) -> Conversation:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Conversation).where(Conversation.project_id == project_id)
        )
        conv = result.scalars().one_or_none()
        if conv is None:
            conv = Conversation(project_id=project_id)
            session.add(conv)
            await session.commit()
            await session.refresh(conv)
        return conv


async def get_messages(
    conversation_id: UUID,
    cursor: UUID | None = None,
    limit: int = 50,
) -> list[Message]:
    async with AsyncSessionLocal() as session:
        query = select(Message).where(Message.conversation_id == conversation_id)
        if cursor:
            cursor_msg = await session.get(Message, cursor)
            if cursor_msg:
                query = query.where(Message.created_at < cursor_msg.created_at)
        query = query.order_by(Message.created_at.desc()).limit(limit)
        result = await session.execute(query)
        return list(result.scalars().all())
```

Create `backend/src/conversation/dto.py`:

```python
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    id: UUID
    role: str
    type: str
    content: str
    detail: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 8: Run all model tests**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_models.py tests/unit/test_project_model.py -v
```

Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add backend/src/chunk/ backend/src/glossary/ backend/src/pipeline/ backend/src/artifact/ backend/src/conversation/ backend/tests/unit/test_models.py
git commit -m "feat(models): add Chunk, GlossaryTerm, PipelineTask, Artifact, Conversation, Message models"
```

---

## Chunk 3: Storage & LLM Services

### Task 6: Implement storage abstraction

**Files:**
- Create: `backend/src/storage/__init__.py`
- Create: `backend/src/storage/backend.py`
- Create: `backend/src/storage/service.py`
- Test: `backend/tests/unit/test_storage.py`

- [ ] **Step 1: Write failing test for LocalStorageBackend**

Create `backend/tests/unit/test_storage.py`:

```python
import os
import pytest
import tempfile
from storage.backend import LocalStorageBackend


@pytest.fixture
def tmp_storage(tmp_path):
    return LocalStorageBackend(str(tmp_path))


@pytest.mark.asyncio
async def test_upload_and_download(tmp_storage):
    key = "test/file.txt"
    data = b"hello world"
    await tmp_storage.upload(key, data, "text/plain")
    result = await tmp_storage.download(key)
    assert result == data


@pytest.mark.asyncio
async def test_delete(tmp_storage):
    key = "test/file.txt"
    await tmp_storage.upload(key, b"data", "text/plain")
    await tmp_storage.delete(key)
    with pytest.raises(FileNotFoundError):
        await tmp_storage.download(key)


@pytest.mark.asyncio
async def test_get_url(tmp_storage):
    key = "test/file.txt"
    await tmp_storage.upload(key, b"data", "text/plain")
    url = await tmp_storage.get_url(key)
    assert "/files/test/file.txt" in url
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_storage.py -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 3: Implement storage backends**

Create `backend/src/storage/__init__.py` (empty) and `backend/src/storage/backend.py`:

```python
import os
import aiofiles
from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        ...

    @abstractmethod
    async def download(self, key: str) -> bytes:
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def get_url(self, key: str, expires: int = 3600) -> str:
        ...


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_path: str):
        self.base_path = base_path

    def _full_path(self, key: str) -> str:
        path = os.path.join(self.base_path, key)
        # Prevent path traversal
        if not os.path.abspath(path).startswith(os.path.abspath(self.base_path)):
            raise ValueError("Invalid storage key")
        return path

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        path = self._full_path(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return key

    async def download(self, key: str) -> bytes:
        path = self._full_path(key)
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {key}")
        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def delete(self, key: str) -> None:
        path = self._full_path(key)
        if os.path.exists(path):
            os.remove(path)

    async def get_url(self, key: str, expires: int = 3600) -> str:
        return f"/files/{key}"
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_storage.py -v
```

Expected: PASS

Note: add `aiofiles>=24.0.0` to pyproject.toml dependencies if not already present.

- [ ] **Step 5: Create StorageService wrapper**

Create `backend/src/storage/service.py`:

```python
import hashlib
from uuid import UUID

from uuid6 import uuid7

from conf.config import settings
from storage.backend import LocalStorageBackend, StorageBackend


def _create_backend() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3" and settings.STORAGE_S3_BUCKET:
        # S3 backend will be implemented when needed
        raise NotImplementedError("S3 backend not yet implemented")
    return LocalStorageBackend(settings.STORAGE_LOCAL_PATH)


_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    global _backend
    if _backend is None:
        _backend = _create_backend()
    return _backend


class StorageService:
    def __init__(self, backend: StorageBackend | None = None):
        self.backend = backend or get_storage_backend()

    def generate_key(
        self, tenant_id: UUID, project_id: UUID, category: str, ext: str
    ) -> str:
        file_id = uuid7()
        return f"{tenant_id}/{project_id}/{category}/{file_id}.{ext}"

    @staticmethod
    def compute_hash(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    async def upload_file(
        self,
        tenant_id: UUID,
        project_id: UUID,
        category: str,
        data: bytes,
        content_type: str,
        ext: str,
    ) -> tuple[str, str]:
        """Returns (storage_key, content_hash)."""
        key = self.generate_key(tenant_id, project_id, category, ext)
        content_hash = self.compute_hash(data)
        await self.backend.upload(key, data, content_type)
        return key, content_hash

    async def download_file(self, key: str) -> bytes:
        return await self.backend.download(key)

    async def delete_file(self, key: str) -> None:
        await self.backend.delete(key)

    async def get_file_url(self, key: str, expires: int = 3600) -> str:
        return await self.backend.get_url(key, expires)
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/storage/ backend/tests/unit/test_storage.py
git commit -m "feat(storage): add storage abstraction with local backend and service wrapper"
```

---

### Task 7: Implement LLM service with multi-profile support

**Files:**
- Create: `backend/src/llm/__init__.py`
- Create: `backend/src/llm/service.py`
- Create: `backend/src/llm/prompts/__init__.py`
- Create: `backend/src/llm/prompts/plan.py`
- Create: `backend/src/llm/prompts/clarify.py`
- Create: `backend/src/llm/prompts/translate.py`
- Create: `backend/src/llm/prompts/unify.py`
- Create: `backend/src/llm/prompts/chat.py`
- Test: `backend/tests/unit/test_llm_service.py`

- [ ] **Step 1: Write failing test for LLMService**

Create `backend/tests/unit/test_llm_service.py`:

```python
import pytest
from llm.service import LLMService, LLMProfile


def test_llm_profile_enum():
    assert LLMProfile.DEFAULT == "default"
    assert LLMProfile.FAST == "fast"
    assert LLMProfile.PRO == "pro"


def test_llm_service_get_model_name():
    service = LLMService(
        api_key="test-key",
        base_url="http://localhost",
        model_name="default-model",
        fast_model_name="fast-model",
        pro_model_name="pro-model",
    )
    assert service.get_model_name(LLMProfile.DEFAULT) == "default-model"
    assert service.get_model_name(LLMProfile.FAST) == "fast-model"
    assert service.get_model_name(LLMProfile.PRO) == "pro-model"


def test_llm_service_fallback_to_default():
    service = LLMService(
        api_key="test-key",
        base_url="http://localhost",
        model_name="default-model",
        fast_model_name="",
        pro_model_name="",
    )
    assert service.get_model_name(LLMProfile.FAST) == "default-model"
    assert service.get_model_name(LLMProfile.PRO) == "default-model"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_llm_service.py -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 3: Implement LLMService**

Create `backend/src/llm/__init__.py` (empty) and `backend/src/llm/service.py`:

```python
from enum import StrEnum
from typing import AsyncIterator

from langchain_openai import ChatOpenAI
from pydantic import BaseModel


class LLMProfile(StrEnum):
    DEFAULT = "default"
    FAST = "fast"
    PRO = "pro"


class LLMService:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model_name: str,
        fast_model_name: str = "",
        pro_model_name: str = "",
    ):
        self.api_key = api_key
        self.base_url = base_url
        self._models = {
            LLMProfile.DEFAULT: model_name,
            LLMProfile.FAST: fast_model_name or model_name,
            LLMProfile.PRO: pro_model_name or model_name,
        }

    def get_model_name(self, profile: LLMProfile) -> str:
        return self._models[profile]

    def _get_client(self, profile: LLMProfile) -> ChatOpenAI:
        return ChatOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            model=self.get_model_name(profile),
        )

    async def chat(
        self,
        messages: list[dict],
        profile: LLMProfile = LLMProfile.DEFAULT,
    ) -> str:
        client = self._get_client(profile)
        response = await client.ainvoke(messages)
        return response.content

    async def chat_structured(
        self,
        messages: list[dict],
        schema: type[BaseModel],
        profile: LLMProfile = LLMProfile.DEFAULT,
    ) -> BaseModel:
        client = self._get_client(profile)
        structured = client.with_structured_output(schema)
        return await structured.ainvoke(messages)

    async def chat_stream(
        self,
        messages: list[dict],
        profile: LLMProfile = LLMProfile.DEFAULT,
    ) -> AsyncIterator[str]:
        client = self._get_client(profile)
        async for chunk in client.astream(messages):
            if chunk.content:
                yield chunk.content
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/test_llm_service.py -v
```

Expected: PASS

- [ ] **Step 5: Create prompt template stubs**

Create `backend/src/llm/prompts/__init__.py` (empty).

Create `backend/src/llm/prompts/plan.py`:

```python
def build_plan_messages(extracted_text: str, config: dict) -> list[dict]:
    chunk_strategy = config.get("chunk_strategy", "auto")
    max_tokens = config.get("max_chunk_tokens", 2000)

    return [
        {
            "role": "system",
            "content": (
                "You are a document analysis expert. Analyze the given text and split it into "
                "translation-ready chunks. Each chunk should be a coherent section that can be "
                "translated independently while maintaining context.\n\n"
                f"Chunk strategy: {chunk_strategy}\n"
                f"Target max tokens per chunk: {max_tokens}\n\n"
                "Return a JSON array where each element has:\n"
                '- "chunk_index": integer starting from 0\n'
                '- "source_text": the text content of this chunk\n'
                '- "metadata": {"title": section title or null, "level": heading level or 0}'
            ),
        },
        {"role": "user", "content": extracted_text},
    ]
```

Create `backend/src/llm/prompts/clarify.py`:

```python
def build_clarify_messages(
    source_text: str, source_lang: str, target_lang: str
) -> list[dict]:
    return [
        {
            "role": "system",
            "content": (
                "You are a translation specialist. Identify specialized terms, proper nouns, "
                "and domain-specific vocabulary in the source text that need careful translation "
                f"from {source_lang} to {target_lang}.\n\n"
                "Return a JSON array where each element has:\n"
                '- "source_term": the original term\n'
                '- "translated_term": your proposed translation\n'
                '- "context": a short excerpt showing where the term appears\n\n'
                "Only include terms where translation choice matters. Skip common words."
            ),
        },
        {"role": "user", "content": source_text},
    ]
```

Create `backend/src/llm/prompts/translate.py`:

```python
def build_translate_messages(
    source_text: str,
    target_lang: str,
    glossary: list[dict],
    previous_context: str = "",
    config: dict | None = None,
) -> list[dict]:
    glossary_str = ""
    if glossary:
        lines = [f"- {t['source_term']} → {t['translated_term']}" for t in glossary]
        glossary_str = "\nMandatory terminology:\n" + "\n".join(lines) + "\n"

    context_str = ""
    if previous_context:
        context_str = (
            f"\nPrevious section ending (for coherence):\n{previous_context}\n"
        )

    formality = (config or {}).get("formality", "neutral")

    return [
        {
            "role": "system",
            "content": (
                f"You are a professional translator. Translate the following text to {target_lang}. "
                f"Formality: {formality}. Preserve the original formatting (Markdown, lists, etc.)."
                f"{glossary_str}{context_str}\n"
                "Output ONLY the translated text, no explanations."
            ),
        },
        {"role": "user", "content": source_text},
    ]
```

Create `backend/src/llm/prompts/unify.py`:

```python
def build_unify_messages(
    translated_chunks: list[dict], target_lang: str
) -> list[dict]:
    combined = "\n\n---CHUNK_BOUNDARY---\n\n".join(
        c["translated_text"] for c in translated_chunks
    )

    return [
        {
            "role": "system",
            "content": (
                "You are a professional editor. The following text has been translated in chunks. "
                "Your job is to:\n"
                "1. Remove chunk boundary markers (---CHUNK_BOUNDARY---)\n"
                "2. Fix any transition issues between chunks\n"
                "3. Ensure consistent terminology throughout\n"
                "4. Preserve all Markdown formatting\n"
                "5. Output the complete, polished translated document\n\n"
                f"Target language: {target_lang}\n"
                "Output ONLY the final document, no explanations."
            ),
        },
        {"role": "user", "content": combined},
    ]
```

Create `backend/src/llm/prompts/chat.py`:

```python
def build_chat_messages(
    conversation_history: list[dict],
    user_message: str,
    source_lang: str,
    target_lang: str,
    glossary: list[dict],
    translation_summary: str = "",
) -> list[dict]:
    glossary_str = ""
    if glossary:
        lines = [f"- {t['source_term']} → {t['translated_term']}" for t in glossary]
        glossary_str = "\nCurrent glossary:\n" + "\n".join(lines)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a translation assistant. You help the user understand and refine "
                f"a translation from {source_lang} to {target_lang}.\n"
                f"{glossary_str}\n"
                f"Translation summary: {translation_summary or 'Not available'}\n\n"
                "You can answer questions about translation choices, explain terminology, "
                "and suggest improvements."
            ),
        },
    ]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})
    return messages
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/llm/ backend/tests/unit/test_llm_service.py
git commit -m "feat(llm): add LLMService with multi-profile support and prompt templates"
```

---

### Task 8: Create WebSocket manager and Kafka worker base

**Files:**
- Create: `backend/src/ws/__init__.py`
- Create: `backend/src/ws/manager.py`
- Create: `backend/src/worker/__init__.py`
- Create: `backend/src/worker/base.py`

- [ ] **Step 1: Create WebSocket manager**

Create `backend/src/ws/__init__.py` (empty) and `backend/src/ws/manager.py`:

```python
import asyncio
import json
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import WebSocket
from loguru import logger

from conf.redis import get_redis


class WebSocketManager:
    def __init__(self):
        self._connections: dict[UUID, set[WebSocket]] = {}

    async def connect(self, project_id: UUID, ws: WebSocket):
        await ws.accept()
        if project_id not in self._connections:
            self._connections[project_id] = set()
        self._connections[project_id].add(ws)
        logger.info(f"WebSocket connected for project {project_id}")

    def disconnect(self, project_id: UUID, ws: WebSocket):
        if project_id in self._connections:
            self._connections[project_id].discard(ws)
            if not self._connections[project_id]:
                del self._connections[project_id]
        logger.info(f"WebSocket disconnected for project {project_id}")

    async def broadcast(self, project_id: UUID, event: dict):
        if project_id not in self._connections:
            return
        dead = set()
        message = json.dumps(event)
        for ws in self._connections[project_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[project_id].discard(ws)

    async def listen_redis(self, project_id: UUID, ws: WebSocket):
        """Subscribe to Redis Pub/Sub and forward events to WebSocket."""
        r = get_redis()
        pubsub = r.pubsub()
        channel = f"project:{project_id}"
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await ws.send_text(message["data"].decode("utf-8"))
        except Exception:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()


ws_manager = WebSocketManager()


async def publish_event(project_id: UUID, event: dict):
    """Publish event to Redis Pub/Sub channel for a project."""
    r = get_redis()
    channel = f"project:{project_id}"
    payload = json.dumps(event)
    await r.publish(channel, payload)

    # Also store in sorted set for reconnection replay
    events_key = f"project_events:{project_id}"
    seq = event.get("seq", 0)
    await r.zadd(events_key, {payload: seq})
    await r.expire(events_key, 14400)  # 4h TTL
```

- [ ] **Step 2: Create Kafka worker base**

Create `backend/src/worker/__init__.py` (empty) and `backend/src/worker/base.py`:

```python
import asyncio
from abc import ABC, abstractmethod

from aiokafka import AIOKafkaConsumer
from loguru import logger

from conf.kafka import create_kafka_consumer


class BaseWorker(ABC):
    def __init__(self, topic: str, max_concurrency: int = 5):
        self.topic = topic
        self.max_concurrency = max_concurrency
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._running = False
        self._consumer: AIOKafkaConsumer | None = None

    @abstractmethod
    async def handle_message(self, message: dict) -> None:
        ...

    async def start(self):
        self._running = True
        self._consumer = create_kafka_consumer(self.topic)
        await self._consumer.start()
        logger.info(f"Worker started for topic: {self.topic}")
        try:
            async for msg in self._consumer:
                if not self._running:
                    break
                async with self._semaphore:
                    try:
                        await self.handle_message(msg.value)
                        await self._consumer.commit()
                    except Exception as e:
                        logger.exception(f"Error processing message: {e}")
                        await self._consumer.commit()
        finally:
            await self._consumer.stop()
            logger.info(f"Worker stopped for topic: {self.topic}")

    async def stop(self):
        self._running = False
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/ws/ backend/src/worker/
git commit -m "feat(infra): add WebSocket manager with Redis Pub/Sub and Kafka worker base class"
```

---

### Task 9: Wire up Alembic migrations and update main.py

**Files:**
- Modify: `backend/migration/alembic/env.py`
- Modify: `backend/src/main.py`

- [ ] **Step 1: Update Alembic env.py to import all new models**

In `backend/migration/alembic/env.py`, add imports for all new models:

```python
# Import all models for Alembic auto-generation
from project.model import TranslationProject
from document.model import Document
from chunk.model import Chunk
from glossary.model import GlossaryTerm
from pipeline.model import PipelineTask
from artifact.model import Artifact
from conversation.model import Conversation, Message
```

- [ ] **Step 2: Update main.py to add Kafka lifespan**

Read the existing `backend/src/main.py` and update the lifespan to include Kafka producer startup/shutdown:

```python
# Add to imports
from conf.kafka import get_kafka_producer, close_kafka_producer

# In the lifespan context manager, add:
# On startup:
await get_kafka_producer()

# On shutdown:
await close_kafka_producer()
```

- [ ] **Step 3: Verify everything imports correctly**

```bash
cd backend && PYTHONPATH=src python -c "
from project.model import TranslationProject
from document.model import Document
from chunk.model import Chunk
from glossary.model import GlossaryTerm
from pipeline.model import PipelineTask
from artifact.model import Artifact
from conversation.model import Conversation, Message
from storage.service import StorageService
from llm.service import LLMService
print('All imports successful')
"
```

Expected: `All imports successful`

- [ ] **Step 4: Run all tests**

```bash
cd backend && PYTHONPATH=src pytest tests/unit/ -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add backend/migration/ backend/src/main.py
git commit -m "feat: wire Alembic migrations for all models and add Kafka to lifespan"
```

---

### Task 10: Add docker-compose.yml with all infrastructure

**Files:**
- Create: `docker-compose.yml` (at repo root)

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml` at repo root:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: translator
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  kafka:
    image: apache/kafka:3.9.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: translator-dev-cluster-001
    healthcheck:
      test: ["CMD-SHELL", "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092"]
      interval: 10s
      timeout: 10s
      retries: 5

volumes:
  pg_data:
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose with PostgreSQL, Redis, and Kafka"
```

---

## Summary

After completing Plan 1, the backend will have:

- Full boilerplate scaffolding (auth, user, tenant modules working)
- All 8 ORM models matching the design spec
- Storage abstraction (local backend, S3 placeholder)
- LLM service with multi-profile support and all prompt templates
- WebSocket manager with Redis Pub/Sub
- Kafka producer/consumer base classes
- Docker Compose for all infrastructure services
- Unit tests for models, storage, LLM service, and document extractor

**Next**: Plan 2 (Translation Pipeline) will implement the pipeline executor stages and Kafka workers.
