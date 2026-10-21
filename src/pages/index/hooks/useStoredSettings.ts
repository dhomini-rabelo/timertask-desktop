import { useEffect, useState } from "react";
import { useSettingsState, type SettingsState } from "../states/settings";
import {
  getDefaultAlertTimesSettings,
  parseAlertTimesSettings,
} from "../states/settings/alertTimes";

const localStorageKey = "timertasks:settings";

function getDefaultSettings(): SettingsState {
  return {
    projectsEnabled: true,
    ...getDefaultAlertTimesSettings(),
  };
}

function parseStoredSettings(storedSettings: string | null): SettingsState {
  if (!storedSettings) {
    return getDefaultSettings();
  }

  try {
    const parsed: unknown = JSON.parse(storedSettings);
    if (typeof parsed !== "object" || parsed === null) {
      return getDefaultSettings();
    }

    const parsedSettings = parsed as Record<string, unknown>;

    return {
      projectsEnabled:
        typeof parsedSettings.projectsEnabled === "boolean"
          ? parsedSettings.projectsEnabled
          : true,
      ...parseAlertTimesSettings(parsedSettings),
    };
  } catch {
    return getDefaultSettings();
  }
}

export function readStoredSettings(): SettingsState {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  return parseStoredSettings(localStorage.getItem(localStorageKey));
}

export function useStoredSettings() {
  const projectsEnabled = useSettingsState(
    (props) => props.state.projectsEnabled,
  );
  const alertTimes = useSettingsState((props) => props.state.alertTimes);
  const defaultAlertTime = useSettingsState(
    (props) => props.state.defaultAlertTime,
  );
  const setSettingsState = useSettingsState(
    (props) => props.actions.setSettingsState,
  );
  const setProjectsEnabled = useSettingsState(
    (props) => props.actions.setProjectsEnabled,
  );
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSettingsState(readStoredSettings());
    setHasHydrated(true);
  }, [setSettingsState]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({ projectsEnabled, alertTimes, defaultAlertTime }),
    );
  }, [hasHydrated, projectsEnabled, alertTimes, defaultAlertTime]);

  return { projectsEnabled, setProjectsEnabled };
}
