import { Button, Card, Message, Space, Tabs, Typography } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
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
      setCurrentProject(projRes.data.data);
      setPipelineTasks(pipeRes.data.data || []);
      setGlossaryTerms(glossRes.data.data || []);
      setArtifacts(artifactRes.data.data || []);
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start';
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

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title heading={4}>{currentProject.title}</Typography.Title>
          <Typography.Text type="secondary">
            {currentProject.source_language || 'auto'} → {currentProject.target_language}
          </Typography.Text>
        </div>
        <Space>
          {currentProject.status === 'created' && (
            <Button type="primary" onClick={handleStart}>Start Translation</Button>
          )}
          {currentProject.status === 'clarifying' && (
            <Button type="primary" onClick={handleConfirm}>Confirm Terms & Continue</Button>
          )}
          {currentProject.status === 'failed' && (
            <Button onClick={handleRetry}>Retry</Button>
          )}
          {!['completed', 'failed', 'cancelled', 'created'].includes(currentProject.status) && (
            <Button status="danger" onClick={handleCancel}>Cancel</Button>
          )}
        </Space>
      </Space>

      <Tabs defaultActiveTab="pipeline">
        <Tabs.TabPane key="pipeline" title="Pipeline">
          <PipelineProgress tasks={pipelineTasks} projectStatus={currentProject.status} />
        </Tabs.TabPane>

        <Tabs.TabPane key="glossary" title={`Glossary (${glossaryTerms.length})`}>
          <GlossaryEditor
            projectId={id!}
            terms={glossaryTerms}
            editable={currentProject.status === 'clarifying'}
            onRefresh={fetchAll}
          />
        </Tabs.TabPane>

        <Tabs.TabPane key="artifacts" title="Output">
          <ArtifactList projectId={id!} artifacts={artifacts} />
        </Tabs.TabPane>

        <Tabs.TabPane key="chat" title="Chat" disabled={currentProject.status !== 'completed'}>
          <ChatPanel projectId={id!} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
