import { isTask, isTaskGroup, useTasksState } from "../states/tasks";
import { useWorkflowsState } from "../states/workflows";

export function useListingTasks() {
  const items = useTasksState((props) => props.state.items);
  const selectedWorkflowId = useWorkflowsState(
    (props) => props.state.selectedWorkflowId,
  );
  const workflowItems = selectedWorkflowId
    ? items.filter((item) => item.workflowId === selectedWorkflowId)
    : [];

  const groups = workflowItems.filter(isTaskGroup);
  const tasks = workflowItems.filter(isTask);
  const rootTasks = tasks.filter((task) => task.groupId === null);
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return {
    workflowItems,
    groups,
    tasks,
    rootTasks,
    activeTasks,
    completedTasks,
  };
}
