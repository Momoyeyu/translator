import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
} from '../../api/project';
import { getEvents, type PipelineEvent } from '../../api/events';
import { useProjectStore } from '../../stores/projectStore';
import { useProjectWebSocket } from '../../hooks/useProjectWebSocket';
import { getAccessToken } from '../../utils/token';
import GlossaryEditor from '../../components/project/GlossaryEditor';
import ArtifactList from '../../components/project/ArtifactList';
import ChatPanel from '../../components/project/ChatPanel';
import EventCard from '../../components/project/EventCard';
import './ProjectDetailPage.less';

type SectionId = 'plan' | 'terms' | 'translate' | 'output' | 'chat';

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'terms', label: 'Terms' },
  { id: 'translate', label: 'Translate' },
  { id: 'output', label: 'Output' },
  { id: 'chat', label: 'Chat' },
];

/** Group events by which section they belong to */
function categorizeEvent(e: PipelineEvent): SectionId {
  const stage = e.stage?.toLowerCase() || '';
  const type = e.event_type;

  // Artifact events always go to output
  if (type === 'artifact_created') return 'output';

  // Chat events
  if (type === 'chat_message') return 'chat';

  // Term-related events belong to terms section
  if (type === 'term_extracted' || type === 'clarify_request' || stage === 'clarify') return 'terms';

  // Translation chunks belong to translate section
  if (type === 'chunk_translated' || type === 'chunk_planned' || stage === 'translate') return 'translate';

  // Unify stage -> output
  if (stage === 'unify') return 'output';

  // Everything else (plan stage, pipeline lifecycle) -> plan
  return 'plan';
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
  const [activeSection, setActiveSection] = useState<SectionId>('plan');
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useProjectWebSocket(id, token ?? undefined);

  // ── Fetch all project data + events on mount ──
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

  // ── Auto-scroll when new events arrive ──
  useEffect(() => {
    if (!userScrolledUp && contentRef.current) {
      contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [pipelineEvents.length, userScrolledUp]);

  // ── Detect user scroll direction ──
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setUserScrolledUp(!isAtBottom);
  }, []);

  // ── Intersection Observer for active section detection ──
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll('.pipeline-view__section');
    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]); // Re-observe when loading completes

  // ── Nav anchor click ──
  const handleNavClick = (sectionId: SectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

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

  // ── Group events by section ──
  const planEvents = pipelineEvents.filter((e) => categorizeEvent(e) === 'plan');
  const termsEvents = pipelineEvents.filter((e) => categorizeEvent(e) === 'terms');
  const translateEvents = pipelineEvents.filter((e) => categorizeEvent(e) === 'translate');
  const outputEvents = pipelineEvents.filter((e) => categorizeEvent(e) === 'output');

  // Determine which sections are visible
  const showTerms = termsEvents.length > 0 || glossaryTerms.length > 0 ||
    (currentProject != null && ['clarifying', 'translating', 'completed', 'failed'].includes(currentProject.status));
  const showTranslate = translateEvents.length > 0 ||
    (currentProject != null && ['translating', 'completed', 'failed'].includes(currentProject.status));
  const showOutput = outputEvents.length > 0 || artifacts.length > 0 ||
    (currentProject != null && currentProject.status === 'completed');
  const showChat = currentProject != null && currentProject.status === 'completed';

  // ── Loading skeleton ──
  if (loading || !currentProject) {
    return (
      <div className="pipeline-view">
        <nav className="pipeline-view__nav">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className="pipeline-view__nav-item pipeline-view__nav-item--skeleton">
              <span className="pipeline-view__skeleton-text">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="pipeline-view__content">
          <div className="pipeline-view__hero">
            <div className="pipeline-view__skeleton-block pipeline-view__skeleton-block--title" />
            <div className="pipeline-view__skeleton-block pipeline-view__skeleton-block--subtitle" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="pipeline-view__skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-view">
      {/* Fixed anchor nav */}
      <nav className="pipeline-view__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`pipeline-view__nav-item${activeSection === item.id ? ' pipeline-view__nav-item--active' : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Scrollable content */}
      <div className="pipeline-view__content" ref={contentRef} onScroll={handleScroll}>
        {/* Back Link */}
        <button className="pipeline-view__back" onClick={() => navigate('/projects')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Projects
        </button>

        {/* Hero */}
        <div className="pipeline-view__hero">
          <div>
            <h1 className="pipeline-view__hero-title">{currentProject.title}</h1>
            <div className="pipeline-view__hero-lang">
              {currentProject.source_language || 'Auto'} &rarr; {currentProject.target_language}
            </div>
          </div>
          <div className="pipeline-view__hero-actions">
            {currentProject.status === 'created' && (
              <button className="pipeline-view__btn-primary" onClick={handleStart}>
                Start Translation
              </button>
            )}
            {currentProject.status === 'clarifying' && (
              <button className="pipeline-view__btn-primary" onClick={handleConfirm}>
                Confirm Terms &amp; Continue
              </button>
            )}
            {currentProject.status === 'failed' && (
              <button className="pipeline-view__btn-outline" onClick={handleRetry}>
                Retry
              </button>
            )}
            {!['completed', 'failed', 'cancelled', 'created'].includes(currentProject.status) && (
              <button className="pipeline-view__btn-danger" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Plan Section */}
        <section id="plan" className="pipeline-view__section">
          <h2 className="pipeline-view__section-title">Plan</h2>
          {planEvents.length === 0 && pipelineTasks.length === 0 && (
            <div className="pipeline-view__empty">
              {currentProject.status === 'created'
                ? 'Pipeline has not started yet. Click "Start Translation" to begin.'
                : 'No plan events yet.'}
            </div>
          )}
          {planEvents.map((event) => (
            <EventCard key={event.id || event.sequence} event={event} />
          ))}
        </section>

        {/* Terms Section */}
        {showTerms && (
          <section id="terms" className="pipeline-view__section">
            <h2 className="pipeline-view__section-title">Terms</h2>
            {termsEvents.map((event) => (
              <EventCard key={event.id || event.sequence} event={event} />
            ))}
            {glossaryTerms.length > 0 && (
              <div className="pipeline-view__subsection">
                <GlossaryEditor
                  projectId={id!}
                  terms={glossaryTerms}
                  editable={currentProject.status === 'clarifying'}
                  onRefresh={fetchAll}
                />
              </div>
            )}
            {currentProject.status === 'clarifying' && (
              <div className="pipeline-view__confirm-section">
                <button className="pipeline-view__btn-confirm" onClick={handleConfirm}>
                  Confirm Terms &amp; Continue
                </button>
              </div>
            )}
          </section>
        )}

        {/* Translate Section */}
        {showTranslate && (
          <section id="translate" className="pipeline-view__section">
            <h2 className="pipeline-view__section-title">Translation</h2>
            {translateEvents.length === 0 && (
              <div className="pipeline-view__empty">Waiting for translation to begin...</div>
            )}
            {translateEvents.map((event) => (
              <EventCard key={event.id || event.sequence} event={event} />
            ))}
          </section>
        )}

        {/* Output Section */}
        {showOutput && (
          <section id="output" className="pipeline-view__section">
            <h2 className="pipeline-view__section-title">Output</h2>
            {outputEvents.map((event) => (
              <EventCard key={event.id || event.sequence} event={event} />
            ))}
            {artifacts.length > 0 && (
              <div className="pipeline-view__subsection">
                <ArtifactList
                  projectId={id!}
                  artifacts={artifacts}
                />
              </div>
            )}
          </section>
        )}

        {/* Chat Section */}
        {showChat && (
          <section id="chat" className="pipeline-view__section">
            <h2 className="pipeline-view__section-title">Chat</h2>
            <ChatPanel projectId={id!} />
          </section>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {userScrolledUp && pipelineEvents.length > 0 && (
        <button
          className="pipeline-view__scroll-indicator"
          onClick={() => {
            contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
            setUserScrolledUp(false);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          New events below
        </button>
      )}
    </div>
  );
}
