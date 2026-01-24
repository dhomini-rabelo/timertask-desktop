import { create } from "zustand";
import { getActiveTask } from "../../components/IndexTasks/utils";
import { useCountdownTimerState } from "../countdownTimer";
import { useWorkflowsState } from "../workflows";

export type SubTaskTimeEvent = {
  type: "start" | "stop" | "complete";
  createdAt: Date;
};

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  isRunning: boolean;
  timeEvents: SubTaskTimeEvent[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isRunning: boolean;
  subtasks: SubTask[];
  workflowId: string | null;
  note?: string;
}

export interface TasksState {
  tasks: Task[];
}

interface TasksActions {
  setTasksState: (tasks: Task[]) => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  saveEditingTask: (id: string, title: string) => void;
  saveTaskNote: (id: string, note: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  clearTasks: () => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  deleteSubtask: (subtaskId: string, taskId?: string) => void;
  saveEditingSubtask: (
    subtaskId: string,
    title: string,
    taskId?: string,
  ) => void;
  reorderSubtasks: (activeId: string, overId: string) => void;
  executeSubtask: (subtaskId: string) => void;
  stopSubtask: (subtaskId: string) => void;
  clearSubtasks: () => void;
}

interface TasksStore {
  state: TasksState;
  actions: TasksActions;
}

export const useTasksState = create<TasksStore>((set, get) => {
  function getSelectedWorkflowId() {
    return useWorkflowsState.getState().state.selectedWorkflowId;
  }

  function getWorkflowTasks(tasks: Task[]) {
    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return [];
    }

    return tasks.filter((task) => task.workflowId === selectedWorkflowId);
  }

  function getActiveWorkflowTask(tasks: Task[]) {
    const workflowTasks = getWorkflowTasks(tasks);
    return getActiveTask(workflowTasks);
  }

  function setState(partial: Partial<TasksState>) {
    set((store) => ({
      state: {
        tasks: partial.tasks ?? store.state.tasks,
      },
      actions: store.actions,
    }));
  }

  function setTasksState(tasks: Task[]) {
    set((store) => ({
      state: {
        tasks: tasks,
      },
      actions: store.actions,
    }));
  }

  function addTask(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      isRunning: false,
      subtasks: [],
      workflowId: selectedWorkflowId,
    };

    setState({
      tasks: [...get().state.tasks, newTask],
    });
  }

  function toggleTask(id: string) {
    set((store) => ({
      state: {
        tasks: store.state.tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      },
      actions: store.actions,
    }));
  }

  function deleteTask(id: string) {
    set((store) => ({
      state: {
        tasks: store.state.tasks.filter((task) => task.id !== id),
      },
      actions: store.actions,
    }));
  }

  function saveEditingTask(id: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    set((store) => ({
      state: {
        tasks: store.state.tasks.map((task) =>
          task.id === id ? { ...task, title: trimmedTitle } : task,
        ),
      },
      actions: store.actions,
    }));
  }

  function saveTaskNote(id: string, note: string) {
    set((store) => ({
      state: {
        tasks: store.state.tasks.map((task) =>
          task.id === id ? { ...task, note } : task,
        ),
      },
      actions: store.actions,
    }));
  }

  function reorderTasks(activeId: string, overId: string) {
    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    set((store) => {
      const tasks = store.state.tasks;
      const workflowTasks: Task[] = [];
      const workflowTaskIndexes: number[] = [];

      tasks.forEach((task, index) => {
        if (task.workflowId === selectedWorkflowId) {
          workflowTasks.push(task);
          workflowTaskIndexes.push(index);
        }
      });

      const oldIndex = workflowTasks.findIndex((task) => task.id === activeId);
      const newIndex = workflowTasks.findIndex((task) => task.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return store;
      }

      if (
        workflowTasks[oldIndex].isRunning ||
        workflowTasks[newIndex].isRunning
      ) {
        return store;
      }

      const reorderedWorkflowTasks = [...workflowTasks];
      const movedTask = reorderedWorkflowTasks.splice(oldIndex, 1)[0];
      reorderedWorkflowTasks.splice(newIndex, 0, movedTask);

      const updatedTasks = [...tasks];
      workflowTaskIndexes.forEach((index, position) => {
        updatedTasks[index] = reorderedWorkflowTasks[position];
      });

      return {
        state: {
          tasks: updatedTasks,
        },
        actions: store.actions,
      };
    });
  }

  function addSubtask(taskId: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    set((store) => {
      const targetTask = store.state.tasks.find((task) => task.id === taskId);
      if (!targetTask) {
        return store;
      }

      const newSubtask: SubTask = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        completed: false,
        isRunning: false,
        timeEvents: [],
      };

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === targetTask.id
              ? { ...task, subtasks: [...task.subtasks, newSubtask] }
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function toggleSubtask(subtaskId: string) {
    set((store) => {
      const activeTask = getActiveWorkflowTask(store.state.tasks);
      if (!activeTask) {
        return store;
      }

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === activeTask.id
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? (() => {
                          const isCompleting = !subtask.completed;
                          const completeEvent: SubTaskTimeEvent = {
                            createdAt: new Date(),
                            type: "complete",
                          };
                          return {
                            ...subtask,
                            completed: !subtask.completed,
                            timeEvents: isCompleting
                              ? [...subtask.timeEvents, completeEvent]
                              : subtask.timeEvents,
                          };
                        })()
                      : subtask,
                  ),
                }
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function deleteSubtask(subtaskId: string, taskId?: string) {
    set((store) => {
      const targetTask = taskId
        ? store.state.tasks.find((task) => task.id === taskId)
        : getActiveWorkflowTask(store.state.tasks);
      if (!targetTask) {
        return store;
      }

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === targetTask.id
              ? {
                  ...task,
                  subtasks: task.subtasks.filter(
                    (subtask) => subtask.id !== subtaskId,
                  ),
                }
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function saveEditingSubtask(
    subtaskId: string,
    title: string,
    taskId?: string,
  ) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    set((store) => {
      const targetTask = taskId
        ? store.state.tasks.find((task) => task.id === taskId)
        : getActiveWorkflowTask(store.state.tasks);
      if (!targetTask) {
        return store;
      }

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === targetTask.id
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? { ...subtask, title: trimmedTitle }
                      : subtask,
                  ),
                }
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function reorderSubtasks(activeId: string, overId: string) {
    set((store) => {
      const activeTask = getActiveWorkflowTask(store.state.tasks);
      if (!activeTask) {
        return store;
      }

      const taskIndex = store.state.tasks.findIndex(
        (task) => task.id === activeTask.id,
      );
      if (taskIndex === -1) {
        return store;
      }

      const task = store.state.tasks[taskIndex];
      const oldIndex = task.subtasks.findIndex(
        (subtask) => subtask.id === activeId,
      );
      const newIndex = task.subtasks.findIndex(
        (subtask) => subtask.id === overId,
      );

      if (oldIndex === -1 || newIndex === -1) {
        return store;
      }

      if (
        task.subtasks[oldIndex].isRunning ||
        task.subtasks[newIndex].isRunning
      ) {
        return store;
      }

      const newSubtasks = [...task.subtasks];
      const movedSubtask = newSubtasks.splice(oldIndex, 1)[0];
      newSubtasks.splice(newIndex, 0, movedSubtask);

      const newTasks = [...store.state.tasks];
      newTasks[taskIndex] = { ...task, subtasks: newSubtasks };

      return {
        state: {
          tasks: newTasks,
        },
        actions: store.actions,
      };
    });
  }

  function executeSubtask(subtaskId: string) {
    if (useCountdownTimerState.getState().state.isResting) {
      return
    }

    set((store) => {
      const activeTask = getActiveWorkflowTask(store.state.tasks);
      if (!activeTask) {
        return store;
      }

      const startDate = new Date();
      const startEvent: SubTaskTimeEvent = {
        createdAt: startDate,
        type: "start",
      };

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === activeTask.id
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? {
                          ...subtask,
                          isRunning: true,
                          timeEvents: [...subtask.timeEvents, startEvent],
                        }
                      : { ...subtask, isRunning: false },
                  ),
                  isRunning: true,
                }
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function stopSubtask(subtaskId: string) {
    set((store) => {
      const activeTask = getActiveWorkflowTask(store.state.tasks);
      if (!activeTask) {
        return store;
      }

      const stopDate = new Date();
      const stopEvent: SubTaskTimeEvent = {
        createdAt: stopDate,
        type: "stop",
      };

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === activeTask.id
              ? (() => {
                  const updatedSubtasks = task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? {
                          ...subtask,
                          isRunning: false,
                          timeEvents: [...subtask.timeEvents, stopEvent],
                        }
                      : subtask,
                  );

                  return {
                    ...task,
                    subtasks: updatedSubtasks,
                    isRunning: false,
                  };
                })()
              : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  function clearTasks() {
    const selectedWorkflowId = getSelectedWorkflowId();
    if (!selectedWorkflowId) {
      return;
    }

    set((store) => ({
      state: {
        tasks: store.state.tasks.filter(
          (task) => task.workflowId !== selectedWorkflowId,
        ),
      },
      actions: store.actions,
    }));
  }

  function clearSubtasks() {
    set((store) => {
      const activeTask = getActiveWorkflowTask(store.state.tasks);
      if (!activeTask) {
        return store;
      }

      return {
        state: {
          tasks: store.state.tasks.map((task) =>
            task.id === activeTask.id ? { ...task, subtasks: [] } : task,
          ),
        },
        actions: store.actions,
      };
    });
  }

  return {
    state: {
      tasks: [],
    },
    actions: {
      setTasksState,

      addTask,
      toggleTask,
      deleteTask,
      saveEditingTask,
      saveTaskNote,
      reorderTasks,
      clearTasks,

      addSubtask,
      toggleSubtask,
      deleteSubtask,
      saveEditingSubtask,
      reorderSubtasks,
      executeSubtask,
      stopSubtask,
      clearSubtasks,
    },
  };
});
