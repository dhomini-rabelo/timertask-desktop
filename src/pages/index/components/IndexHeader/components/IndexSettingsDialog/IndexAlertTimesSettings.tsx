import { Star, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../layout/components/atoms/Button";
import { Input } from "../../../../../../layout/components/atoms/Input";
import { useSettingsState } from "../../../../states/settings";
import {
  formatAlertTimeLabel,
  maxAlertTimesCount,
  minAlertTimesCount,
  validateNewAlertTime,
} from "../../../../states/settings/alertTimes";

interface IndexAlertTimesSettingsState {
  newAlertTime: string;
  errorMessage: string | null;
}

export function IndexAlertTimesSettings() {
  const alertTimes = useSettingsState((store) => store.state.alertTimes);
  const defaultAlertTime = useSettingsState(
    (store) => store.state.defaultAlertTime,
  );
  const settingsActions = useSettingsState((store) => store.actions);
  const [state, setState] = useState<IndexAlertTimesSettingsState>({
    newAlertTime: "",
    errorMessage: null,
  });

  const isFull = alertTimes.length >= maxAlertTimesCount;
  const canRemove = alertTimes.length > minAlertTimesCount;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ newAlertTime: event.target.value, errorMessage: null });
  }

  function handleAdd() {
    if (isFull) return;
    const validation = validateNewAlertTime(state.newAlertTime, alertTimes);
    if (!validation.isValid) {
      setState((prev) => ({ ...prev, errorMessage: validation.message }));
      return;
    }

    settingsActions.addAlertTime(validation.minutes);
    setState({ newAlertTime: "", errorMessage: null });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-Black-700 dark:text-White">
            Task alert times
          </span>
          <span className="text-xs text-Black-300 dark:text-Black-400">
            Tap the star to make a time the default.
          </span>
        </div>
        <span className="text-xs text-Black-300 dark:text-Black-400 shrink-0">
          {alertTimes.length} of {maxAlertTimesCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {alertTimes.map((minutes) => {
          const label = formatAlertTimeLabel(minutes);
          const isDefault = minutes === defaultAlertTime;

          if (isDefault) {
            return (
              <span
                key={minutes}
                aria-label={`${label}, default`}
                className="flex h-9 items-center gap-1.5 rounded-full border border-Green-400 bg-Green-400 px-3 text-xs font-semibold text-White"
              >
                <Star className="h-3.5 w-3.5 fill-Yellow-100 text-Yellow-100" />
                {label}
              </span>
            );
          }

          return (
            <span
              key={minutes}
              className="flex h-9 items-center gap-1 rounded-full border border-Black-100 bg-White pl-1.5 pr-1.5 text-xs text-Black-700 dark:border-Black-500 dark:bg-Black-700 dark:text-White"
            >
              <button
                type="button"
                onClick={() => settingsActions.setDefaultAlertTime(minutes)}
                aria-label={`Make ${label} the default`}
                title="Make default"
                className="flex h-6 w-6 items-center justify-center rounded-full text-Black-400 transition-colors hover:bg-Yellow-100 hover:text-Yellow-500 dark:hover:bg-Yellow-400/20"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
              <span>{label}</span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => settingsActions.removeAlertTime(minutes)}
                  aria-label={`Remove ${label}`}
                  title="Remove"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-Black-400 transition-colors hover:bg-Red-100 hover:text-Red-400 dark:hover:bg-Red-400/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Input
            value={state.newAlertTime}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isFull}
            inputMode="numeric"
            aria-label="New alert time in minutes"
            aria-invalid={state.errorMessage !== null}
            placeholder={
              isFull
                ? `Up to ${maxAlertTimesCount} times`
                : "Minutes, e.g. 90"
            }
            className="h-9 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isFull}
            className="h-9 px-4 py-2 text-xs"
          >
            Add
          </Button>
        </div>
        {state.errorMessage && (
          <span role="alert" className="text-xs text-Red-400">
            {state.errorMessage}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-Black-300 dark:text-Black-400">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          Default for new tasks
        </span>
        <span className="flex items-center gap-1">
          <X className="h-3 w-3" />
          Remove
        </span>
      </div>
    </div>
  );
}
