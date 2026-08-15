import { useSetAtom } from "jotai";
import { Check, Play, Square } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { formatTime } from "../../../../../../code/utils/date";
import { Button } from "../../../../../../layout/components/atoms/Button";
import { useCountUpTimer } from "../../../../../../layout/components/common/Timer/hooks/useCountUpTimer";
import { errorMessageAtom } from "../../shared-state";

export interface IndexDebugTimerHandle {
  getDebuggingTimeInSeconds: () => number;
}

interface IndexDebugTimerProps {
  isRunning: boolean;
  targetMinutes: number;
}

export const IndexDebugTimer = forwardRef<
  IndexDebugTimerHandle,
  IndexDebugTimerProps
>(function IndexDebugTimer({ isRunning, targetMinutes }, ref) {
  const { actions: timerActions, state: timerState } = useCountUpTimer({
    initialSeconds: 0,
    autoStart: false,
  });
  const targetSeconds = targetMinutes * 60 * 2;
  const hundredPercent = 100;
  const hasValidTargetSeconds = targetSeconds > 0;
  const currentCycleSeconds = hasValidTargetSeconds
    ? timerState.currentTimeInSeconds % targetSeconds
    : 0;
  const rawProgress = hasValidTargetSeconds
    ? (currentCycleSeconds / targetSeconds) * hundredPercent
    : 0;
  const progressPercentage = Math.min(rawProgress, hundredPercent);
  const isActive = timerState.currentTimeInSeconds > 0;
  const dispatchErrorMessage = useSetAtom(errorMessageAtom);

  function handleToggleDebugging() {
    if (!timerState.isRunning) {
      if (isRunning) {
        timerActions.start();
      } else {
        dispatchErrorMessage("Subtask timer is not running");
      }
    } else {
      timerActions.stop();
    }
  }

  function handleResetDebugging() {
    timerActions.reset();
  }

  useEffect(() => {
    const areTheTimersAlreadyInTheSameState =
      timerState.isRunning === isRunning;

    if (
      timerState.currentTimeInSeconds > 0 &&
      !areTheTimersAlreadyInTheSameState
    ) {
      handleToggleDebugging();
    }
  }, [isRunning]);

  useImperativeHandle(
    ref,
    () => ({
      getDebuggingTimeInSeconds: () => timerState.currentTimeInSeconds,
    }),
    [timerState.currentTimeInSeconds],
  );

  return (
    <div className="flex items-center gap-3 bg-Blue-300/10 border border-Blue-400/50 rounded-[10px] px-3 py-2">
      <Button
        variant="secondary"
        onClick={handleToggleDebugging}
        className={`text-xs font-semibold px-3 py-1 rounded-[8px] transition-colors text-Blue-500 dark:text-white bg-White border border-Blue-400 hover:bg-Blue-300/40 ${
          timerState.isRunning ? "" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          {timerState.isRunning ? (
            <Square className="w-4 h-4 fill-current dark:fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-current dark:fill-white" />
          )}
          <span className="text-xs font-medium">Debug</span>
        </div>
      </Button>
      <div className="h-2 w-full rounded-full bg-Black-100/30 overflow-hidden flex-1">
        <div
          className="h-full bg-Blue-400 transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <span className="text-sm font-mono text-Blue-500 dark:text-white tabular-nums">
        {formatTime(timerState.currentTimeInSeconds)}
      </span>
      {isActive && (
        <Button
          variant="secondary"
          onClick={handleResetDebugging}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-[8px] border border-Blue-400 text-Blue-500 dark:text-white bg-White transition-colors hover:bg-Blue-300/40"
        >
          <Check className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});
