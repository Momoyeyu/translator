import { useCallback, useEffect, useRef } from 'react';
import { useProjectStore } from '../stores/projectStore';

interface WSEvent {
  seq: number;
  event: string;
  data: Record<string, unknown>;
}

export function useProjectWebSocket(projectId: string | undefined, token: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSeqRef = useRef(0);

  const { updateProjectStatus, updatePipelineTask, addChatMessage, setArtifacts } =
    useProjectStore();

  const handleEvent = useCallback(
    (event: WSEvent) => {
      if (event.seq > lastSeqRef.current) {
        lastSeqRef.current = event.seq;
      }

      switch (event.event) {
        case 'pipeline_stage_started':
          updatePipelineTask(event.data.stage as string, { status: 'running' });
          break;
        case 'pipeline_progress':
          // Progress updates for translate stage
          break;
        case 'pipeline_stage_completed':
          updatePipelineTask(event.data.stage as string, { status: 'completed' });
          break;
        case 'clarify_request':
          updateProjectStatus('clarifying');
          break;
        case 'pipeline_completed':
          updateProjectStatus('completed');
          break;
        case 'pipeline_failed':
          updateProjectStatus('failed');
          break;
        case 'pipeline_cancelled':
          updateProjectStatus('cancelled');
          break;
        case 'chat_message':
          addChatMessage({
            id: event.data.message_id as string,
            role: 'assistant',
            type: 'reply',
            content: event.data.content as string,
            detail: null,
            created_at: new Date().toISOString(),
          });
          break;
      }
    },
    [updateProjectStatus, updatePipelineTask, addChatMessage, setArtifacts]
  );

  const connect = useCallback(() => {
    if (!projectId || !token) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/project/${projectId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        handleEvent(event);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // Reconnect with exponential backoff
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    wsRef.current = ws;
  }, [projectId, token, handleEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
}
