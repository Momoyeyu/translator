import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  confirmGlossary,
  cancelPipeline,
  getArtifacts,
  getGlossary,
  getPipeline,
  getProject,
  startPipeline,
  retryPipeline,
  type GlossaryTerm,
  type Artifact,
} from '../../api/project';
import { getEvents, type PipelineEvent } from '../../api/events';
import { useProjectStore } from '../../stores/projectStore';
import { useProjectWebSocket } from '../../hooks/useProjectWebSocket';
import { getAccessToken } from '../../utils/token';
import ArtifactList from '../../components/project/ArtifactList';
import ChatPanel from '../../components/project/ChatPanel';
import FloatingTOC from '../../components/project/FloatingTOC';
import './ProjectDetailPage.less';

// ── Stream item types ──────────────────────────────────────
type StreamItem =
  | { type: 'hero' }
  | { type: 'divider'; label: string; sectionId: string }
  | { type: 'thinking'; text: string }
  | { type: 'stage-complete'; text: string }
  | { type: 'stage-failed'; text: string }
  | { type: 'term'; data: GlossaryTerm }
  | { type: 'confirm-action'; count: number }
  | { type: 'chunk'; data: PipelineEvent }
  | { type: 'artifact'; artifacts: Artifact[] }
  | { type: 'chat' }
  | { type: 'start-prompt' };

// ── Helpers ────────────────────────────────────────────────
function getThinkingText(stage: string): string {
  switch (stage) {
    case 'plan': return 'Analyzing document structure...';
    case 'clarify': return 'Searching for specialized terms...';
    case 'translate': return 'Translating content...';
    case 'unify': return 'Assembling final document...';
    default: return 'Processing...';
  }
}

function getStageCompleteText(stage: string, result: Record<string, unknown> | null): string {
  switch (stage) {
    case 'plan': {
      const count = result?.chunks_count ?? result?.chunk_count ?? '?';
      return `Plan completed \u2014 ${count} chunks identified`;
    }
    case 'clarify': return 'Terms reviewed';
    case 'translate': return 'Translation completed';
    case 'unify': return 'Document assembled';
    default: return `${stage} completed`;
  }
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'var(--color-success, #2E7D32)';
  if (confidence >= 0.5) return 'var(--color-warning, #C67A00)';
  return 'var(--color-danger, #C62828)';
}

function confidenceClass(confidence: number): string {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = getAccessToken();
  const {
    currentProject,
    pipelineTasks,
    glossaryTerms,
    artifacts,
    pipelineEvents,
    setCurrentProject,
    setPipelineTasks,
    setGlossaryTerms,
    setArtifacts,
    setPipelineEvents,
  } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('plan');
  const streamRef = useRef<HTMLDivElement>(null);

  useProjectWebSocket(id, token ?? undefined);

  // ── Fetch all project data on mount ──
  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, pipeRes, glossRes, artifactRes, eventsRes] = await Promise.all([
        getProject(id),
        getPipeline(id),
        getGlossary(id),
        getArtifacts(id),
        getEvents(id).catch(() => [] as PipelineEvent[]),
      ]);
      setCurrentProject(projRes);
      setPipelineTasks(pipeRes || []);
      setGlossaryTerms(glossRes || []);
      setArtifacts(artifactRes || []);
      setPipelineEvents(eventsRes || []);
    } catch {
      Message.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id, setCurrentProject, setPipelineTasks, setGlossaryTerms, setArtifacts, setPipelineEvents]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Intersection observer for active TOC section ──
  useEffect(() => {
    if (loading) return;

    const sectionIds: string[] = ['section-plan', 'section-clarify', 'section-translate', 'section-output', 'section-chat'];
    const sectionMap: string[] = ['plan', 'clarify', 'translate', 'output', 'chat'];
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      let activeIdx = 0;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const sId = sectionIds[i];
        if (!sId) continue;
        const el = document.getElementById(sId);
        if (el && el.offsetTop <= scrollY) {
          activeIdx = i;
          break;
        }
      }
      const resolved = sectionMap[activeIdx] ?? 'plan';
      setActiveSection(resolved);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // ── Action handlers ──
  const handleStart = async () => {
    if (!id) return;
    try {
      await startPipeline(id);
      Message.success('Pipeline started');
      fetchAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start';
      Message.error(msg);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    await confirmGlossary(id);
    Message.success('Glossary confirmed');
    fetchAll();
  };

  const handleCancel = async () => {
    if (!id) return;
    await cancelPipeline(id);
    Message.success('Pipeline cancelled');
    fetchAll();
  };

  const handleRetry = async () => {
    if (!id) return;
    await retryPipeline(id);
    Message.success('Retrying failed stage');
    fetchAll();
  };

  // ── TOC navigation ──
  const handleTocNavigate = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveSection(sectionId);
    }
  };

  // ── Build stream items ──
  const streamItems = useMemo((): StreamItem[] => {
    if (!currentProject) return [];

    const items: StreamItem[] = [];

    // Hero is always first
    items.push({ type: 'hero' });

    // If project is in "created" state, show start prompt
    if (currentProject.status === 'created') {
      items.push({ type: 'start-prompt' });
      return items;
    }

    const taskMap = Object.fromEntries(pipelineTasks.map((t) => [t.stage, t]));

    // ── Plan stage ──
    const planTask = taskMap['plan'];
    if (planTask || pipelineTasks.length > 0) {
      items.push({ type: 'divider', label: 'Plan', sectionId: 'section-plan' });

      if (planTask?.status === 'running') {
        items.push({ type: 'thinking', text: getThinkingText('plan') });
      }
      if (planTask?.status === 'completed') {
        items.push({ type: 'stage-complete', text: getStageCompleteText('plan', planTask.result) });
      }
      if (planTask?.status === 'failed') {
        items.push({ type: 'stage-failed', text: planTask.error_message || 'Plan stage failed' });
      }
    }

    // ── Clarify stage ──
    const clarifyTask = taskMap['clarify'];
    if (clarifyTask || glossaryTerms.length > 0) {
      items.push({ type: 'divider', label: 'Clarify', sectionId: 'section-clarify' });

      if (clarifyTask?.status === 'running') {
        items.push({ type: 'thinking', text: getThinkingText('clarify') });
      }

      // Term cards
      if (glossaryTerms.length > 0) {
        glossaryTerms.forEach((term) => {
          items.push({ type: 'term', data: term });
        });

        // Confirm action if in clarifying state
        if (currentProject.status === 'clarifying') {
          items.push({ type: 'confirm-action', count: glossaryTerms.length });
        }
      }

      if (clarifyTask?.status === 'completed') {
        items.push({ type: 'stage-complete', text: getStageCompleteText('clarify', clarifyTask.result) });
      }
      if (clarifyTask?.status === 'failed') {
        items.push({ type: 'stage-failed', text: clarifyTask.error_message || 'Clarify stage failed' });
      }
    }

    // ── Translate stage ──
    const translateTask = taskMap['translate'];
    const chunkEvents = pipelineEvents.filter(
      (e) => e.event_type === 'chunk_translated' && e.stage === 'translate'
    );
    if (translateTask || chunkEvents.length > 0) {
      items.push({ type: 'divider', label: 'Translate', sectionId: 'section-translate' });

      // Show completed chunks
      chunkEvents.forEach((event) => {
        items.push({ type: 'chunk', data: event });
      });

      // If still translating, show thinking
      if (translateTask?.status === 'running') {
        const chunkCount = chunkEvents.length + 1;
        const totalChunks = (taskMap['plan']?.result?.chunks_count as number) ||
                            (taskMap['plan']?.result?.chunk_count as number) || '?';
        items.push({ type: 'thinking', text: `Translating chunk ${chunkCount} of ${totalChunks}...` });
      }

      if (translateTask?.status === 'completed') {
        items.push({ type: 'stage-complete', text: getStageCompleteText('translate', translateTask.result) });
      }
      if (translateTask?.status === 'failed') {
        items.push({ type: 'stage-failed', text: translateTask.error_message || 'Translate stage failed' });
      }
    }

    // ── Output stage ──
    const unifyTask = taskMap['unify'];
    if (unifyTask || artifacts.length > 0) {
      items.push({ type: 'divider', label: 'Output', sectionId: 'section-output' });

      if (unifyTask?.status === 'running') {
        items.push({ type: 'thinking', text: getThinkingText('unify') });
      }

      if (artifacts.length > 0) {
        items.push({ type: 'artifact', artifacts });
      }

      if (unifyTask?.status === 'completed') {
        items.push({ type: 'stage-complete', text: 'Output assembled' });
      }
      if (unifyTask?.status === 'failed') {
        items.push({ type: 'stage-failed', text: unifyTask.error_message || 'Output stage failed' });
      }
    }

    // ── Chat section (only when completed) ──
    if (currentProject.status === 'completed') {
      items.push({ type: 'divider', label: 'Chat', sectionId: 'section-chat' });
      items.push({ type: 'chat' });
    }

    return items;
  }, [currentProject, pipelineTasks, glossaryTerms, artifacts, pipelineEvents]);

  // ── TOC sections (derived from stream items) ──
  const tocSections = useMemo(() => {
    const dividers = streamItems.filter(
      (item): item is Extract<StreamItem, { type: 'divider' }> => item.type === 'divider'
    );
    return [
      { id: 'plan', label: 'Plan', visible: dividers.some((d) => d.label === 'Plan') },
      { id: 'clarify', label: 'Clarify', visible: dividers.some((d) => d.label === 'Clarify') },
      { id: 'translate', label: 'Translate', visible: dividers.some((d) => d.label === 'Translate') },
      { id: 'output', label: 'Output', visible: dividers.some((d) => d.label === 'Output') },
      { id: 'chat', label: 'Chat', visible: dividers.some((d) => d.label === 'Chat') },
    ];
  }, [streamItems]);

  // ── Loading skeleton ──
  if (loading || !currentProject) {
    return (
      <div className="pipeline-stream">
        <div className="pipeline-stream__skeleton">
          <div className="pipeline-stream__skeleton-hero" />
          <div className="pipeline-stream__skeleton-divider" />
          <div className="pipeline-stream__skeleton-card" />
          <div className="pipeline-stream__skeleton-card" />
          <div className="pipeline-stream__skeleton-card" />
        </div>
      </div>
    );
  }

  // ── Render individual stream items ──
  const renderStreamItem = (item: StreamItem, index: number) => {
    const delay = Math.min(index * 0.05, 0.6);
    const style = { animationDelay: `${delay}s` };

    switch (item.type) {
      case 'hero':
        return (
          <div key="hero" className="stream-card card-enter hero-card" style={style}>
            <div className="hero-card__label">Translation Pipeline</div>
            <h1 className="hero-card__title">{currentProject.title}</h1>
            <div className="hero-card__subtitle">
              {currentProject.source_language || 'Auto'}
              <span className="hero-card__arrow">&rarr;</span>
              {currentProject.target_language}
            </div>
            <div className="hero-card__meta">
              <span className="hero-card__meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                {currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1)}
              </span>
              {/* Cancel / Retry buttons inline */}
              {!['completed', 'failed', 'cancelled', 'created'].includes(currentProject.status) && (
                <button className="hero-card__action hero-card__action--danger" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              {currentProject.status === 'failed' && (
                <button className="hero-card__action hero-card__action--outline" onClick={handleRetry}>
                  Retry
                </button>
              )}
            </div>
          </div>
        );

      case 'start-prompt':
        return (
          <div key="start-prompt" className="stream-card card-enter confirm-card" style={style}>
            <span className="confirm-card__text">Pipeline is ready to start</span>
            <button className="confirm-card__btn" onClick={handleStart}>
              Start Translation
            </button>
          </div>
        );

      case 'divider':
        return (
          <div key={`divider-${item.sectionId}`} id={item.sectionId} className="stage-divider card-enter" style={style}>
            <span className="stage-divider__label">{item.label}</span>
          </div>
        );

      case 'thinking':
        return (
          <div key={`thinking-${index}`} className="thinking-card card-enter" style={style}>
            <div className="thinking-card__dots">
              <span />
              <span />
              <span />
            </div>
            <span className="thinking-card__text">{item.text}</span>
          </div>
        );

      case 'stage-complete':
        return (
          <div key={`complete-${index}`} className="stage-complete card-enter" style={style}>
            <div className="stage-complete__icon">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="stage-complete__text">{item.text}</span>
          </div>
        );

      case 'stage-failed':
        return (
          <div key={`failed-${index}`} className="stage-failed card-enter" style={style}>
            <div className="stage-failed__icon">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <span className="stage-failed__text">{item.text}</span>
          </div>
        );

      case 'term':
        return <TermCard key={`term-${item.data.id}`} term={item.data} style={style} />;

      case 'confirm-action':
        return (
          <div key="confirm-action" className="stream-card card-enter confirm-card" style={style}>
            <span className="confirm-card__text">{item.count} terms need your review</span>
            <button className="confirm-card__btn" onClick={handleConfirm}>
              Confirm &amp; Continue
            </button>
          </div>
        );

      case 'chunk':
        return <ChunkCard key={`chunk-${item.data.id || item.data.sequence}`} event={item.data} style={style} />;

      case 'artifact':
        return (
          <div key="artifacts" className="stream-card card-enter" style={style}>
            <ArtifactList projectId={id!} artifacts={item.artifacts} />
          </div>
        );

      case 'chat':
        return (
          <div key="chat" className="stream-card card-enter" style={style}>
            <ChatPanel projectId={id!} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="pipeline-stream" ref={streamRef}>
        {/* Back link */}
        <button className="pipeline-stream__back" onClick={() => navigate('/projects')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Projects
        </button>

        {/* Stream items */}
        {streamItems.map((item, index) => renderStreamItem(item, index))}
      </div>

      {/* Floating TOC */}
      <FloatingTOC
        sections={tocSections}
        activeSection={activeSection}
        onNavigate={handleTocNavigate}
      />
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────

function TermCard({ term, style }: { term: GlossaryTerm; style: React.CSSProperties }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div
      className={`stream-card card-enter term-card term-card--${confidenceClass(term.confidence)}`}
      style={{ ...style, borderLeftColor: confidenceColor(term.confidence) }}
    >
      <div className="term-card__row">
        <div className="term-card__pair">
          <span className="term-card__source">{term.source_term}</span>
          <span className="term-card__arrow">&rarr;</span>
          <span className="term-card__target">{term.translated_term}</span>
        </div>
        <span className="term-card__edit">Edit</span>
      </div>
      <div className="term-card__meta">
        <span
          className={`term-card__confidence-dot term-card__confidence-dot--${confidenceClass(term.confidence)}`}
        />
        <span className="term-card__confidence-label">
          {Math.round(term.confidence * 100)}% confidence
        </span>
      </div>
      {term.context && (
        <div className="term-card__context">&ldquo;{term.context}&rdquo;</div>
      )}
      {term.confidence < 0.5 && (
        <>
          <button
            className="term-card__search-toggle"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {showSearch ? 'Hide context' : 'Web search context'}
          </button>
          {showSearch && (
            <div className="term-card__search-context">
              No web search results available yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChunkCard({ event, style }: { event: PipelineEvent; style: React.CSSProperties }) {
  const data = event.data || {};
  const source = String(data.source || data.content || '');
  const translated = String(data.translated || data.translation || '');
  const chunkIndex = data.index != null ? Number(data.index) + 1 : data.chunk_index != null ? Number(data.chunk_index) + 1 : '?';

  return (
    <div className="stream-card card-enter chunk-card" style={style}>
      <div className="chunk-card__header">
        <span className="chunk-card__badge">Chunk {chunkIndex}</span>
        <span className="chunk-card__status">Completed</span>
      </div>
      <div className="chunk-card__columns">
        <div className="chunk-card__source">{source}</div>
        <div className="chunk-card__target">{translated}</div>
      </div>
    </div>
  );
}
