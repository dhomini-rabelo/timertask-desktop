import { ArrowRight, RotateCcw, Settings } from "lucide-react";
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
  const goBackToWork = useCountdownTimerState(
    (store) => store.actions.goBackToWork,
  );
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasTimerStarted =
    currentTimeInSeconds !== initialMinutes * SECONDS_PER_MINUTE;
  const isFinished = currentTimeInSeconds === 0 && !isRunning;
  const shouldShowSettingsButton =
    !isRunning && !isResting && !hasTimerStarted && !isFinished;
  const isOvertime = !isResting && currentTimeInSeconds <= 0;

  return (
    <div className="w-full lg:w-[200px] shrink-0 flex flex-col items-center gap-3">
      <Timer
        className="h-32 w-32 text-2xl"
        timerDisplayInSeconds={currentTimeInSeconds.toString()}
        initialTimeInMinutes={initialMinutes}
        lastExtraAddedMinutes={
          extraAddedMinutes > 0 ? lastExtraAddedMinutes : undefined
        }
        strokeColor={
          isOvertime
            ? "var(--color-Red-400)"
            : isResting
              ? "var(--color-Blue-400)"
              : "var(--color-Green-400)"
        }
        isOvertime={isOvertime}
      />
      <div className="w-full flex flex-col gap-2">
        {isOvertime ? (
          <div className="flex flex-wrap gap-2 w-full">
            {isRunning ? (
              <Button
                className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
                variant="danger"
                onClick={stop}
              >
                Stop
              </Button>
            ) : (
              <Button
                className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
                variant="primary"
                onClick={start}
              >
                Resume
              </Button>
            )}
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="secondary"
              onClick={goToRest}
            >
              Rest
            </Button>
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="primary"
              onClick={() => {
                addExtraTime(5);
                setLastExtraAddedMinutes(5);
              }}
            >
              +5 min
            </Button>
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="primary"
              onClick={() => {
                addExtraTime(10);
                setLastExtraAddedMinutes(10);
              }}
            >
              +10 min
            </Button>
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="primary"
              onClick={goBackToWork}
            >
              Skip <ArrowRight size={20} />
            </Button>
            <Button
              className="px-2 py-1.5 flex-none shrink-0"
              variant="secondary"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} />
            </Button>
          </div>
        ) : isRunning ? (
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="danger"
              onClick={stop}
            >
              Stop
            </Button>
          </div>
        ) : isFinished ? (
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
              variant="primary"
              onClick={goBackToWork}
            >
              Back to Work
            </Button>
            <Button
              className="px-2 py-1.5 flex-none shrink-0"
              variant="secondary"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              className="flex-1 min-w-[84px] py-1.5 text-sm font-bold"
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

            {shouldShowSettingsButton ? (
              <Button
                className="px-2 py-1.5 flex-none shrink-0"
                variant="secondary"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings size={20} />
              </Button>
            ) : null}

            {hasTimerStarted && (
              <Button
                className="px-2 py-1.5 flex-none shrink-0"
                variant="secondary"
                onClick={reset}
              >
                <RotateCcw size={20} />
              </Button>
            )}
          </div>
        )}
      </div>
      <UpdateTimerDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
