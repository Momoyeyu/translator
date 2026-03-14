import client from './client';

export interface Project {
  id: string;
  title: string;
  source_language: string | null;
  target_language: string;
  status: string;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineTask {
  id: string;
  stage: string;
  status: string;
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface GlossaryTerm {
  id: string;
  source_term: string;
  translated_term: string;
  confirmed: boolean;
  context: string | null;
}

export interface Artifact {
  id: string;
  title: string;
  format: string;
  file_size: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  type: string;
  content: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// Project CRUD
export const createProject = (formData: FormData) =>
  client.post('/projects', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<Project>;

export const listProjects = (page = 1, pageSize = 20) =>
  client.get('/projects', { params: { page, page_size: pageSize } }) as Promise<Project[]>;

export const getProject = (id: string) =>
  client.get(`/projects/${id}`) as Promise<Project>;

export const updateProject = (id: string, data: { title?: string; config?: Record<string, unknown> }) =>
  client.patch(`/projects/${id}`, data) as Promise<Project>;

export const deleteProject = (id: string) =>
  client.delete(`/projects/${id}`) as Promise<void>;

// Pipeline
export const startPipeline = (projectId: string) =>
  client.post(`/projects/${projectId}/start`) as Promise<void>;

export const getPipeline = (projectId: string) =>
  client.get(`/projects/${projectId}/pipeline`) as Promise<PipelineTask[]>;

export const confirmGlossary = (projectId: string) =>
  client.post(`/projects/${projectId}/clarify/confirm`) as Promise<void>;

export const cancelPipeline = (projectId: string) =>
  client.post(`/projects/${projectId}/cancel`) as Promise<void>;

export const retryPipeline = (projectId: string) =>
  client.post(`/projects/${projectId}/retry`) as Promise<void>;

// Glossary
export const getGlossary = (projectId: string) =>
  client.get(`/projects/${projectId}/glossary`) as Promise<GlossaryTerm[]>;

export const updateTerm = (projectId: string, termId: string, translatedTerm: string) =>
  client.put(`/projects/${projectId}/glossary/${termId}`, { translated_term: translatedTerm }) as Promise<GlossaryTerm>;

// Artifacts
export const getArtifacts = (projectId: string) =>
  client.get(`/projects/${projectId}/artifacts`) as Promise<Artifact[]>;

export const downloadArtifact = (projectId: string, artifactId: string) =>
  client.get(`/projects/${projectId}/artifacts/${artifactId}/download`, { responseType: 'blob' }) as Promise<Blob>;

export const exportPdf = (projectId: string, artifactId: string) =>
  client.post(`/projects/${projectId}/artifacts/${artifactId}/export-pdf`) as Promise<Artifact>;

// Chat
export const sendChatMessage = (projectId: string, content: string) =>
  client.post(`/projects/${projectId}/chat`, { content }) as Promise<ChatMessage>;

export const getChatHistory = (projectId: string, cursor?: string, limit = 50) =>
  client.get(`/projects/${projectId}/chat/history`, { params: { cursor, limit } }) as Promise<ChatMessage[]>;
