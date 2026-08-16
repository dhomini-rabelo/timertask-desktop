import { formatTime } from "../../../../../code/utils/date";
import type { DailyReportTask } from "../../../states/reports";
import { formatCompletedAt } from "./reportsViewUtils";

interface IndexReportTaskRowProps {
  task: DailyReportTask;
  showWorkflowBadge: boolean;
}

export function IndexReportTaskRow({
  task,
  showWorkflowBadge,
}: IndexReportTaskRowProps) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border border-Black-100/30 dark:bg-Black-700 dark:border-Black-600">
      <span className="text-sm font-medium text-Black-450 dark:text-Black-400 break-all">
        {task.title}
      </span>
      <div className="flex items-center flex-wrap gap-2 text-xs text-Black-400">
        {task.groupTitle && (
          <span className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all">
            {task.groupTitle}
          </span>
        )}
        {showWorkflowBadge && task.workflowTitle && (
          <span className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all">
            {task.workflowTitle}
          </span>
        )}
        <span className="font-medium">
          Done {formatCompletedAt(task.completedAt)}
        </span>
        <span className="font-medium">
          Duration {formatTime(task.secondsToday)}
        </span>
      </div>
    </div>
  );
}
