import { create } from 'zustand';
import type { Artifact, ChatMessage, GlossaryTerm, PipelineTask, Project } from '../api/project';
import type { PipelineEvent } from '../api/events';

interface ProjectState {
  // Project list
  projects: Project[];
  loading: boolean;

  // Current project detail
  currentProject: Project | null;
  pipelineTasks: PipelineTask[];
  glossaryTerms: GlossaryTerm[];
  artifacts: Artifact[];
  chatMessages: ChatMessage[];

  // Pipeline events (vertical scroll view)
  pipelineEvents: PipelineEvent[];

  // Actions
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setPipelineTasks: (tasks: PipelineTask[]) => void;
  setGlossaryTerms: (terms: GlossaryTerm[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateProjectStatus: (status: string) => void;
  updatePipelineTask: (stage: string, updates: Partial<PipelineTask>) => void;
  setPipelineEvents: (events: PipelineEvent[]) => void;
  addPipelineEvent: (event: PipelineEvent) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  loading: false,
  currentProject: null,
  pipelineTasks: [],
  glossaryTerms: [],
  artifacts: [],
  chatMessages: [],
  pipelineEvents: [],
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setPipelineTasks: (tasks) => set({ pipelineTasks: tasks }),
  setGlossaryTerms: (terms) => set({ glossaryTerms: terms }),
  setArtifacts: (artifacts) => set({ artifacts }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  updateProjectStatus: (status) =>
    set((state) => ({
      currentProject: state.currentProject
        ? { ...state.currentProject, status }
        : null,
    })),
  updatePipelineTask: (stage, updates) =>
    set((state) => ({
      pipelineTasks: state.pipelineTasks.map((t) =>
        t.stage === stage ? { ...t, ...updates } : t
      ),
    })),
  setPipelineEvents: (events) => set({ pipelineEvents: events }),
  addPipelineEvent: (event) =>
    set((state) => {
      // Avoid duplicates by sequence number
      if (state.pipelineEvents.some((e) => e.sequence === event.sequence)) {
        return state;
      }
      return { pipelineEvents: [...state.pipelineEvents, event] };
    }),
  reset: () => set(initialState),
}));
