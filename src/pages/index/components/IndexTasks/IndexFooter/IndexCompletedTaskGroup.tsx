import { Check, RotateCcw } from "lucide-react";
import { useListingTasks } from "../../../hooks/useListingTasks";
import { useTasksState, type TaskGroup } from "../../../states/tasks";
import {
  getGroupChildren,
  getGroupProgress,
} from "../../../states/tasks/utils";

interface IndexCompletedTaskGroupProps {
  group: TaskGroup;
}

export function IndexCompletedTaskGroup({
  group,
}: IndexCompletedTaskGroupProps) {
  const toggleGroup = useTasksState((props) => props.actions.toggleGroup);
  const { tasks } = useListingTasks();

  const children = getGroupChildren(tasks, group.id);
  const { completedCount, total } = getGroupProgress(children);

  return (
    <div className="group flex flex-col p-4 rounded-xl bg-white border border-Black-100/30 opacity-95 dark:bg-Black-700 dark:border-Black-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-Green-400 bg-Green-400 shrink-0">
            <Check className="w-4 h-4 text-White" strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-Black-450 dark:text-Black-400 break-all">
              {group.title}
            </span>
            <span className="text-xs text-Black-400">
              {completedCount} of {total} completed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleGroup(group.id)}
            title="Reopen group"
            className="text-Blue-400 hover:text-Blue-500 transition-colors p-1"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
