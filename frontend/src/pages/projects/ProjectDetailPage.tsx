import { Card, Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
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
import { useProjectStore } from '../../stores/projectStore';
import { useProjectWebSocket } from '../../hooks/useProjectWebSocket';
import { getAccessToken } from '../../utils/token';
import PipelineProgress from '../../components/project/PipelineProgress';
import GlossaryEditor from '../../components/project/GlossaryEditor';
import ArtifactList from '../../components/project/ArtifactList';
import ChatPanel from '../../components/project/ChatPanel';
import './ProjectDetailPage.less';

type TabKey = 'pipeline' | 'glossary' | 'artifacts' | 'chat';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = getAccessToken();
  const {
    currentProject,
    pipelineTasks,
    glossaryTerms,
    artifacts,
    setCurrentProject,
    setPipelineTasks,
    setGlossaryTerms,
    setArtifacts,
  } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('pipeline');

  useProjectWebSocket(id, token ?? undefined);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, pipeRes, glossRes, artifactRes] = await Promise.all([
        getProject(id),
        getPipeline(id),
        getGlossary(id),
        getArtifacts(id),
      ]);
      setCurrentProject(projRes);
      setPipelineTasks(pipeRes || []);
      setGlossaryTerms(glossRes || []);
      setArtifacts(artifactRes || []);
    } catch {
      Message.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

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

  if (loading || !currentProject) {
    return <Card loading style={{ margin: 24 }} />;
  }

  const isChatDisabled = currentProject.status !== 'completed';

  return (
    <div className="project-detail">
      {/* Back Link */}
      <button className="project-detail__back" onClick={() => navigate('/projects')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Projects
      </button>

      {/* Hero Section */}
      <div className="project-detail__hero">
        <div>
          <h1 className="project-detail__hero-title">{currentProject.title}</h1>
          <div className="project-detail__hero-lang">
            {currentProject.source_language || 'Auto'} &rarr; {currentProject.target_language}
          </div>
        </div>
        <div className="project-detail__hero-actions">
          {currentProject.status === 'created' && (
            <button className="project-detail__btn-primary" onClick={handleStart}>
              Start Translation
            </button>
          )}
          {currentProject.status === 'clarifying' && (
            <button className="project-detail__btn-primary" onClick={handleConfirm}>
              Confirm Terms & Continue
            </button>
          )}
          {currentProject.status === 'failed' && (
            <button className="project-detail__btn-outline" onClick={handleRetry}>
              Retry
            </button>
          )}
          {!['completed', 'failed', 'cancelled', 'created'].includes(currentProject.status) && (
            <button className="project-detail__btn-danger" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="project-detail__tab-bar">
        <button
          className={`project-detail__tab-item${activeTab === 'pipeline' ? ' project-detail__tab-item--active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          Pipeline
        </button>
        <button
          className={`project-detail__tab-item${activeTab === 'glossary' ? ' project-detail__tab-item--active' : ''}`}
          onClick={() => setActiveTab('glossary')}
        >
          Terms <span className="project-detail__tab-count">({glossaryTerms.length})</span>
        </button>
        <button
          className={`project-detail__tab-item${activeTab === 'artifacts' ? ' project-detail__tab-item--active' : ''}`}
          onClick={() => setActiveTab('artifacts')}
        >
          Output
        </button>
        <button
          className={`project-detail__tab-item${activeTab === 'chat' ? ' project-detail__tab-item--active' : ''}${isChatDisabled ? ' project-detail__tab-item--disabled' : ''}`}
          onClick={() => !isChatDisabled && setActiveTab('chat')}
          disabled={isChatDisabled}
        >
          Chat
        </button>
      </div>

      {/* Tab Content */}
      <div className="project-detail__tab-content">
        {activeTab === 'pipeline' && (
          <>
            <PipelineProgress tasks={pipelineTasks} projectStatus={currentProject.status} />
            {currentProject.status === 'clarifying' && (
              <div className="project-detail__confirm-section">
                <button className="project-detail__btn-confirm" onClick={handleConfirm}>
                  Confirm Terms & Continue
                </button>
              </div>
            )}
          </>
        )}
        {activeTab === 'glossary' && (
          <GlossaryEditor
            projectId={id!}
            terms={glossaryTerms}
            editable={currentProject.status === 'clarifying'}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'artifacts' && (
          <ArtifactList
            projectId={id!}
            artifacts={artifacts}
            onArtifactCreated={(artifact) => setArtifacts([...artifacts, artifact])}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPanel projectId={id!} />
        )}
      </div>
    </div>
  );
}
