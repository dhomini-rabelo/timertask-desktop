import { create } from "zustand";
import { useWorkflowsState } from "../workflows";

export interface Project {
  id: string;
  workflowId: string;
  title: string;
}

export interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
}

interface ProjectsActions {
  setProjectsState: (projects: Project[]) => void;
  addProject: (title: string) => void;
  editProject: (projectId: string, title: string) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string) => void;
}

interface ProjectsStore {
  state: ProjectsState;
  actions: ProjectsActions;
}

export const useProjectsState = create<ProjectsStore>((set, get) => {
  function setState(partial: Partial<ProjectsState>) {
    set((store) => ({
      state: {
        projects: partial.projects ?? store.state.projects,
        selectedProjectId:
          partial.selectedProjectId !== undefined
            ? partial.selectedProjectId
            : store.state.selectedProjectId,
      },
      actions: store.actions,
    }));
  }

  function setProjectsState(projects: Project[]) {
    setState({
      projects: projects,
    });
  }

  function addProject(title: string) {
    const workflowId = useWorkflowsState.getState().state.selectedWorkflowId;
    if (!workflowId) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const projects = get().state.projects;
    const hasDuplicate = projects.some(
      (project) =>
        project.workflowId === workflowId && project.title === trimmedTitle,
    );
    if (hasDuplicate) {
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      workflowId,
      title: trimmedTitle,
    };

    setState({
      projects: [...projects, newProject],
    });
  }

  function editProject(projectId: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const projects = get().state.projects;
    const project = projects.find((project) => project.id === projectId);
    if (!project) {
      return;
    }

    const hasDuplicate = projects.some(
      (otherProject) =>
        otherProject.id !== projectId &&
        otherProject.workflowId === project.workflowId &&
        otherProject.title === trimmedTitle,
    );
    if (hasDuplicate) {
      return;
    }

    setState({
      projects: projects.map((project) =>
        project.id === projectId
          ? { ...project, title: trimmedTitle }
          : project,
      ),
    });
  }

  function deleteProject(projectId: string) {
    const projects = get().state.projects;
    const filteredProjects = projects.filter(
      (project) => project.id !== projectId,
    );

    const selectedProjectId = get().state.selectedProjectId;
    const nextSelectedProjectId =
      selectedProjectId === projectId ? null : selectedProjectId;

    setState({
      projects: filteredProjects,
      selectedProjectId: nextSelectedProjectId,
    });
  }

  function selectProject(projectId: string) {
    const selectedProjectId = get().state.selectedProjectId;
    setState({
      selectedProjectId: selectedProjectId === projectId ? null : projectId,
    });
  }

  return {
    state: {
      projects: [],
      selectedProjectId: null,
    },
    actions: {
      setProjectsState,
      addProject,
      editProject,
      deleteProject,
      selectProject,
    },
  };
});
