import { format, parseISO } from "date-fns";
import type { DailyReportEntry, DailyReportTask } from "../../../states/reports";

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatCompletedAt(completedAt: string | null): string {
  if (!completedAt) {
    return "--:--";
  }

  return new Date(completedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayHeading(date: string, isToday: boolean): string {
  const heading = format(parseISO(date), "EEE, MMM d");
  return isToday ? `${heading} · Today` : heading;
}

export function getCompletedTasks(
  entry: DailyReportEntry | null,
): DailyReportTask[] {
  if (!entry) return [];

  return [...entry.tasks]
    .filter((task) => task.completedAt !== null)
    .sort((a, b) => {
      if (a.completedAt === b.completedAt) return 0;
      return (a.completedAt as string) < (b.completedAt as string) ? -1 : 1;
    });
}

export function hasAnyActivity(entry: DailyReportEntry): boolean {
  return (
    entry.focusedSeconds > 0 || entry.cycles > 0 || entry.completedCount > 0
  );
}

export function shouldShowWorkflowBadge(tasks: DailyReportTask[]): boolean {
  return new Set(tasks.map((task) => task.workflowId ?? "__none__")).size > 1;
}

export function sumEntryTotals(entries: DailyReportEntry[]): {
  focusedSeconds: number;
  cycles: number;
  completedCount: number;
} {
  return entries.reduce(
    (totals, entry) => ({
      focusedSeconds: totals.focusedSeconds + entry.focusedSeconds,
      cycles: totals.cycles + entry.cycles,
      completedCount: totals.completedCount + entry.completedCount,
    }),
    { focusedSeconds: 0, cycles: 0, completedCount: 0 },
  );
}
