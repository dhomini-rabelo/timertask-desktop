import { create } from "zustand";
import { useCountdownTimerState } from "../countdownTimer";
import { useWorkflowsState } from "../workflows";

export type TaskTimeEvent = {
  type: "start" | "stop" | "complete";
  createdAt: Date;
};

interface BaseTaskItem {
  id: string;
  title: string;
  workflowId: string | null;
  note?: string;
}

export interface Task extends BaseTaskItem {
  type: "task";
  groupId: string | null;
  completed: boolean;
  isRunning: boolean;
  timeEvents: TaskTimeEvent[];
}

export interface TaskGroup extends BaseTaskItem {
  type: "group";
  collapsed: boolean;
}

export type TaskItem = Task | TaskGroup;

export function isTask(item: TaskItem): item is Task {
  return item.type === "task";
}

export function isTaskGroup(item: TaskItem): item is TaskGroup {
  return item.type === "group";
}

export interface TasksState {
  items: TaskItem[];
}

interface TasksActions {
  setItemsState: (items: TaskItem[]) => void;
  addTask: (title: string, groupId?: string | null) => void;
  addGroup: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteItem: (id: string) => void;
  saveEditingItem: (id: string, title: string) => void;
  saveNote: (id: string, note: string) => void;
  reorderItems: (activeId: string, overId: string) => void;
  clearItems: () => void;
  executeTask: (id: string) => void;
  stopTask: (id: string) => void;
}

interface TasksStore {
  state: TasksState;
  actions: TasksActions;
}

export const useTasksState = create<TasksStore>((set, get) => {
  function getSelectedWorkflowId() {
    return useWorkflowsState.getState().state.selectedWorkflowId;
  }

  function setItemsState(items: TaskItem[]) {
    set((store) => ({
      state: {
        items,
      },
      actions: store.actions,
    }));
  }

  function addTask(title: string, groupId?: string | null) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    const resolvedGroupId = groupId ?? null;

    const newTask: Task = {
      type: "task",
      id: crypto.randomUUID(),
      title: trimmedTitle,
      workflowId: selectedWorkflowId,
      groupId: resolvedGroupId,
      completed: false,
      isRunning: false,
      timeEvents: [],
    };

    set((store) => {
      const items = store.state.items;

      if (!resolvedGroupId) {
        return {
          state: {
            items: [...items, newTask],
          },
          actions: store.actions,
        };
      }

      let insertIndex = -1;
      items.forEach((item, index) => {
        if (
          item.id === resolvedGroupId ||
          (isTask(item) && item.groupId === resolvedGroupId)
        ) {
          insertIndex = index;
        }
      });

      if (insertIndex === -1) {
        return {
          state: {
            items: [...items, newTask],
          },
          actions: store.actions,
        };
      }

      const newItems = [
        ...items.slice(0, insertIndex + 1),
        newTask,
        ...items.slice(insertIndex + 1),
      ];

      return {
        state: {
          items: newItems,
        },
        actions: store.actions,
      };
    });
  }

  function addGroup(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    const newGroup: TaskGroup = {
      type: "group",
      id: crypto.randomUUID(),
      title: trimmedTitle,
      workflowId: selectedWorkflowId,
      collapsed: false,
    };

    setItemsState([...get().state.items, newGroup]);
  }

  function toggleTask(id: string) {
    set((store) => ({
      state: {
        items: store.state.items.map((item) => {
          if (item.id !== id || !isTask(item)) {
            return item;
          }

          const isCompleting = !item.completed;
          const completeEvent: TaskTimeEvent = {
            type: "complete",
            createdAt: new Date(),
          };

          return {
            ...item,
            completed: !item.completed,
            timeEvents: isCompleting
              ? [...item.timeEvents, completeEvent]
              : item.timeEvents,
          };
        }),
      },
      actions: store.actions,
    }));
  }

  function deleteItem(id: string) {
    set((store) => ({
      state: {
        items: store.state.items.filter((item) => {
          if (item.id === id) {
            return false;
          }

          if (isTask(item) && item.groupId === id) {
            return false;
          }

          return true;
        }),
      },
      actions: store.actions,
    }));
  }

  function saveEditingItem(id: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    set((store) => ({
      state: {
        items: store.state.items.map((item) =>
          item.id === id ? { ...item, title: trimmedTitle } : item,
        ),
      },
      actions: store.actions,
    }));
  }

  function saveNote(id: string, note: string) {
    set((store) => ({
      state: {
        items: store.state.items.map((item) =>
          item.id === id ? { ...item, note } : item,
        ),
      },
      actions: store.actions,
    }));
  }

  function reorderItems(activeId: string, overId: string) {
    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    set((store) => {
      const items = store.state.items;
      const workflowItems: TaskItem[] = [];
      const workflowItemIndexes: number[] = [];

      items.forEach((item, index) => {
        if (item.workflowId === selectedWorkflowId) {
          workflowItems.push(item);
          workflowItemIndexes.push(index);
        }
      });

      const oldIndex = workflowItems.findIndex((item) => item.id === activeId);
      const newIndex = workflowItems.findIndex((item) => item.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return store;
      }

      const activeItem = workflowItems[oldIndex];
      const overItem = workflowItems[newIndex];

      if (
        (isTask(activeItem) && activeItem.isRunning) ||
        (isTask(overItem) && overItem.isRunning)
      ) {
        return store;
      }

      const reorderedWorkflowItems = [...workflowItems];
      const movedItem = reorderedWorkflowItems.splice(oldIndex, 1)[0];
      reorderedWorkflowItems.splice(newIndex, 0, movedItem);

      const updatedItems = [...items];
      workflowItemIndexes.forEach((index, position) => {
        updatedItems[index] = reorderedWorkflowItems[position];
      });

      return {
        state: {
          items: updatedItems,
        },
        actions: store.actions,
      };
    });
  }

  function clearItems() {
    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    set((store) => ({
      state: {
        items: store.state.items.filter(
          (item) => item.workflowId !== selectedWorkflowId,
        ),
      },
      actions: store.actions,
    }));
  }

  function executeTask(id: string) {
    if (useCountdownTimerState.getState().state.isResting) {
      return;
    }

    set((store) => {
      const startDate = new Date();
      const startEvent: TaskTimeEvent = {
        type: "start",
        createdAt: startDate,
      };

      return {
        state: {
          items: store.state.items.map((item) => {
            if (item.id !== id || !isTask(item)) {
              return item;
            }

            return {
              ...item,
              isRunning: true,
              timeEvents: [...item.timeEvents, startEvent],
            };
          }),
        },
        actions: store.actions,
      };
    });
  }

  function stopTask(id: string) {
    set((store) => {
      const stopDate = new Date();
      const stopEvent: TaskTimeEvent = {
        type: "stop",
        createdAt: stopDate,
      };

      return {
        state: {
          items: store.state.items.map((item) => {
            if (item.id !== id || !isTask(item)) {
              return item;
            }

            return {
              ...item,
              isRunning: false,
              timeEvents: [...item.timeEvents, stopEvent],
            };
          }),
        },
        actions: store.actions,
      };
    });
  }

  return {
    state: {
      items: [],
    },
    actions: {
      setItemsState,

      addTask,
      addGroup,
      toggleTask,
      deleteItem,
      saveEditingItem,
      saveNote,
      reorderItems,
      clearItems,
      executeTask,
      stopTask,
    },
  };
});
