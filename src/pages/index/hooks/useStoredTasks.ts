import { useEffect, useRef } from "react";
import { isTask, useTasksState, type Task, type TaskItem, type TaskTimeEvent } from "../states/tasks";

const localStorageKey = "timertasks:tasks";

type LegacyTimeEvent = {
  type: "start" | "stop" | "complete";
  createdAt: string | Date;
};

interface LegacySubTask {
  id: string;
  title: string;
  completed?: boolean;
  isRunning?: boolean;
  timeEvents?: LegacyTimeEvent[];
}

interface LegacyTaskEntry {
  type?: "task" | "group";
  id: string;
  title: string;
  workflowId?: string | null;
  note?: string;
  completed?: boolean;
  isRunning?: boolean;
  timeEvents?: LegacyTimeEvent[];
  groupId?: string | null;
  collapsed?: boolean;
  subtasks?: LegacySubTask[];
}

function reviveEvents(events?: LegacyTimeEvent[]): TaskTimeEvent[] {
  return (events ?? []).map((event) => ({
    type: event.type,
    createdAt: new Date(event.createdAt),
  }));
}

function migrateEntry(entry: LegacyTaskEntry): TaskItem[] {
  if (entry?.type === "group") {
    return [
      {
        type: "group",
        id: entry.id,
        title: entry.title,
        workflowId: entry.workflowId ?? null,
        note: entry.note,
        collapsed: entry.collapsed ?? false,
      },
    ];
  }

  if (entry?.type === "task") {
    return [
      {
        type: "task",
        id: entry.id,
        title: entry.title,
        workflowId: entry.workflowId ?? null,
        note: entry.note,
        groupId: entry.groupId ?? null,
        completed: !!entry.completed,
        isRunning: !!entry.isRunning,
        timeEvents: reviveEvents(entry.timeEvents),
      },
    ];
  }

  const subtasks = entry.subtasks ?? [];
  if (subtasks.length > 0) {
    const group: TaskItem = {
      type: "group",
      id: entry.id,
      title: entry.title,
      workflowId: entry.workflowId ?? null,
      note: entry.note,
      collapsed: false,
    };

    const tasks: Task[] = subtasks.map((sub) => ({
      type: "task",
      id: sub.id,
      title: sub.title,
      completed: !!sub.completed,
      isRunning: !!sub.isRunning,
      timeEvents: reviveEvents(sub.timeEvents),
      workflowId: entry.workflowId ?? null,
      groupId: entry.id,
    }));

    return [group, ...tasks];
  }

  return [
    {
      type: "task",
      id: entry.id,
      title: entry.title,
      completed: !!entry.completed,
      isRunning: !!entry.isRunning,
      timeEvents: reviveEvents(entry.timeEvents),
      workflowId: entry.workflowId ?? null,
      groupId: null,
      note: entry.note,
    },
  ];
}

function migrateStoredItems(parsed: unknown): TaskItem[] {
  if (!Array.isArray(parsed)) {
    return [];
  }

  return (parsed as LegacyTaskEntry[]).flatMap(migrateEntry);
}

export function useStoredTasks() {
  const items = useTasksState((props) => props.state.items);
  const setItemsState = useTasksState((props) => props.actions.setItemsState);
  const hasHydratedRef = useRef<boolean>(false);
  const itemsRef = useRef<TaskItem[]>(items);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedItems = localStorage.getItem(localStorageKey);
    if (!storedItems) {
      setItemsState([]);
      hasHydratedRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(storedItems);
      const migratedItems = migrateStoredItems(parsed);

      setItemsState(migratedItems);
      hasHydratedRef.current = true;
    } catch {
      setItemsState([]);
      hasHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (typeof window === "undefined") return;
      if (!hasHydratedRef.current) return;

      const stopDate = new Date();
      const itemsWithStoppedTasks = itemsRef.current.map((item) => {
        if (!isTask(item)) {
          return item;
        }

        const lastEventWasStart =
          item.timeEvents[item.timeEvents.length - 1]?.type === "start";

        if (!item.isRunning || !lastEventWasStart) {
          return item;
        }

        return {
          ...item,
          isRunning: true,
          timeEvents: [
            ...item.timeEvents,
            {
              type: "stop" as const,
              createdAt: stopDate,
            },
          ],
        };
      });

      localStorage.setItem(
        localStorageKey,
        JSON.stringify(itemsWithStoppedTasks),
      );
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(localStorageKey, JSON.stringify(itemsRef.current));
  }, [hasHydratedRef, items]);

  return items;
}
