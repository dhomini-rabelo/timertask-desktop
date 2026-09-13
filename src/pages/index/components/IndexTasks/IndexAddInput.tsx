import { useState } from "react";
import { Button } from "../../../../layout/components/atoms/Button";
import { Input } from "../../../../layout/components/atoms/Input";
import { useStoredSettings } from "../../hooks/useStoredSettings";
import { useProjectsState } from "../../states/projects";
import { useTasksState } from "../../states/tasks";

export function IndexAddInput() {
  const [title, setTitle] = useState("");
  const addTask = useTasksState((props) => props.actions.addTask);
  const addGroup = useTasksState((props) => props.actions.addGroup);
  const projects = useProjectsState((props) => props.state.projects);
  const selectedProjectId = useProjectsState(
    (props) => props.state.selectedProjectId,
  );
  const { projectsEnabled } = useStoredSettings();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAdd();
    }
  }

  function handleAdd() {
    const trimmedStart = title.trimStart();

    if (trimmedStart.startsWith(">")) {
      const groupTitle = trimmedStart.slice(1).trimStart();
      if (!groupTitle.trim()) {
        return;
      }
      addGroup(groupTitle);
      setTitle("");
      return;
    }

    if (title.trim()) {
      const selectedProject = projectsEnabled
        ? projects.find((project) => project.id === selectedProjectId)
        : undefined;
      const composedTitle = selectedProject
        ? `[${selectedProject.title}] ${title}`
        : title;
      addTask(composedTitle, null);
      setTitle("");
    }
  }

  return (
    <div className="flex gap-3">
      <Input
        placeholder="Add a task... (use > to create a group)"
        value={title}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1"
      />
      <Button onClick={handleAdd} className="w-auto px-6 py-2">
        Add
      </Button>
    </div>
  );
}
