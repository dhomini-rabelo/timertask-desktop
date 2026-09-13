import { useState } from "react";
import { Button } from "../../../../../layout/components/atoms/Button";
import { Input } from "../../../../../layout/components/atoms/Input";
import { useProjectsState } from "../../../states/projects";

export function IndexProjectsFooter() {
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const projectActions = useProjectsState((props) => props.actions);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewProjectTitle(event.target.value);
  }

  function handleAdd() {
    if (newProjectTitle.trim()) {
      projectActions.addProject(newProjectTitle);
      setNewProjectTitle("");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleAdd();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={newProjectTitle}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="New project"
        className="h-9 text-xs"
      />
      <Button
        type="button"
        onClick={handleAdd}
        className="h-9 px-4 py-2 text-xs"
      >
        Add
      </Button>
    </div>
  );
}
