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
    <div className="group space-y-0 bg-Black-100/50 border border-Black-300/15 rounded-xl dark:bg-Black-700/50 dark:border-Black-600">
      <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-Black-100/30 hover:border-Green-400/50 shadow-sm hover:shadow-md transition-all dark:bg-Black-700 dark:border-Black-600">
        {isEditing ? (
          <IndexEditInput initialValue={group.title} />
        ) : (
          <>
            <div className="flex items-center gap-4 flex-1">
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-Black-400 hover:text-Black-700 dark:hover:text-White transition-colors"
              >
                <GripVertical className="w-5 h-5" />
              </div>

              <span className="text-sm font-medium text-Black-700 dark:text-White break-all">
                {group.title}
              </span>
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
                className="text-Black-400 hover:text-Black-600 dark:hover:text-White transition-all p-2"
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
        <div className="px-4 pb-3">
          <span className="text-sm font-medium text-Black-450 dark:text-Black-400">
            {completedCount} of {total} completed
          </span>
          <ProgressBar percentage={percentage} />
        </div>
      )}

      {!isEditing && !group.collapsed && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex gap-3">
            <Input
              placeholder="Add a task..."
              value={childTitle}
              onChange={handleChildTitleChange}
              onKeyDown={handleChildKeyDown}
              className="flex-1"
            />
            <Button onClick={handleAddChild} className="w-auto px-6 py-2">
              Add
            </Button>
          </div>

          <IndexGroupTasksList group={group} />
        </div>
      )}
    </div>
  );
}
