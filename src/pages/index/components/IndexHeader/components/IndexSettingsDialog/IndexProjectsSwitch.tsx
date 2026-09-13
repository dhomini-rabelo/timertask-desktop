import { useStoredSettings } from "../../../../hooks/useStoredSettings";

export function IndexProjectsSwitch() {
  const { projectsEnabled, setProjectsEnabled } = useStoredSettings();

  function handleToggle() {
    setProjectsEnabled(!projectsEnabled);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-Black-700 dark:text-White">
        Projects
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={projectsEnabled}
        onClick={handleToggle}
        className={
          projectsEnabled
            ? "relative flex h-6 w-11 items-center rounded-full bg-Green-500 transition-colors"
            : "relative flex h-6 w-11 items-center rounded-full bg-Black-100 transition-colors dark:bg-Black-600"
        }
      >
        <span
          className={
            projectsEnabled
              ? "inline-block h-5 w-5 translate-x-5 rounded-full bg-White shadow transition-transform"
              : "inline-block h-5 w-5 translate-x-0.5 rounded-full bg-White shadow transition-transform"
          }
        />
      </button>
    </div>
  );
}
