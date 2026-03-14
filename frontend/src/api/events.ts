import client from './client';

export interface PipelineEvent {
  id: string;
  stage: string;
  event_type: string;
  sequence: number;
  data: Record<string, unknown> | null;
  created_at: string;
}

export const getEvents = (projectId: string, after: number = 0, limit: number = 500) =>
  client.get(`/projects/${projectId}/events`, { params: { after, limit } }) as Promise<PipelineEvent[]>;
