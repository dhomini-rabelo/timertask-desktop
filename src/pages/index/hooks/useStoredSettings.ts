import { useEffect, useState } from "react";
import { useSettingsState, type SettingsState } from "../states/settings";

const localStorageKey = "timertasks:settings";

const defaultSettings: SettingsState = {
  projectsEnabled: true,
};

export function useStoredSettings() {
  const projectsEnabled = useSettingsState(
    (props) => props.state.projectsEnabled,
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
    const storedSettings = localStorage.getItem(localStorageKey);
    if (!storedSettings) {
      setSettingsState(defaultSettings);
      setHasHydrated(true);
      return;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings) as SettingsState;
      if (typeof parsedSettings.projectsEnabled !== "boolean") {
        setSettingsState(defaultSettings);
      } else {
        setSettingsState(parsedSettings);
      }
      setHasHydrated(true);
    } catch {
      setSettingsState(defaultSettings);
      setHasHydrated(true);
    }
  }, [setSettingsState]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({ projectsEnabled }),
    );
  }, [hasHydrated, projectsEnabled]);

  return { projectsEnabled, setProjectsEnabled };
}
