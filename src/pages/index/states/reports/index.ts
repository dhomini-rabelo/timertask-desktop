import { create } from "zustand";

export interface DailyReportTask {
  id: string;
  title: string;
  workflowId: string | null;
  workflowTitle: string | null;
  groupTitle: string | null;
  secondsToday: number;
  completedAt: string | null; // ISO string, NUNCA Date
}

export interface DailyReportEntry {
  date: string; // "yyyy-MM-dd" LOCAL
  cycles: number;
  focusedSeconds: number;
  completedCount: number;
  tasks: DailyReportTask[]; // [] depois da retenção
  namesPurged: boolean;
}

export interface ReportsState {
  entriesByDate: Record<string, DailyReportEntry>;
}

interface ReportsActions {
  setEntriesState: (entriesByDate: Record<string, DailyReportEntry>) => void;
  upsertDailyEntry: (date: string, entry: DailyReportEntry) => void;
}

interface ReportsStore {
  state: ReportsState;
  actions: ReportsActions;
}

export const useReportsState = create<ReportsStore>((set, get) => {
  function setState(partial: Partial<ReportsState>) {
    set((store) => ({
      state: {
        entriesByDate: partial.entriesByDate ?? store.state.entriesByDate,
      },
      actions: store.actions,
    }));
  }

  function setEntriesState(entriesByDate: Record<string, DailyReportEntry>) {
    setState({
      entriesByDate: entriesByDate,
    });
  }

  function upsertDailyEntry(date: string, entry: DailyReportEntry) {
    const entriesByDate = get().state.entriesByDate;

    setState({
      entriesByDate: {
        ...entriesByDate,
        [date]: { ...entry, date },
      },
    });
  }

  return {
    state: {
      entriesByDate: {},
    },
    actions: {
      setEntriesState,
      upsertDailyEntry,
    },
  };
});
