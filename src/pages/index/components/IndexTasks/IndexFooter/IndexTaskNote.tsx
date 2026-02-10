import { ChevronDown, ChevronUp, NotebookPen, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../../../layout/components/atoms/Button";
import { useTasksState } from "../../../states/tasks";
import { IndexTaskNoteDialog } from "../IndexActiveTasksList/IndexTaskNoteDialog";

function getHeaderLabel() {
  return "Notes";
}

interface IndexTaskNoteProps {
  taskId: string;
  className?: string;
}

interface IndexTaskNoteState {
  isOpen: boolean;
  note: string;
}

export function IndexTaskNote({ taskId, className }: IndexTaskNoteProps) {
  const task = useTasksState((store) =>
    store.state.tasks.find((t) => t.id === taskId),
  );
  const saveTaskNote = useTasksState((store) => store.actions.saveTaskNote);
  const [state, setState] = useState<IndexTaskNoteState>({
    isOpen: false,
    note: task?.note ?? "",
  });

  const isDirty = state.note !== (task?.note ?? "");

  useEffect(() => {
    setState((prev) => ({ ...prev, note: task?.note ?? "" }));
  }, [task?.note]);

  function handleToggleOpen() {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setState((prev) => ({ ...prev, note: value }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isDirty) handleSave();
    }
  }

  function handleSave() {
    saveTaskNote(taskId, state.note);
  }

  if (!task) return null;

  return (
    <div
      className={twMerge(
        "mt-4 border border-Black-100/20 rounded-xl overflow-hidden dark:border-Black-600",
        className,
      )}
    >
      <button
        onClick={handleToggleOpen}
        className="w-full flex items-center justify-between p-4 bg-White hover:bg-Black-50/10 transition-colors dark:bg-Black-700 dark:hover:bg-Black-600"
      >
        <div className="flex items-center gap-2 text-Black-700 dark:text-White">
          <NotebookPen className="w-5 h-5 text-Green-400" />
          <span className="font-semibold text-sm">{getHeaderLabel()}</span>
        </div>
        {state.isOpen ? (
          <ChevronUp className="w-5 h-5 text-Black-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-Black-400" />
        )}
      </button>

      {state.isOpen && (
        <div className="p-4 bg-White border-t border-Black-100/10 flex flex-col gap-3 dark:bg-Black-700 dark:border-Black-600">
          <textarea
            value={state.note}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write your notes here..."
            className="w-full min-h-[200px] p-4 text-sm text-Black-700 placeholder:text-Black-400 bg-Black-50/20 border border-Black-100 rounded-xl outline-none focus:border-Green-400 focus:ring-1 focus:ring-Green-400 transition-all resize-none dark:bg-Black-800 dark:border-Black-500 dark:text-White field-sizing-content"
          />
          <div className="flex justify-end gap-2">
            <IndexTaskNoteDialog
              taskId={taskId}
              label="View"
              note={state.note}
              buttonClassName="flex items-center gap-2 h-9 px-4 text-sm w-auto"
            />
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              className="flex items-center gap-2 h-9 px-4 text-sm w-auto"
            >
              <Save className="w-4 h-4" />
              {isDirty ? "Save Note" : "Saved"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
