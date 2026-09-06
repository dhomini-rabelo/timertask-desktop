import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  formatClockTime,
  formatClockValue,
  formatTime,
} from "../../../../../code/utils/date";
import type { Task } from "../../../states/tasks";
import {
  calculateTotalTimeInSeconds,
  getTimeRangeFromEvents,
} from "../../../states/tasks/utils";
import { IndexTaskNoteDialog } from "../IndexActiveTasksList/IndexTaskNoteDialog";

interface IndexCompletedTaskItemProps {
  task: Task;
  groupTitle?: string;
}

export function IndexCompletedTaskItem({
  task,
  groupTitle,
}: IndexCompletedTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const taskEvents = task.timeEvents.sort(
    (firstEvent, secondEvent) =>
      new Date(firstEvent.createdAt).getTime() -
      new Date(secondEvent.createdAt).getTime(),
  );
  const taskTimeRange = getTimeRangeFromEvents(taskEvents);
  const totalTimeInSeconds = calculateTotalTimeInSeconds(task.timeEvents);
  const hasTrackedTime = taskEvents.length > 0;

  return (
    <div className="group flex flex-col p-4 rounded-xl bg-white border border-Black-100/30 dark:bg-Black-700 dark:border-Black-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="hidden sm:block w-5 h-5" />
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-Green-500 bg-Green-500 shrink-0">
            <Check className="w-4 h-4 text-White" strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-sm font-medium text-Black-450 dark:text-Black-400 truncate min-w-0"
                title={task.title}
              >
                {task.title}
              </span>
              {groupTitle && (
                <span
                  className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 shrink-0 max-w-[45%] truncate"
                  title={groupTitle}
                >
                  {groupTitle}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-Black-450 dark:text-Black-400">
              {hasTrackedTime ? (
                <>
                  <span className="font-medium whitespace-nowrap">
                    Start {formatClockValue(taskTimeRange.startTime)}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    End {formatClockValue(taskTimeRange.endTime)}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    Duration {formatTime(totalTimeInSeconds)}
                  </span>
                </>
              ) : (
                <span className="font-medium whitespace-nowrap">No time tracked</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IndexTaskNoteDialog taskId={task.id} className="shrink-0" label="" />
          {hasTrackedTime && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-Blue-400 hover:text-Blue-500 transition-colors p-1"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      {isExpanded && hasTrackedTime && (
        <div className="pl-14 pt-2 flex flex-col gap-2">
          {taskEvents.map((event, index) => (
            <div
              key={`${task.id}-${index}`}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-Green-500 bg-Green-500 shrink-0 scale-75">
                <Check className="w-4 h-4 text-White" strokeWidth={3} />
              </div>
              <span className="text-sm text-Black-450 dark:text-Black-400 break-all">
                {event.type} {formatClockTime(new Date(event.createdAt))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
