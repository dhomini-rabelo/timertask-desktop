import { create } from "zustand";

export interface SettingsState {
  projectsEnabled: boolean;
}

interface SettingsActions {
  setSettingsState: (settings: SettingsState) => void;
  setProjectsEnabled: (enabled: boolean) => void;
}

interface SettingsStore {
  state: SettingsState;
  actions: SettingsActions;
}

export const useSettingsState = create<SettingsStore>((set) => {
  function setState(partial: Partial<SettingsState>) {
    set((store) => ({
      state: {
        projectsEnabled:
          partial.projectsEnabled ?? store.state.projectsEnabled,
      },
      actions: store.actions,
    }));
  }

  function setSettingsState(settings: SettingsState) {
    setState({
      projectsEnabled: settings.projectsEnabled,
    });
  }

  function setProjectsEnabled(enabled: boolean) {
    setState({
      projectsEnabled: enabled,
    });
  }

  return {
    state: {
      projectsEnabled: true,
    },
    actions: {
      setSettingsState,
      setProjectsEnabled,
    },
  };
});
