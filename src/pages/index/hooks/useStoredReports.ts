import { useEffect, useRef } from "react";
import { useReportsState, type DailyReportEntry } from "../states/reports";
import { applyRetention, normalizeEntriesByDate } from "../states/reports/utils";

const localStorageKey = "timertasks:reports";

export function useStoredReports() {
  const entriesByDate = useReportsState((props) => props.state.entriesByDate);
  const setEntriesState = useReportsState(
    (props) => props.actions.setEntriesState,
  );
  const hasHydratedRef = useRef<boolean>(false);
  const entriesRef = useRef<Record<string, DailyReportEntry>>(entriesByDate);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedEntries = localStorage.getItem(localStorageKey);
    if (!storedEntries) {
      setEntriesState({});
      hasHydratedRef.current = true;
      entriesRef.current = {};
      return;
    }

    try {
      const parsedEntries = JSON.parse(storedEntries);
      const normalizedEntries = normalizeEntriesByDate(parsedEntries);
      const { entries } = applyRetention(normalizedEntries, new Date());

      setEntriesState(entries);
      hasHydratedRef.current = true;
      entriesRef.current = entries;
    } catch {
      setEntriesState({});
      hasHydratedRef.current = true;
      entriesRef.current = {};
    }
  }, [setEntriesState]);

  useEffect(() => {
    entriesRef.current = entriesByDate;
  }, [entriesByDate]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(
      localStorageKey,
      JSON.stringify(entriesRef.current),
    );
  }, [hasHydratedRef, entriesByDate]);

  return entriesByDate;
}
