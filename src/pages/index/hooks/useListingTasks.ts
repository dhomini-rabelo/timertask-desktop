import { isTask, isTaskGroup, type TaskItem, useTasksState } from "../states/tasks";
import {
  getGroupActivityStatus,
  getGroupChildren,
  getTaskActivityStatus,
} from "../states/tasks/utils";
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
  const activeGroups = groups.filter((group) => !group.completed);
  const completedGroups = groups.filter((group) => group.completed);
  const tasks = workflowItems.filter(isTask);
  const rootTasks = tasks.filter((task) => task.groupId === null);
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const activeRootTasks = rootTasks.filter((task) => !task.completed);
  const activeListItems = workflowItems.filter(
    (item) =>
      (isTaskGroup(item) && !item.completed) ||
      (isTask(item) && item.groupId === null && !item.completed),
  );

  const activeSectionItems: TaskItem[] = [];
  const pausedSectionItems: TaskItem[] = [];
  const pendingSectionItems: TaskItem[] = [];

  activeListItems.forEach((item) => {
    const status = isTask(item)
      ? getTaskActivityStatus(item)
      : getGroupActivityStatus(getGroupChildren(tasks, item.id));

    if (status === "active") {
      activeSectionItems.push(item);
    } else if (status === "paused") {
      pausedSectionItems.push(item);
    } else {
      pendingSectionItems.push(item);
    }
  });

  return {
    workflowItems,
    groups,
    activeGroups,
    completedGroups,
    tasks,
    rootTasks,
    activeTasks,
    completedTasks,
    activeRootTasks,
    activeListItems,
    activeSectionItems,
    pausedSectionItems,
    pendingSectionItems,
  };
}
