import { atom } from "jotai";

interface IndexTasksPageState {
  editingTaskId: string | null;
  insertingBeforeId: string | null;
}

export const indexTasksPageStateAtom = atom<IndexTasksPageState>({
  editingTaskId: null,
  insertingBeforeId: null,
});

export const errorMessageAtom = atom("");
