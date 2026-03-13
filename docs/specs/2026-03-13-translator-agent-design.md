# ACPs Translator Agent — System Design

> Version: 1.0 | Date: 2026-03-13 | Status: Draft

## 1. Overview

A full-stack translation application that:

- **Externally** acts as an ACPs Partner, discoverable and callable by other agents via AIP RPC
- **Internally** runs a 4-stage pipeline (Plan → Clarify → Translate → Unify) driven by LLM
- **Provides** a web frontend for direct user interaction, pipeline visualization, and post-translation chat assistant

### Goals

1. Translate multi-format documents (plain text, Markdown, PDF, DOCX, HTML) into any target language
2. Handle large documents via intelligent chunking and staged translation
3. Allow users to confirm/edit specialized term translations before proceeding
4. Output structured Markdown with export to Markdown and PDF files
5. Provide a post-translation chat assistant for Q&A and term modification
6. Comply with ACPs v2.0.0 protocol as a Partner agent
7. Persist all data properly; no ad-hoc file storage

### Non-Goals (for v1)

- Acting as an ACPs Leader to orchestrate external agents
- Real-time collaborative editing
- Translation memory database across projects

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Arco Design)            │
│  ProjectList │ PipelineView │ GlossaryEditor │ ChatAssistant │
│                         WebSocket                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                      FastAPI Backend                         │
│                              │                              │
│  REST API ──── WebSocket Manager ──── ACPs Partner (RPC)    │
│       │         (Redis Pub/Sub)              │              │
│       └────────────┬─────────────────────────┘              │
│              Service Layer (async)                           │
│  ProjectService · PipelineService · ChatService              │
│  GlossaryService · StorageService · LLMService               │
│       │                                                     │
│  Task Producer ──→ Kafka                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────────┐
│          Kafka Consumer Workers (async)                      │
│  PipelineExecutor (Plan → Clarify → Translate → Unify)      │
│  ChatExecutor (Q&A + term modification)                      │
│       │ publish progress → Redis Pub/Sub                    │
└───────┼─────────────────────────────────────────────────────┘
        │
   ┌────┴────┐  ┌───────┐  ┌─────────┐
   │PostgreSQL│  │ Redis │  │ Storage │
   │          │  │       │  │(Local/S3)│
   └─────────┘  └───────┘  └─────────┘
```

### Core Principles

- **REST API is thin**: CRUD + enqueue only, never executes long-running logic
- **Kafka workers are independent**: Pipeline execution survives frontend closure
- **All async**: Deep async/await throughout; no child threads unless absolutely necessary
- **WebSocket + Redis Pub/Sub**: Real-time push that scales horizontally across backend instances
- **Pipeline pause/resume**: At Clarify stage, worker saves state to DB and exits; user confirmation re-enqueues a continuation task

---

## 3. Data Model

### 3.1 translation_project

The top-level entity representing one translation job.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| user_id | UUID | FK → user.id |
| tenant_id | UUID | FK → tenant.id |
| title | VARCHAR(255) | Auto-generated or user-provided |
| source_language | VARCHAR(10) | ISO 639-1, nullable (auto-detect) |
| target_language | VARCHAR(10) | ISO 639-1, required |
| status | ENUM | created → planning → clarifying → translating → unifying → completed / failed |
| config | JSONB | Formality, domain hints, skip_clarify flag, etc. |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| is_deleted | BOOLEAN | Soft delete |
| deleted_at | TIMESTAMPTZ | |

### 3.2 document

Source document uploaded by user.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK → translation_project.id |
| file_name | VARCHAR(255) | Original file name |
| mime_type | VARCHAR(127) | e.g. text/plain, application/pdf |
| file_size | BIGINT | Bytes |
| storage_key | VARCHAR(512) | Key in storage backend |
| content_hash | VARCHAR(64) | SHA-256 for dedup |
| extracted_text | TEXT | Full text extracted from document |
| created_at | TIMESTAMPTZ | |

### 3.3 chunk

Translation unit produced by Plan stage.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK |
| index | INTEGER | Ordering within project |
| source_text | TEXT | Original text segment |
| translated_text | TEXT | Nullable until translated |
| status | ENUM | pending → translating → completed / failed |
| token_count | INTEGER | For LLM context planning |
| metadata | JSONB | Section title, heading level, structural hints |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 3.4 glossary_term

Specialized terms extracted during Clarify stage.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK |
| source_term | VARCHAR(255) | Original term |
| translated_term | VARCHAR(255) | Proposed or confirmed translation |
| confirmed | BOOLEAN | Default false; true after user confirms |
| context | TEXT | Surrounding text where term was found |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 3.5 pipeline_task

Tracks execution of each pipeline stage.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK |
| stage | ENUM | plan / clarify / translate / unify |
| status | ENUM | pending / queued / running / awaiting_input / completed / failed / cancelled |
| result | JSONB | Stage-specific output data |
| error_message | TEXT | On failure |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### 3.6 artifact

Generated translation output.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK |
| title | VARCHAR(255) | |
| format | ENUM | markdown / pdf |
| storage_key | VARCHAR(512) | Key in storage backend |
| file_size | BIGINT | |
| created_at | TIMESTAMPTZ | |

### 3.7 conversation

Post-translation chat session, one per project.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| project_id | UUID | FK, unique |
| created_at | TIMESTAMPTZ | |

### 3.8 message

Chat messages within a conversation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID v7 | PK |
| conversation_id | UUID | FK |
| role | ENUM | user / assistant |
| type | VARCHAR(31) | Message subtype (see below) |
| content | TEXT | Primary text content |
| detail | JSONB | Structured data per type |
| created_at | TIMESTAMPTZ | |

**Message types:**

| role:type | Purpose | detail schema |
|-----------|---------|---------------|
| user:text | User chat input | `{}` |
| user:term-edit | User modifies a term | `{term_id, new_translation}` |
| assistant:reply | Assistant response | `{}` |
| assistant:term-updated | Confirms term change | `{term_id, old_translation, new_translation}` |
| assistant:artifact | New artifact generated | `{artifact_id, format}` |

### Indexes

- `idx_chunk_project` on (project_id, index) — ordered chunk retrieval
- `idx_glossary_project` on (project_id) — all terms for a project
- `idx_pipeline_task_project` on (project_id, stage) — stage lookup
- `idx_message_conversation` on (conversation_id, created_at) — chat history
- `idx_project_user` on (user_id, created_at DESC) — user's projects

---

## 4. Pipeline Design

### 4.1 Stage Flow

```
[Created] → Plan → Clarify → Translate → Unify → [Completed]
                      │
                      ├── (skip_clarify=true) ──→ Translate
                      │
                      └── AwaitingInput ──→ User confirms ──→ Translate
```

### 4.2 Plan Stage

**Input**: document.extracted_text, project.config
**LLM Task**: Analyze document structure, determine optimal chunking strategy
**Output**: chunk[] rows inserted into DB

Logic:
1. Read extracted_text from document
2. Call LLM with planning prompt: identify sections, estimate token counts, propose split points
3. LLM returns structured output: `[{index, source_text, metadata: {title, level}}]`
4. Batch insert chunks into DB
5. Mark stage completed

**Context sharing hook**: Plan results (chunk metadata, document structure analysis) stored in pipeline_task.result for downstream stages.

### 4.3 Clarify Stage

**Input**: chunk[].source_text (all chunks)
**LLM Task**: Extract specialized terms, propose translations
**Output**: glossary_term[] rows inserted into DB

Logic:
1. Send all source text to LLM with term extraction prompt
2. LLM returns: `[{source_term, translated_term, context}]`
3. Insert glossary_terms with confirmed=false
4. If terms found: set pipeline_task.status = awaiting_input → **worker exits**
5. If no terms (or skip_clarify=true): auto-confirm all → proceed to Translate

**Resume**: When user confirms terms (via REST API), a new Kafka message is produced to continue from Translate stage.

### 4.4 Translate Stage

**Input**: chunk[], glossary_term[] (confirmed)
**LLM Task**: Translate each chunk respecting glossary
**Output**: chunk.translated_text updated per chunk

Logic:
1. Load confirmed glossary as context
2. For each chunk (ordered by index):
   a. Build prompt: source_text + glossary + previous chunk context (for coherence)
   b. Call LLM for translation
   c. Update chunk.translated_text and status
   d. Publish progress event to Redis: `{stage: "translate", chunk_index, total_chunks}`
3. Mark stage completed

**Context sharing hook**: Each chunk's translation receives the previous chunk's last N sentences as context overlap, ensuring coherence across boundaries. Glossary is injected into every chunk's system prompt.

### 4.5 Unify Stage

**Input**: chunk[].translated_text (all completed), document metadata
**LLM Task**: Light editing pass for coherence, generate final Markdown
**Output**: artifact (Markdown file), optionally PDF

Logic:
1. Concatenate translated chunks in order, restoring document structure (headings, lists, etc.) from chunk.metadata
2. Call LLM with unification prompt: check cross-chunk coherence, fix transitions, ensure consistent terminology
3. Generate final Markdown content
4. Upload to storage backend → create artifact record
5. Optionally convert Markdown → PDF (via library, not LLM) → create second artifact
6. Mark stage completed, project status → completed

---

## 5. Task Queue (Kafka)

### Topic Design

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `translator.pipeline` | Pipeline stage execution | project_id |
| `translator.chat` | Chat Q&A tasks | project_id |

Partitioning by project_id ensures all stages of the same project are processed in order within the same partition.

### Message Schema

```json
{
  "project_id": "uuid",
  "task_id": "uuid",
  "action": "execute_stage",
  "stage": "plan",
  "payload": {},
  "enqueued_at": "2026-03-13T12:00:00Z"
}
```

### Consumer Design

- Consumer group: `translator-workers`
- Each consumer is a long-running async process
- Consumes message → loads project state from DB → executes stage → publishes progress to Redis → updates DB → commits Kafka offset
- On failure: update pipeline_task.status = failed, publish error event, do NOT retry automatically (user can retry via UI)
- Concurrency: configurable max concurrent tasks per worker via asyncio.Semaphore

### Clarify Pause/Resume

```
Worker reaches Clarify:
  → Extracts terms via LLM
  → Writes glossary_terms to DB
  → Sets pipeline_task.status = awaiting_input
  → Publishes "clarify_request" event to Redis
  → Commits Kafka offset (task is "done" from Kafka's perspective)

User confirms terms via REST:
  → REST handler updates glossary_terms.confirmed = true
  → Produces new Kafka message: {action: "execute_stage", stage: "translate"}
  → Worker picks up → continues from Translate stage
```

---

## 6. Real-Time Communication

### WebSocket + Redis Pub/Sub

**Why not SSE**: WebSocket is bidirectional — needed for chat, and provides better connection lifecycle management. Single transport for both pipeline progress and chat.

**Channel naming**: `project:{project_id}`

**Event schema**:
```json
{
  "event": "pipeline_progress",
  "data": {
    "stage": "translate",
    "status": "running",
    "progress": {"current_chunk": 3, "total_chunks": 10},
    "timestamp": "..."
  }
}
```

**Event types**:
| Event | When |
|-------|------|
| `pipeline_stage_started` | Worker begins a stage |
| `pipeline_progress` | Translation chunk completed |
| `pipeline_stage_completed` | Stage finished |
| `clarify_request` | Terms ready for user review |
| `pipeline_completed` | All stages done, artifacts ready |
| `pipeline_failed` | Stage failed with error |
| `chat_message` | Chat assistant response |
| `chat_stream` | Chat streaming token (if streaming enabled) |

**Flow**:
1. Frontend connects WebSocket to `/ws/project/{project_id}`
2. Backend WebSocket handler subscribes to Redis channel `project:{project_id}`
3. Kafka workers publish events to same Redis channel
4. WebSocket handler forwards events to connected clients
5. Multiple frontend clients can watch same project (Redis fan-out)

**Reconnection**: Frontend sends last received event timestamp on reconnect. Backend queries recent events from a short-lived Redis list (last 50 events, TTL 1h) and replays missed ones.

---

## 7. File Storage Abstraction

### Interface

```python
class StorageBackend(ABC):
    async def upload(self, key: str, data: bytes, content_type: str) -> str
    async def download(self, key: str) -> bytes
    async def delete(self, key: str) -> None
    async def get_url(self, key: str, expires: int = 3600) -> str
```

### Implementations

- **LocalStorageBackend**: Stores files in `uploads/` directory. `get_url` returns a backend-served endpoint `/files/{key}`.
- **S3StorageBackend**: Uses aiobotocore for async S3 operations. `get_url` returns presigned URL.

### Configuration

```env
# If S3 vars are set, use S3; otherwise fallback to local
STORAGE_BACKEND=local          # "local" or "s3"
STORAGE_LOCAL_PATH=./uploads
STORAGE_S3_BUCKET=
STORAGE_S3_ENDPOINT=
STORAGE_S3_ACCESS_KEY=
STORAGE_S3_SECRET_KEY=
STORAGE_S3_REGION=
```

### Key Generation

Storage keys follow: `{tenant_id}/{project_id}/{category}/{uuid}.{ext}`

Categories: `source` (uploaded docs), `artifact` (translation output)

### Isolation

All other modules interact only with `StorageService`, never with the backend directly. StorageService wraps StorageBackend and adds key generation, validation, and cleanup.

---

## 8. LLM Integration

### Provider Abstraction

Based on the boilerplate's LangChain integration, extended with multi-profile support:

```python
class LLMService:
    """Provides async LLM calls with configurable model profiles."""

    async def chat(self, messages, profile="default") -> str
    async def chat_structured(self, messages, schema, profile="default") -> BaseModel
    async def chat_stream(self, messages, profile="default") -> AsyncIterator[str]
```

### Model Profiles

```env
# Default profile (used for most tasks)
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL_NAME=deepseek/deepseek-chat-v3

# Fast profile (used for term extraction, light edits)
LLM_FAST_MODEL_NAME=deepseek/deepseek-chat-v3

# Pro profile (used for final unification pass)
LLM_PRO_MODEL_NAME=anthropic/claude-sonnet-4
```

Each pipeline stage can specify which profile to use. This allows cost/quality optimization (fast model for extraction, pro model for final polish).

### Prompt Management

Prompts stored as templates in `backend/src/translator/prompts/`:
- `plan.py` — Document analysis and chunking
- `clarify.py` — Term extraction
- `translate.py` — Chunk translation (with glossary injection)
- `unify.py` — Coherence editing and Markdown generation
- `chat.py` — Post-translation Q&A system prompt

Each prompt module exports a function that takes structured input and returns formatted messages list.

---

## 9. Chat Assistant

### Purpose

Post-translation Q&A assistant embedded in each project. Activated after pipeline completes.

### Capabilities (v1)

1. **Q&A**: Answer questions about the translation (why a term was translated this way, explain source text)
2. **Term modification**: User requests term change → assistant updates glossary → optionally re-translates affected chunks

### Context

Chat LLM receives as context:
- Project config (source/target language)
- Glossary terms (all confirmed terms)
- Source and translated text (or summaries for very large docs)
- Conversation history

### Term Modification Flow

```
User: "把所有的 'machine learning' 改译为 '机器学习' 而不是 '机器习得'"
  → ChatExecutor receives via Kafka
  → Identifies term modification intent
  → Updates glossary_term.translated_term
  → Finds affected chunks
  → Re-translates affected chunks only
  → Regenerates artifact
  → Publishes events: term_updated, artifact_updated
  → Returns confirmation message
```

This is a v2 enhancement; v1 focuses on Q&A only.

---

## 10. ACPs Partner Interface

### ACS Definition

```json
{
  "aic": "<assigned-aic>",
  "protocolVersion": "02.00",
  "name": "ACPs Translator Agent",
  "description": "Multi-language document translation agent supporting Plan-Clarify-Translate-Unify pipeline",
  "version": "1.0.0",
  "agentProvider": {
    "countryCode": "CN",
    "organization": "...",
    "name": "...",
    "email": "..."
  },
  "securitySchemes": {
    "mutualTLS": {
      "type": "mutualTLS",
      "description": "mTLS for agent-to-agent authentication",
      "x-caChallengeBaseUrl": "https://..."
    }
  },
  "endPoints": [{
    "url": "https://<host>/acps/rpc",
    "transport": "JSONRPC",
    "security": [{"mutualTLS": []}]
  }],
  "capabilities": {
    "streaming": false,
    "notification": false,
    "messageQueue": []
  },
  "defaultInputModes": ["text/plain", "text/markdown", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/html"],
  "defaultOutputModes": ["text/markdown", "application/pdf"],
  "skills": [
    {
      "id": "translator.document",
      "name": "Document Translation",
      "description": "Translate documents with term clarification and structured output",
      "tags": ["translation", "document", "multilingual"],
      "examples": ["Translate this PDF from English to Chinese"]
    },
    {
      "id": "translator.text",
      "name": "Text Translation",
      "description": "Translate plain text directly",
      "tags": ["translation", "text", "multilingual"],
      "examples": ["Translate: Hello World → Chinese"]
    }
  ]
}
```

### AIP RPC Mapping

| TaskCommand | Action |
|-------------|--------|
| `start` | Create project from dataItems, enqueue pipeline, return Accepted |
| `get` | Return current pipeline state + progress |
| `continue` | Handle clarify confirmation (term edits in dataItems), re-enqueue |
| `complete` | Acknowledge final artifact, return Completed |
| `cancel` | Cancel running pipeline tasks |

### Task State Mapping

| Pipeline Status | AIP TaskState |
|-----------------|---------------|
| created / planning / translating / unifying | Working |
| clarifying (awaiting_input) | AwaitingInput |
| completed | AwaitingCompletion |
| User confirms complete | Completed |
| failed | Failed |

### mTLS

Reserved but mocked for development. `MTLSConfig` from acps-sdk used when certificates are available. Configuration:

```env
ACPS_ENABLED=true
ACPS_AIC=<mock-aic-for-dev>
ACPS_CERT_DIR=./certs
ACPS_MOCK_AUTH=true
```

---

## 11. Context Sharing (Extensibility)

Each pipeline stage writes its output to `pipeline_task.result` (JSONB). Downstream stages read upstream results for context:

| Stage | Writes to result | Consumed by |
|-------|-----------------|-------------|
| Plan | `{structure_analysis, chunk_strategy, total_tokens}` | Translate (coherence hints) |
| Clarify | `{terms_count, domain_detected}` | Translate (domain context) |
| Translate | `{chunks_translated, avg_quality_score}` | Unify (quality notes) |
| Unify | `{artifact_ids, final_word_count}` | Chat (context) |

**Future extension point**: A `PipelineContext` object can be introduced to aggregate cross-stage state, enabling more sophisticated context sharing (e.g., translation memory, style guides, cross-reference tracking) without changing the pipeline interface.

---

## 12. REST API Design

### Projects

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects` | Create project (upload doc + config) |
| GET | `/api/v1/projects` | List user's projects |
| GET | `/api/v1/projects/{id}` | Get project detail + pipeline status |
| DELETE | `/api/v1/projects/{id}` | Soft delete project |

### Pipeline

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects/{id}/start` | Start pipeline execution |
| POST | `/api/v1/projects/{id}/clarify/confirm` | Confirm glossary terms |
| POST | `/api/v1/projects/{id}/retry` | Retry failed stage |
| GET | `/api/v1/projects/{id}/pipeline` | Get all pipeline stages status |

### Glossary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{id}/glossary` | List all terms |
| PUT | `/api/v1/projects/{id}/glossary/{term_id}` | Edit term translation |
| POST | `/api/v1/projects/{id}/glossary/confirm-all` | Confirm all terms |

### Artifacts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{id}/artifacts` | List artifacts |
| GET | `/api/v1/projects/{id}/artifacts/{artifact_id}/download` | Download file |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects/{id}/chat` | Send chat message |
| GET | `/api/v1/projects/{id}/chat/history` | Get chat history (paginated) |

### WebSocket

| Path | Description |
|------|-------------|
| `/ws/project/{id}` | Real-time project events |

### ACPs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/acps/rpc` | AIP JSON-RPC endpoint |
| GET | `/.well-known/acs.json` | ACS capability spec (optional) |

---

## 13. Frontend Architecture

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/projects` | ProjectListPage | List all translation projects |
| `/projects/new` | NewProjectPage | Upload doc + select target language |
| `/projects/:id` | ProjectDetailPage | Pipeline view + glossary + artifacts |
| `/projects/:id/chat` | ChatPage | Post-translation Q&A |

### Key Components

- **PipelineProgress**: Visual step indicator (Plan → Clarify → Translate → Unify)
- **GlossaryEditor**: Table of source/translated terms with inline editing
- **ChunkPreview**: Side-by-side source/translation view per chunk
- **ArtifactDownload**: Download buttons for Markdown/PDF
- **ChatPanel**: Message list + input, with term modification support

### State Management (Zustand)

- `projectStore`: Current project, pipeline status, glossary terms
- `chatStore`: Chat messages, streaming state
- `authStore`: (inherited from boilerplate)
- `appStore`: (inherited from boilerplate)

### WebSocket Integration

- Connect on project detail page mount
- Reconnect with exponential backoff
- Update Zustand store on event receipt
- Disconnect on page unmount

---

## 14. Testing Strategy

### Backend

| Level | Tool | Scope |
|-------|------|-------|
| Unit | pytest + pytest-asyncio | Service functions, LLM prompt formatting, storage abstraction |
| Integration | pytest + aiosqlite + fakeredis | Full API request/response cycles |
| Pipeline | pytest | Stage execution with mocked LLM responses |

### Frontend

| Level | Tool | Scope |
|-------|------|-------|
| Component | Vitest + React Testing Library | Individual component rendering |
| E2E (smoke) | Playwright | Full flow: upload → pipeline → download |

### ACPs Compliance

| Test | Description |
|------|-------------|
| AIP RPC roundtrip | Start → Get → Continue → Complete lifecycle |
| ACS validation | Validate ACS JSON against SDK schema |

---

## 15. Tech Stack Summary

### Backend

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (async) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Cache/PubSub | Redis 7 |
| Task Queue | Kafka (aiokafka) |
| LLM | LangChain + OpenAI-compatible API |
| File Storage | Local / S3 (aiobotocore) |
| ACPs SDK | acps-sdk 2.0.0 |
| PDF Generation | markdown + weasyprint (or similar) |
| Document Parsing | python-docx, PyMuPDF, beautifulsoup4 |
| Testing | pytest, pytest-asyncio, fakeredis |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript |
| UI Library | Arco Design |
| State | Zustand |
| Routing | React Router v6 |
| HTTP | Axios |
| WebSocket | Native WebSocket API |
| Build | Vite + SWC |
| Testing | Vitest, Playwright |

---

## 16. Monorepo Structure

```
translator/
├── backend/
│   ├── src/
│   │   ├── main.py                    # FastAPI app factory
│   │   ├── conf/                      # Config, DB, Redis, Kafka
│   │   ├── common/                    # Response, errors, utils
│   │   ├── middleware/                # Auth, logging
│   │   ├── auth/                      # Auth module (from boilerplate)
│   │   ├── user/                      # User module (from boilerplate)
│   │   ├── tenant/                    # Tenant module (from boilerplate)
│   │   ├── project/                   # Translation project CRUD
│   │   ├── pipeline/                  # Pipeline stages + executor
│   │   ├── glossary/                  # Glossary term management
│   │   ├── chat/                      # Chat assistant
│   │   ├── artifact/                  # Artifact management
│   │   ├── storage/                   # File storage abstraction
│   │   ├── llm/                       # LLM service + prompts
│   │   ├── acps/                      # ACPs Partner integration
│   │   ├── ws/                        # WebSocket manager
│   │   └── worker/                    # Kafka consumer workers
│   ├── migration/                     # Alembic migrations
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── conftest.py
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── CLAUDE.md
├── frontend/
│   ├── src/
│   │   ├── api/                       # API client modules
│   │   ├── components/                # Shared components
│   │   ├── hooks/                     # Custom hooks
│   │   ├── layouts/                   # Auth, Main layouts
│   │   ├── locales/                   # i18n
│   │   ├── pages/                     # Page components
│   │   ├── router/                    # Route config
│   │   ├── stores/                    # Zustand stores
│   │   ├── styles/                    # Global styles
│   │   ├── types/                     # TypeScript types
│   │   └── utils/                     # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── CLAUDE.md
├── docs/
│   └── specs/                         # Design documents
├── docker-compose.yml                 # PostgreSQL + Redis + Kafka + App
├── .gitignore
├── CLAUDE.md                          # Root workflow guide
└── README.md
```
