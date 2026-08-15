import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../../../layout/components/atoms/Button";
import { ProgressBar } from "../../../../../layout/components/atoms/ProgressBar";
import { useListingTasks } from "../../../hooks/useListingTasks";
import { useTasksState } from "../../../states/tasks";
import { IndexCompletedTaskItem } from "./IndexCompletedTaskItem";

interface IndexTasksState {
  showCompleted: boolean;
}

export function IndexFooter() {
  const [state, setState] = useState<IndexTasksState>({
    showCompleted: false,
  });
  const clearItems = useTasksState((props) => props.actions.clearItems);

  const { tasks, completedTasks, groups } = useListingTasks();

  const totalTasksCount = tasks.length;
  const completedTasksCount = completedTasks.length;
  const progressPercentage = totalTasksCount
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;
  const groupTitleById = new Map(
    groups.map((group) => [group.id, group.title]),
  );

  function handleReset() {
    clearItems();
  }

  function handleToggleShowCompleted() {
    setState((prev) => ({
      ...prev,
      showCompleted: !prev.showCompleted,
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between py-2 border-b border-Black-100/20 dark:border-Black-600">
        <div
          className={twMerge(
            "flex items-center gap-1 transition-colors text-Black-450 dark:text-Black-400",
            completedTasks.length > 0
              ? "cursor-pointer hover:text-Black-300"
              : "",
          )}
          onClick={
            completedTasks.length > 0 ? handleToggleShowCompleted : undefined
          }
        >
          <span className="text-sm font-medium">
            {completedTasks.length} of {tasks.length} completed
          </span>
          {completedTasks.length > 0 &&
            (state.showCompleted ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            ))}
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleReset}
              className="text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {state.showCompleted && completedTasks.length > 0 && (
        <div className="flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto">
          {completedTasks.map((task) => (
            <IndexCompletedTaskItem
              key={task.id}
              task={task}
              groupTitle={
                task.groupId ? groupTitleById.get(task.groupId) : undefined
              }
            />
          ))}
        </div>
      )}

      <ProgressBar percentage={progressPercentage} />
    </div>
  );
}
