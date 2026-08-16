import { format, startOfDay, subDays } from "date-fns";
import type { DailyReportEntry, DailyReportTask } from "./index";

export const RETENTION_DAYS = 7;

export function getDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getRetentionWindowStartKey(today: Date): string {
  return getDayKey(startOfDay(subDays(today, RETENTION_DAYS - 1)));
}

function normalizeTask(raw: unknown): DailyReportTask | null {
  if (typeof raw !== "object" || raw === null) return null;

  const task = raw as Record<string, unknown>;
  if (typeof task.id !== "string") return null;

  return {
    id: task.id,
    title: typeof task.title === "string" ? task.title : "",
    workflowId: typeof task.workflowId === "string" ? task.workflowId : null,
    workflowTitle:
      typeof task.workflowTitle === "string" ? task.workflowTitle : null,
    groupTitle: typeof task.groupTitle === "string" ? task.groupTitle : null,
    secondsToday:
      typeof task.secondsToday === "number" && Number.isFinite(task.secondsToday)
        ? task.secondsToday
        : 0,
    completedAt:
      typeof task.completedAt === "string" ? task.completedAt : null,
  };
}

export function normalizeEntry(
  raw: unknown,
  fallbackDate: string,
): DailyReportEntry {
  const entry =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const tasks = Array.isArray(entry.tasks)
    ? entry.tasks
        .map((task) => normalizeTask(task))
        .filter((task): task is DailyReportTask => task !== null)
    : [];

  return {
    date: typeof entry.date === "string" ? entry.date : fallbackDate,
    cycles:
      typeof entry.cycles === "number" && Number.isFinite(entry.cycles)
        ? entry.cycles
        : 0,
    focusedSeconds:
      typeof entry.focusedSeconds === "number" &&
      Number.isFinite(entry.focusedSeconds)
        ? entry.focusedSeconds
        : 0,
    completedCount:
      typeof entry.completedCount === "number" &&
      Number.isFinite(entry.completedCount)
        ? entry.completedCount
        : 0,
    tasks: tasks,
    namesPurged: entry.namesPurged === true,
  };
}

export function normalizeEntriesByDate(
  raw: unknown,
): Record<string, DailyReportEntry> {
  const normalized: Record<string, DailyReportEntry> = {};
  if (typeof raw !== "object" || raw === null) return normalized;

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "object" || value === null) continue;
    normalized[key] = normalizeEntry(value, key);
  }

  return normalized;
}

export function applyRetention(
  entriesByDate: Record<string, DailyReportEntry>,
  today: Date,
): { entries: Record<string, DailyReportEntry>; changed: boolean } {
  const windowStartKey = getRetentionWindowStartKey(today);
  let changed = false;
  const entries: Record<string, DailyReportEntry> = {};

  for (const [key, entry] of Object.entries(entriesByDate)) {
    const needsPurge =
      entry.date < windowStartKey &&
      (entry.tasks.length > 0 || entry.namesPurged !== true);

    if (needsPurge) {
      changed = true;
      entries[key] = { ...entry, tasks: [], namesPurged: true };
    } else {
      entries[key] = entry;
    }
  }

  if (!changed) {
    return { entries: entriesByDate, changed: false };
  }

  return { entries, changed: true };
}

export function getEntriesInWindow(
  entriesByDate: Record<string, DailyReportEntry>,
  today: Date,
  days: number = RETENTION_DAYS,
): DailyReportEntry[] {
  const startKey = getDayKey(startOfDay(subDays(today, days - 1)));
  const todayKey = getDayKey(today);

  return Object.values(entriesByDate)
    .filter((entry) => entry.date >= startKey && entry.date <= todayKey)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
