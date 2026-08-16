import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "../../../../../layout/components/atoms/Dialog";
import { useReportsState } from "../../../states/reports";
import { getDayKey, getEntriesInWindow } from "../../../states/reports/utils";
import { IndexReportsDaySection } from "./IndexReportsDaySection";
import { IndexReportTaskRow } from "./IndexReportTaskRow";
import { IndexReportsEmptyState } from "./IndexReportsEmptyState";
import type { IndexReportsTab } from "./IndexReportsTabs";
import { IndexReportsTabs } from "./IndexReportsTabs";
import { IndexReportsTotals } from "./IndexReportsTotals";
import {
  getCompletedTasks,
  shouldShowWorkflowBadge,
} from "./reportsViewUtils";

export function IndexReportsDialog() {
  const entriesByDate = useReportsState((store) => store.state.entriesByDate);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<IndexReportsTab>("today");

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) {
      setActiveTab("today");
    }
  }

  const now = new Date();
  const todayKey = getDayKey(now);
  const todayEntry = entriesByDate[todayKey] ?? null;
  const weekEntries = getEntriesInWindow(entriesByDate, now);

  const todayCompletedTasks = getCompletedTasks(todayEntry);
  const todayShowWorkflowBadge = shouldShowWorkflowBadge(todayCompletedTasks);

  const weekCompletedTasksPool = weekEntries.flatMap((entry) =>
    getCompletedTasks(entry),
  );
  const weekShowWorkflowBadge = shouldShowWorkflowBadge(weekCompletedTasksPool);

  const weekTotals = weekEntries.reduce(
    (totals, entry) => ({
      focusedSeconds: totals.focusedSeconds + entry.focusedSeconds,
      cycles: totals.cycles + entry.cycles,
      completedCount: totals.completedCount + entry.completedCount,
    }),
    { focusedSeconds: 0, cycles: 0, completedCount: 0 },
  );

  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <button
          type="button"
          className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border border-Black-100 bg-White text-Black-500 text-sm font-medium transition-colors hover:bg-Black-100 dark:border-Black-600 dark:bg-Black-700 dark:text-White dark:hover:bg-Black-600"
        >
          <BarChart3 className="w-4 h-4" />
          Reports
        </button>
      </Dialog.Trigger>
      <Dialog.Content
        title="Reports"
        description="Completed tasks, focused time and cycles."
        className="w-[640px] max-h-[80vh] overflow-auto"
      >
        <div className="flex flex-col gap-4">
          <IndexReportsTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">
            {activeTab === "today" ? (
              <>
                <IndexReportsTotals
                  focusedSeconds={todayEntry?.focusedSeconds ?? 0}
                  cycles={todayEntry?.cycles ?? 0}
                  completedCount={todayEntry?.completedCount ?? 0}
                />
                {todayCompletedTasks.length > 0 ? (
                  todayCompletedTasks.map((task) => (
                    <IndexReportTaskRow
                      key={task.id}
                      task={task}
                      showWorkflowBadge={todayShowWorkflowBadge}
                    />
                  ))
                ) : (
                  <IndexReportsEmptyState text="No tasks completed today yet." />
                )}
              </>
            ) : (
              <>
                <IndexReportsTotals
                  focusedSeconds={weekTotals.focusedSeconds}
                  cycles={weekTotals.cycles}
                  completedCount={weekTotals.completedCount}
                />
                {weekEntries.length > 0 ? (
                  weekEntries.map((entry) => (
                    <IndexReportsDaySection
                      key={entry.date}
                      entry={entry}
                      showWorkflowBadge={weekShowWorkflowBadge}
                      isToday={entry.date === todayKey}
                    />
                  ))
                ) : (
                  <IndexReportsEmptyState text="No activity in the last 7 days." />
                )}
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
