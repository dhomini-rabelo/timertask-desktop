import { ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { SECONDS_PER_MINUTE } from "../../../code/utils/date";
import { Button } from "../../../layout/components/atoms/Button";
import { Timer } from "../../../layout/components/common/Timer";
import { useCountdownTimerState } from "../states/countdownTimer";
import { UpdateTimerDialog } from "./UpdateTimerDialog";

export function IndexTimer() {
  const start = useCountdownTimerState((store) => store.actions.start);
  const stop = useCountdownTimerState((store) => store.actions.stop);
  const reset = useCountdownTimerState((store) => store.actions.reset);
  const goToRest = useCountdownTimerState((store) => store.actions.goToRest);
  const addExtraTime = useCountdownTimerState(
    (store) => store.actions.addExtraTime,
  );
  const currentTimeInSeconds = useCountdownTimerState(
    (store) => store.state.currentTimeInSeconds,
  );
  const isRunning = useCountdownTimerState((store) => store.state.isRunning);
  const isResting = useCountdownTimerState((store) => store.state.isResting);
  const initialMinutes = useCountdownTimerState(
    (store) => store.state.initialMinutes,
  );
  const extraAddedMinutes = useCountdownTimerState(
    (store) => store.state.extraAddedMinutes,
  );
  const [lastExtraAddedMinutes, setLastExtraAddedMinutes] = useState<
    number | undefined
  >(undefined);
  const hasTimerStarted =
    currentTimeInSeconds !== initialMinutes * SECONDS_PER_MINUTE;
  const isFinished = currentTimeInSeconds === 0 && !isRunning;
  const shouldShowSettingsButton =
    !isRunning && !isResting && !hasTimerStarted && !isFinished;

  return (
    <div className="w-64">
      <Timer
        className="w-full h-64 text-6xl"
        timerDisplayInSeconds={currentTimeInSeconds.toString()}
        initialTimeInMinutes={initialMinutes}
        lastExtraAddedMinutes={
          extraAddedMinutes > 0 ? lastExtraAddedMinutes : undefined
        }
        strokeColor={
          isResting ? "var(--color-Blue-400)" : "var(--color-Green-400)"
        }
      />
      <div className="pt-4 flex flex-col gap-4 px-8">
        {isRunning ? (
          <Button
            className="w-full py-2 text-base font-medium"
            variant="danger"
            onClick={stop}
          >
            Stop
          </Button>
        ) : isFinished ? (
          <div className="flex flex-col gap-2 w-full">
            {isResting ? (
              <Button
                className="w-full py-2 text-base font-medium"
                variant="primary"
                onClick={reset}
              >
                Back to Work
              </Button>
            ) : (
              <>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    className="w-full py-2 text-base font-medium"
                    variant="secondary"
                    onClick={goToRest}
                  >
                    Rest
                  </Button>
                  <Button
                    className="w-full py-2 text-base font-medium"
                    variant="primary"
                    onClick={() => {
                      addExtraTime(5);
                      setLastExtraAddedMinutes(5);
                    }}
                  >
                    +5 min
                  </Button>
                  <Button
                    className="w-full py-2 text-base font-medium"
                    variant="primary"
                    onClick={() => {
                      addExtraTime(10);
                      setLastExtraAddedMinutes(10);
                    }}
                  >
                    +10 min
                  </Button>
                  <Button
                    className="w-full py-2 text-base font-medium"
                    variant="primary"
                    onClick={() => {
                      reset();
                    }}
                  >
                    Skip <ArrowRight size={20} />
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 py-2 text-base font-medium"
              variant={isResting ? "secondary" : "primary"}
              onClick={start}
            >
              {isResting
                ? hasTimerStarted
                  ? "Resume"
                  : "Rest"
                : hasTimerStarted
                  ? "Resume"
                  : "Start"}
            </Button>

            {shouldShowSettingsButton ? <UpdateTimerDialog /> : null}

            {hasTimerStarted && (
              <Button
                className="px-2 py-2 text-base font-medium"
                variant="secondary"
                onClick={reset}
              >
                <RotateCcw size={20} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
