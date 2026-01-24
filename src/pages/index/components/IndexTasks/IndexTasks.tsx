import { useAtom } from "jotai";
import { useEffect } from "react";
import { Box } from "../../../../layout/components/atoms/Box";
import { useListingTasks } from "../../hooks/useListingTasks";
import { useStoredTasks } from "../../hooks/useStoredTasks";
import { IndexActiveTasksList } from "./IndexActiveTasksList/IndexActiveTasksList";
import { IndexAddInput } from "./IndexAddInput";
import { IndexErrorMessage } from "./IndexErrorMessage";
import { IndexFooter } from "./IndexFooter/IndexFooter";
import { indexTasksPageStateAtom } from "./shared-state";
import { getActiveTask, getTaskListingMode } from "./utils";

export function IndexTasks() {
  useStoredTasks();
  const [state, setState] = useAtom(indexTasksPageStateAtom);
  const listingTasksResult = useListingTasks({
    inExecutionTaskId: state.inExecutionTaskId,
  });
  const listingTasks = listingTasksResult.listingTasks;
  const activeTasks = listingTasksResult.activeTasks;
  const workflowTasks = listingTasksResult.tasks;
  const listingMode = getTaskListingMode(state.inExecutionTaskId);
  const activeTask = getActiveTask(workflowTasks);

  useEffect(() => {
    if (!state.inExecutionTaskId) {
      return;
    }

    const hasTaskInWorkflow = workflowTasks.some(
      (task) => task.id === state.inExecutionTaskId,
    );

    if (!hasTaskInWorkflow) {
      setState((prev) => ({
        ...prev,
        inExecutionTaskId: null,
      }));
    }
  }, [state.inExecutionTaskId, workflowTasks]);

  function handleExitSubtasks() {
    setState((prev) => ({
      ...prev,
      inExecutionTaskId: null,
    }));
  }

  return (
    <Box className="w-full max-w-[600px] ml-auto p-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-Black-700 dark:text-White flex items-center gap-1.5">
          {listingMode === "subtasks" && activeTask ? (
            <>
              <span
                className="text-Black-400 cursor-pointer hover:text-Black-100 dark:hover:text-Black-300 transition-colors"
                onClick={handleExitSubtasks}
              >
                Tasks
              </span>
              <span className="text-Black-300 dark:text-Black-500">/</span>
              <span
                className="truncate max-w-[350px] text-xl"
                title={activeTask.title}
              >
                {activeTask.title}
              </span>
            </>
          ) : listingMode === "tasks-group" ? (
            "Task Groups"
          ) : (
            "Tasks"
          )}
        </h2>
        <p className="text-Black-300 dark:text-Black-400 text-sm">
          Manage your daily tasks efficiently, keep track of debugging time, and
          avoid wasting time on easy tasks.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <IndexAddInput
          listingMode={listingMode}
          taskId={listingMode === "subtasks" ? state.inExecutionTaskId : null}
        />

        <IndexErrorMessage />

        <div className="flex flex-col gap-3 max-h-[calc(100vh-400px)] min-h-[250px] overflow-y-auto">
          {activeTasks.length === 0 ? (
            <div className="grow flex items-center justify-center">
              <span className="text-base text-Black-400">
                {listingMode === "tasks-group"
                  ? listingTasks.length > 0
                    ? "All tasks completed!"
                    : "No task group registered"
                  : listingTasks.length > 0
                    ? "All tasks completed!"
                    : "No tasks yet. Add one above!"}
              </span>
            </div>
          ) : (
            <IndexActiveTasksList inExecutionTaskId={state.inExecutionTaskId} />
          )}
        </div>

        <IndexFooter
          inExecutionTaskId={state.inExecutionTaskId}
          onFinishTask={handleExitSubtasks}
        />
      </div>
    </Box>
  );
}
