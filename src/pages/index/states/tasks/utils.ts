import { differenceInSeconds } from "date-fns";
import type { Task, TaskItem, TaskTimeEvent } from "./index";

export function calculateTotalTimeInSeconds(
  events: TaskTimeEvent[],
): number {
  if (!events || events.length === 0) return 0;

  let totalSeconds = 0;
  let startTime: Date | null = null;

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const event of sortedEvents) {
    if (event.type === "start") {
      startTime = new Date(event.createdAt);
    } else if (event.type === "stop" || event.type === "complete") {
      if (startTime) {
        totalSeconds += differenceInSeconds(
          new Date(event.createdAt),
          startTime,
        );
        startTime = null;
      }
    }
  }

  if (startTime) {
    totalSeconds += differenceInSeconds(new Date(), startTime);
  }

  return totalSeconds;
}

export function getTimeRangeFromEvents(events: TaskTimeEvent[]) {
  if (!events || events.length === 0) {
    return {
      startTime: null,
      endTime: null,
    };
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let startTime: Date | null = null;
  let endTime: Date | null = null;

  for (const event of sortedEvents) {
    if (event.type === "start" && !startTime) {
      startTime = new Date(event.createdAt);
    }

    if (event.type === "stop" || event.type === "complete") {
      endTime = new Date(event.createdAt);
    }
  }

  if (startTime && !endTime) {
    endTime = new Date();
  }

  return {
    startTime,
    endTime,
  };
}

export function shouldAutoStart(timeEvents: TaskTimeEvent[]): boolean {
  const lastEvent = timeEvents[timeEvents.length - 1];
  return lastEvent?.type === "start";
}

export function getGroupChildren(
  items: TaskItem[],
  groupId: string,
): Task[] {
  return items.filter(
    (item): item is Task => item.type === "task" && item.groupId === groupId,
  );
}

export function getGroupProgress(children: Task[]): {
  completedCount: number;
  total: number;
  percentage: number;
} {
  const completedCount = children.filter((task) => task.completed).length;
  const total = children.length;
  const percentage = total
    ? Math.round((completedCount / total) * 100)
    : 0;

  return { completedCount, total, percentage };
}

export function canCompleteGroup(children: Task[]): boolean {
  return children.length > 0 && children.every((task) => task.completed);
}
