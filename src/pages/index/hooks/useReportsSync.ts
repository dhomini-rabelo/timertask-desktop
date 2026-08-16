import { useEffect, useRef } from "react";
import { useReportsState } from "../states/reports";
import { buildDailyEntry, buildTodayTasks, areEntriesEqual } from "../states/reports/sync";
import { getDayKey } from "../states/reports/utils";
import { useCountdownTimerState } from "../states/countdownTimer";
import { useTasksState } from "../states/tasks";
import { useWorkflowsState } from "../states/workflows";

export function useReportsSync(): void {
  const items = useTasksState((store) => store.state.items);
  const workflows = useWorkflowsState((store) => store.state.workflows);
  const totalCycles = useCountdownTimerState((store) => store.state.totalCycles);
  const upsertDailyEntry = useReportsState((store) => store.actions.upsertDailyEntry);

  const previousTotalCyclesRef = useRef<number | null>(null);
  const cyclesAccumulatedRef = useRef<number>(0);
  const syncedDayKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const dayKey = getDayKey(now);

    const existing = useReportsState.getState().state.entriesByDate[dayKey] ?? null;

    if (syncedDayKeyRef.current !== dayKey) {
      cyclesAccumulatedRef.current = existing?.cycles ?? 0;
      previousTotalCyclesRef.current = totalCycles;
      syncedDayKeyRef.current = dayKey;
    }

    cyclesAccumulatedRef.current = Math.max(
      cyclesAccumulatedRef.current,
      existing?.cycles ?? 0,
    );

    const previous = previousTotalCyclesRef.current;
    if (previous !== null && totalCycles > previous) {
      cyclesAccumulatedRef.current += totalCycles - previous;
    }
    previousTotalCyclesRef.current = totalCycles;

    const liveTasks = buildTodayTasks(items, workflows, now);
    const nextEntry = buildDailyEntry(
      dayKey,
      existing,
      liveTasks,
      cyclesAccumulatedRef.current,
    );

    if (existing === null && nextEntry.tasks.length === 0 && nextEntry.cycles === 0) {
      return;
    }

    if (areEntriesEqual(existing, nextEntry)) {
      return;
    }

    upsertDailyEntry(dayKey, nextEntry);
  }, [items, workflows, totalCycles, upsertDailyEntry]);
}
