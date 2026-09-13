import { useStoredProjects } from "../../../hooks/useStoredProjects";
import { useWorkflowsState } from "../../../states/workflows";
import { IndexProjectsListItem } from "./IndexProjectsListItem";

export function IndexProjectsList() {
  const projects = useStoredProjects();
  const selectedWorkflowId = useWorkflowsState(
    (props) => props.state.selectedWorkflowId,
  );

  const workflowProjects = projects.filter(
    (project) => project.workflowId === selectedWorkflowId,
  );

  return (
    <>
      {workflowProjects.map((project) => (
        <IndexProjectsListItem
          key={project.id}
          projectId={project.id}
          projectTitle={project.title}
        />
      ))}
    </>
  );
}
