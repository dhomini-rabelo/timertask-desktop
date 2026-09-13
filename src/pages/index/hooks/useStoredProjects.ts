import { useEffect, useRef } from "react";
import { useProjectsState, type Project } from "../states/projects";

const localStorageKey = "timertasks:projects";

export function useStoredProjects() {
  const projects = useProjectsState((props) => props.state.projects);
  const setProjectsState = useProjectsState(
    (props) => props.actions.setProjectsState,
  );
  const hasHydratedRef = useRef<boolean>(false);
  const projectsRef = useRef<Project[]>(projects);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedProjects = localStorage.getItem(localStorageKey);
    if (!storedProjects) {
      setProjectsState([]);
      hasHydratedRef.current = true;
      return;
    }

    try {
      const parsedProjects = JSON.parse(storedProjects) as Project[];
      const normalizedProjects = parsedProjects.filter(
        (project) =>
          project && project.id && project.workflowId && project.title,
      );

      setProjectsState(normalizedProjects);
      hasHydratedRef.current = true;
    } catch {
      setProjectsState([]);
      hasHydratedRef.current = true;
    }
  }, [setProjectsState]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(localStorageKey, JSON.stringify(projectsRef.current));
  }, [hasHydratedRef, projects]);

  return projects;
}
