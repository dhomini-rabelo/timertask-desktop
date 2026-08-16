import type { DailyReportEntry } from "../../../states/reports";
import { IndexReportTaskRow } from "./IndexReportTaskRow";
import {
  formatDayHeading,
  formatDuration,
  getCompletedTasks,
  hasAnyActivity,
} from "./reportsViewUtils";

interface IndexReportsDaySectionProps {
  entry: DailyReportEntry;
  showWorkflowBadge: boolean;
  isToday: boolean;
}

export function IndexReportsDaySection({
  entry,
  showWorkflowBadge,
  isToday,
}: IndexReportsDaySectionProps) {
  const completedTasks = getCompletedTasks(entry);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-Black-700 dark:text-White">
          {formatDayHeading(entry.date, isToday)}
        </span>
        <span className="text-xs text-Black-400">
          {formatDuration(entry.focusedSeconds)} · {entry.cycles} cycles ·{" "}
          {entry.completedCount} done
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {completedTasks.length > 0 ? (
          completedTasks.map((task) => (
            <IndexReportTaskRow
              key={task.id}
              task={task}
              showWorkflowBadge={showWorkflowBadge}
            />
          ))
        ) : entry.namesPurged ? (
          <span className="text-sm text-Black-400">
            Task names are no longer retained for this day.
          </span>
        ) : hasAnyActivity(entry) ? (
          <span className="text-sm text-Black-400">
            No tasks completed on this day.
          </span>
        ) : (
          <span className="text-sm text-Black-400">
            No activity on this day.
          </span>
        )}
      </div>
    </div>
  );
}
