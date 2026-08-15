import { atom } from "jotai";

interface IndexTasksPageState {
  editingTaskId: string | null;
}

export const indexTasksPageStateAtom = atom<IndexTasksPageState>({
  editingTaskId: null,
});

export const errorMessageAtom = atom("");
