import { useAtom } from "jotai";
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../../../../layout/components/atoms/Button";
import { Input } from "../../../../../../layout/components/atoms/Input";
import { ProgressBar } from "../../../../../../layout/components/atoms/ProgressBar";
import { useListingTasks } from "../../../../hooks/useListingTasks";
import {
  isTaskGroup,
  useTasksState,
  type TaskGroup,
} from "../../../../states/tasks";
import {
  canCompleteGroup,
  getGroupChildren,
  getGroupProgress,
} from "../../../../states/tasks/utils";
import { indexTasksPageStateAtom } from "../../shared-state";
import { IndexEditInput } from "../shared-components/IndexEditInput";
import { IndexGroupTasksList } from "./IndexGroupTasksList";

interface IndexTaskGroupProps {
  group: TaskGroup;
  dragHandleProps?: Record<string, unknown>;
}

export function IndexTaskGroup({ group, dragHandleProps }: IndexTaskGroupProps) {
  const [indexTasksPageState, setIndexTasksPageState] = useAtom(
    indexTasksPageStateAtom,
  );
  const isEditing = indexTasksPageState.editingTaskId === group.id;
  const deleteItem = useTasksState((props) => props.actions.deleteItem);
  const addTask = useTasksState((props) => props.actions.addTask);
  const toggleGroup = useTasksState((props) => props.actions.toggleGroup);
  const { tasks } = useListingTasks();
  const [childTitle, setChildTitle] = useState("");

  const children = getGroupChildren(tasks, group.id);
  const { completedCount, total, percentage } = getGroupProgress(children);
  const canComplete = canCompleteGroup(children);

  function handleEditGroup() {
    setIndexTasksPageState((prev) => ({
      ...prev,
      editingTaskId: group.id,
    }));
  }

  function handleToggleCollapsed() {
    const { items } = useTasksState.getState().state;
    const { setItemsState } = useTasksState.getState().actions;

    const updatedItems = items.map((item) => {
      if (item.id !== group.id || !isTaskGroup(item)) {
        return item;
      }

      return { ...item, collapsed: !item.collapsed };
    });

    setItemsState(updatedItems);
  }

  function handleChildTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChildTitle(e.target.value);
  }

  function handleChildKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAddChild();
    }
  }

  function handleAddChild() {
    if (childTitle.trim()) {
      addTask(childTitle, group.id);
      setChildTitle("");
    }
  }

  return (
    <div className="group rounded-xl border border-Black-100 bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600">
      <div className="flex items-center justify-between p-4">
        {isEditing ? (
          <IndexEditInput initialValue={group.title} />
        ) : (
          <>
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-Black-450 dark:text-Black-400 hover:text-Black-700 dark:hover:text-White transition-colors"
              >
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className="text-sm font-medium text-Black-700 dark:text-White truncate block"
                  title={group.title}
                >
                  {group.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => toggleGroup(group.id)}
                  disabled={!canComplete}
                  title={
                    canComplete
                      ? "Mark group as complete"
                      : children.length === 0
                        ? "Add at least one task first"
                        : "Complete all tasks first"
                  }
                  className={twMerge(
                    "text-Green-400 hover:text-Green-500 transition-all p-2",
                    !canComplete && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleEditGroup}
                  className="text-Yellow-400 hover:text-Yellow-500 transition-all p-2"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteItem(group.id)}
                  title="Delete group and its tasks"
                  className="text-Red-400 hover:text-Red-500 transition-all p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleToggleCollapsed}
                className="text-Black-450 dark:text-Black-400 hover:text-Black-600 dark:hover:text-White transition-all p-2"
              >
                {group.collapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="bg-Black-100/40 border-t border-Black-100 px-4 py-3 flex flex-col gap-3 dark:bg-Black-800/40 dark:border-Black-600">
          <span className="text-sm font-medium text-Black-450 dark:text-Black-400">
            {completedCount} of {total} completed
          </span>
          <ProgressBar percentage={percentage} />

          {!group.collapsed && (
            <>
              <div className="flex gap-3">
                <Input
                  placeholder="Add a task..."
                  value={childTitle}
                  onChange={handleChildTitleChange}
                  onKeyDown={handleChildKeyDown}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={handleAddChild}
                  className="w-auto shrink-0 px-4 py-2"
                >
                  Add
                </Button>
              </div>

              <IndexGroupTasksList group={group} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
