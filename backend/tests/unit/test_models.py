from chunk.model import Chunk, ChunkStatus
from glossary.model import GlossaryTerm
from pipeline.model import PipelineStage, PipelineTask, PipelineTaskStatus
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
