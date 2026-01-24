import {
  differenceInSeconds,
  isSameDay,
  startOfDay,
  subDays
} from "date-fns";
import type { SubTaskTimeEvent, Task } from "./index";

export function calculateSubtaskTime(events: SubTaskTimeEvent[]): number {
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

export function calculateSubtaskTimeToday(events: SubTaskTimeEvent[]): number {
  if (!events || events.length === 0) return 0;

  let totalSeconds = 0;
  let startTime: Date | null = null;

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const todayStart = startOfDay(new Date());

  for (const event of sortedEvents) {
    const eventDate = new Date(event.createdAt);
    if (event.type === "start") {
      startTime = eventDate;
    } else if (event.type === "stop" || event.type === "complete") {
      if (startTime) {
        const endTime = eventDate;

        // Intersect interval [startTime, endTime] with [todayStart, now]
        const intervalStart =
          startTime.getTime() > todayStart.getTime() ? startTime : todayStart;
        const intervalEnd = endTime;

        if (
          intervalEnd.getTime() > intervalStart.getTime() &&
          intervalEnd.getTime() > todayStart.getTime()
        ) {
          totalSeconds += differenceInSeconds(intervalEnd, intervalStart);
        }
        startTime = null;
      }
    }
  }

  if (startTime) {
    const intervalStart =
      startTime.getTime() > todayStart.getTime() ? startTime : todayStart;
    const intervalEnd = new Date();
    if (intervalEnd.getTime() > intervalStart.getTime()) {
      totalSeconds += differenceInSeconds(intervalEnd, intervalStart);
    }
  }

  return totalSeconds;
}

export function calculateTotalFocusedTime(tasks: Task[]): number {
  let totalSeconds = 0;
  tasks.forEach((task) => {
    task.subtasks.forEach((subtask) => {
      totalSeconds += calculateSubtaskTime(subtask.timeEvents);
    });
  });
  return totalSeconds;
}

export function calculateTodayFocusedTime(tasks: Task[]): number {
  let totalSeconds = 0;
  tasks.forEach((task) => {
    task.subtasks.forEach((subtask) => {
      totalSeconds += calculateSubtaskTimeToday(subtask.timeEvents);
    });
  });
  return totalSeconds;
}

export function calculateTasksCompleted(tasks: Task[]): number {
  let count = 0;

  tasks.forEach((task) => {
    task.subtasks.forEach((subtask) => {
      const hasCompletedToday = subtask.timeEvents.some(
        (event) =>
          event.type === "complete",
      );
      if (hasCompletedToday) {
        count++;
      }
    });
  });

  return count;
}

export function calculateCurrentStreak(tasks: Task[]): number {
  const activeDays = new Set<string>();

  tasks.forEach((task) => {
    task.subtasks.forEach((subtask) => {
      subtask.timeEvents.forEach((event) => {
        if (event.type === "start") {
          activeDays.add(startOfDay(new Date(event.createdAt)).toISOString());
        }
      });
    });
  });

  if (activeDays.size === 0) return 0;

  const sortedDays = Array.from(activeDays)
    .map((dateStr) => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  let currentStreak = 0;
  const checkDay = isSameDay(sortedDays[0], today)
    ? today
    : isSameDay(sortedDays[0], yesterday)
      ? yesterday
      : null;

  if (!checkDay) return 0;

  // Verify the streak starting from checkDay backwards
  let currentCheck = checkDay;
  while (activeDays.has(currentCheck.toISOString())) {
    currentStreak++;
    currentCheck = subDays(currentCheck, 1);
  }

  return currentStreak;
}
