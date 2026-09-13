import { Settings } from "lucide-react";
import { useState } from "react";
import { useStoredProjects } from "../../../hooks/useStoredProjects";
import { useStoredSettings } from "../../../hooks/useStoredSettings";
import { useProjectsState } from "../../../states/projects";
import { useWorkflowsState } from "../../../states/workflows";
import { IndexProjectsDialog } from "./IndexProjectsDialog";

export function IndexProjectChips() {
  const { projectsEnabled } = useStoredSettings();
  const projects = useStoredProjects();
  const selectedWorkflowId = useWorkflowsState(
    (props) => props.state.selectedWorkflowId,
  );
  const selectedProjectId = useProjectsState(
    (props) => props.state.selectedProjectId,
  );
  const selectProject = useProjectsState(
    (props) => props.actions.selectProject,
  );
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);

  if (!projectsEnabled) {
    return null;
  }

  const workflowProjects = projects.filter(
    (project) => project.workflowId === selectedWorkflowId,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {workflowProjects.map((project) => {
        const isSelected = selectedProjectId === project.id;

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => selectProject(project.id)}
            className={
              isSelected
                ? "px-3 py-1.5 rounded-full text-sm font-medium bg-Green-500 text-White transition-colors"
                : "px-3 py-1.5 rounded-full text-sm font-medium bg-White border border-Black-100 text-Black-700 transition-colors hover:bg-Black-100 dark:bg-Black-700 dark:border-Black-500 dark:text-White dark:hover:bg-Black-600"
            }
          >
            {project.title}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setIsProjectsDialogOpen(true)}
        className="flex items-center justify-center p-1.5 rounded-full border border-Black-100 bg-White text-Black-700 transition-colors hover:bg-Black-100 dark:bg-Black-700 dark:border-Black-500 dark:text-White dark:hover:bg-Black-600"
      >
        <Settings className="h-4 w-4" />
      </button>
      <IndexProjectsDialog
        isOpen={isProjectsDialogOpen}
        onOpenChange={setIsProjectsDialogOpen}
      />
    </div>
  );
}
