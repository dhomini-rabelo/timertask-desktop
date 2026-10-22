import { create } from "zustand";
import { useTasksState } from "../tasks";
import {
  defaultAlertTime,
  defaultAlertTimes,
  maxAlertTimesCount,
  minAlertTimesCount,
  sortAlertTimes,
} from "./alertTimes";

export interface SettingsState {
  projectsEnabled: boolean;
  alertTimes: number[];
  defaultAlertTime: number;
}

interface SettingsActions {
  setSettingsState: (settings: SettingsState) => void;
  setProjectsEnabled: (enabled: boolean) => void;
  addAlertTime: (minutes: number) => void;
  removeAlertTime: (minutes: number) => void;
  setDefaultAlertTime: (minutes: number) => void;
}

interface SettingsStore {
  state: SettingsState;
  actions: SettingsActions;
}

export const useSettingsState = create<SettingsStore>((set, get) => {
  function setState(partial: Partial<SettingsState>) {
    set((store) => ({
      state: {
        projectsEnabled:
          partial.projectsEnabled ?? store.state.projectsEnabled,
        alertTimes: partial.alertTimes ?? store.state.alertTimes,
        defaultAlertTime:
          partial.defaultAlertTime ?? store.state.defaultAlertTime,
      },
      actions: store.actions,
    }));
  }

  function setSettingsState(settings: SettingsState) {
    setState({
      projectsEnabled: settings.projectsEnabled,
      alertTimes: settings.alertTimes,
      defaultAlertTime: settings.defaultAlertTime,
    });
  }

  function setProjectsEnabled(enabled: boolean) {
    setState({
      projectsEnabled: enabled,
    });
  }

  function addAlertTime(minutes: number) {
    const { alertTimes } = get().state;
    if (alertTimes.length >= maxAlertTimesCount) return;
    if (alertTimes.includes(minutes)) return;

    setState({
      alertTimes: sortAlertTimes([...alertTimes, minutes]),
    });
  }

  function removeAlertTime(minutes: number) {
    const { alertTimes, defaultAlertTime } = get().state;
    if (alertTimes.length <= minAlertTimesCount) return;
    if (minutes === defaultAlertTime) return;

    setState({
      alertTimes: alertTimes.filter((alertTime) => alertTime !== minutes),
    });
    useTasksState.getState().actions.resetAlertMinutes(String(minutes));
  }

  function setDefaultAlertTime(minutes: number) {
    if (!get().state.alertTimes.includes(minutes)) return;

    setState({
      defaultAlertTime: minutes,
    });
  }

  return {
    state: {
      projectsEnabled: true,
      alertTimes: [...defaultAlertTimes],
      defaultAlertTime,
    },
    actions: {
      setSettingsState,
      setProjectsEnabled,
      addAlertTime,
      removeAlertTime,
      setDefaultAlertTime,
    },
  };
});
