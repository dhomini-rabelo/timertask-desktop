import { useAtom } from "jotai";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "../../../../../../layout/components/atoms/Input";
import { useTasksState } from "../../../../states/tasks";
import { indexTasksPageStateAtom } from "../../shared-state";

interface IndexEditInputProps {
  initialValue: string;
}

export function IndexEditInput({ initialValue }: IndexEditInputProps) {
  const saveEditingTask = useTasksState(
    (props) => props.actions.saveEditingItem,
  );
  const [indexTasksPageState, setIndexTasksPageState] = useAtom(
    indexTasksPageStateAtom,
  );
  const [title, setTitle] = useState(initialValue);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
  }

  function handleCancel() {
    setIndexTasksPageState((prev) => ({
      ...prev,
      editingTaskId: null,
    }));
  }

  function handleSave() {
    if (indexTasksPageState.editingTaskId && title.trim()) {
      saveEditingTask(indexTasksPageState.editingTaskId, title);
      handleCancel();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        value={title}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 h-9"
        autoFocus
      />
      <button
        onClick={handleSave}
        className="p-2 text-Green-300 hover:text-Green-400 transition-colors"
      >
        <Check className="w-5 h-5" />
      </button>
      <button
        onClick={handleCancel}
        className="p-2 text-Red-400 hover:text-Red-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
