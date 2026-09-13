import { useEffect, useRef } from "react";
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
  const hasHydratedRef = useRef<boolean>(false);
  const settingsRef = useRef<SettingsState>({ projectsEnabled });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSettings = localStorage.getItem(localStorageKey);
    if (!storedSettings) {
      setSettingsState(defaultSettings);
      hasHydratedRef.current = true;
      return;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings) as SettingsState;
      if (typeof parsedSettings.projectsEnabled !== "boolean") {
        setSettingsState(defaultSettings);
      } else {
        setSettingsState(parsedSettings);
      }
      hasHydratedRef.current = true;
    } catch {
      setSettingsState(defaultSettings);
      hasHydratedRef.current = true;
    }
  }, [setSettingsState]);

  useEffect(() => {
    settingsRef.current = { projectsEnabled };
  }, [projectsEnabled]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(
      localStorageKey,
      JSON.stringify(settingsRef.current),
    );
  }, [hasHydratedRef, projectsEnabled]);

  return { projectsEnabled, setProjectsEnabled };
}
