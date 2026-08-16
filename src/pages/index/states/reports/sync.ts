import { isSameDay } from "date-fns";
import { isTask, isTaskGroup, type TaskItem } from "../tasks";
import { calculateTaskTimeToday } from "../tasks/scoreUtils";
import type { Workflow } from "../workflows";
import type { DailyReportEntry, DailyReportTask } from "./index";

export function buildTodayTasks(
  items: TaskItem[],
  workflows: Workflow[],
  today: Date,
): DailyReportTask[] {
  const workflowTitleById = new Map<string, string>();
  workflows.forEach((workflow) => {
    workflowTitleById.set(workflow.id, workflow.title);
  });

  const groupTitleById = new Map<string, string>();
  items.filter(isTaskGroup).forEach((group) => {
    groupTitleById.set(group.id, group.title);
  });

  const result: DailyReportTask[] = [];

  items.filter(isTask).forEach((task) => {
    const secondsToday = calculateTaskTimeToday(task.timeEvents);

    let completedAt: string | null = null;
    let latestCompletedAt: Date | null = null;
    task.timeEvents.forEach((event) => {
      if (event.type !== "complete") return;
      const eventDate = new Date(event.createdAt);
      if (!isSameDay(eventDate, today)) return;
      if (latestCompletedAt === null || eventDate.getTime() > latestCompletedAt.getTime()) {
        latestCompletedAt = eventDate;
      }
    });
    if (latestCompletedAt !== null) {
      completedAt = (latestCompletedAt as Date).toISOString();
    }

    if (secondsToday === 0 && completedAt === null) {
      return;
    }

    result.push({
      id: task.id,
      title: task.title,
      workflowId: task.workflowId,
      workflowTitle: task.workflowId
        ? (workflowTitleById.get(task.workflowId) ?? null)
        : null,
      groupTitle: task.groupId
        ? (groupTitleById.get(task.groupId) ?? null)
        : null,
      secondsToday,
      completedAt,
    });
  });

  return result;
}

export function mergeDailyTasks(
  existingTasks: DailyReportTask[],
  liveTasks: DailyReportTask[],
): DailyReportTask[] {
  const liveTaskById = new Map<string, DailyReportTask>();
  liveTasks.forEach((task) => {
    liveTaskById.set(task.id, task);
  });

  const base = existingTasks.map((existingTask) => {
    const liveTask = liveTaskById.get(existingTask.id);
    if (!liveTask) {
      return existingTask;
    }

    return {
      ...liveTask,
      secondsToday: Math.max(liveTask.secondsToday, existingTask.secondsToday),
      completedAt: liveTask.completedAt ?? existingTask.completedAt,
    };
  });

  const existingIds = new Set(existingTasks.map((task) => task.id));
  const tail = liveTasks.filter((task) => !existingIds.has(task.id));

  return [...base, ...tail];
}

export function buildDailyEntry(
  dateKey: string,
  existing: DailyReportEntry | null,
  liveTasks: DailyReportTask[],
  cycles: number,
): DailyReportEntry {
  const tasks = mergeDailyTasks(existing?.tasks ?? [], liveTasks);

  const focusedSeconds = tasks.reduce(
    (sum, task) => sum + task.secondsToday,
    0,
  );
  const completedCount = tasks.filter(
    (task) => task.completedAt !== null,
  ).length;
  const namesPurged = tasks.length > 0 ? false : (existing?.namesPurged ?? false);

  return {
    date: dateKey,
    cycles,
    focusedSeconds,
    completedCount,
    tasks,
    namesPurged,
  };
}

export function areEntriesEqual(
  a: DailyReportEntry | null,
  b: DailyReportEntry,
): boolean {
  if (a === null) return false;

  if (
    a.date !== b.date ||
    a.cycles !== b.cycles ||
    a.focusedSeconds !== b.focusedSeconds ||
    a.completedCount !== b.completedCount ||
    a.namesPurged !== b.namesPurged ||
    a.tasks.length !== b.tasks.length
  ) {
    return false;
  }

  for (let i = 0; i < a.tasks.length; i++) {
    const taskA = a.tasks[i];
    const taskB = b.tasks[i];

    if (
      taskA.id !== taskB.id ||
      taskA.title !== taskB.title ||
      taskA.workflowId !== taskB.workflowId ||
      taskA.workflowTitle !== taskB.workflowTitle ||
      taskA.groupTitle !== taskB.groupTitle ||
      taskA.secondsToday !== taskB.secondsToday ||
      taskA.completedAt !== taskB.completedAt
    ) {
      return false;
    }
  }

  return true;
}
