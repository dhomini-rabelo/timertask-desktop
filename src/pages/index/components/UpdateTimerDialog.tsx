import type { ChangeEvent } from "react";
import { Dialog } from "../../../layout/components/atoms/Dialog";
import { useCountdownTimerState } from "../states/countdownTimer";

const minimumActivityMinutes = 10;
const maximumActivityMinutes = 50;
const minimumRestPercentage = 20;
const maximumRestPercentage = 50;

function formatMinutes(minutes: number) {
  if (Number.isInteger(minutes)) {
    return minutes.toString();
  }

  return minutes.toFixed(1);
}

type UpdateTimerDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateTimerDialog({
  isOpen,
  onOpenChange,
}: UpdateTimerDialogProps) {
  const activityMinutes = useCountdownTimerState(
    (store) => store.state.activityMinutes,
  );
  const restMinutes = useCountdownTimerState(
    (store) => store.state.restMinutes,
  );
  const percentageOfRestingTime = useCountdownTimerState(
    (store) => store.state.percentageOfRestingTime,
  );
  const updateActivityMinutes = useCountdownTimerState(
    (store) => store.actions.updateActivityMinutes,
  );
  const updatePercentageOfRestingTime = useCountdownTimerState(
    (store) => store.actions.updatePercentageOfRestingTime,
  );

  function handleActivityMinutesChange(event: ChangeEvent<HTMLInputElement>) {
    const nextMinutes = Number(event.target.value);
    updateActivityMinutes(nextMinutes);
  }

  function handleRestPercentageChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPercentage = Number(event.target.value);
    updatePercentageOfRestingTime(nextPercentage);
  }

  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content
        title="Pomodoro settings"
        description="Adjust the activity duration for this cycle."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-medium text-Black-450 dark:text-Black-400">
              <span>Activity time</span>
              <span>{activityMinutes} min</span>
            </div>
            <input
              type="range"
              min={minimumActivityMinutes}
              max={maximumActivityMinutes}
              step={1}
              value={activityMinutes}
              onChange={handleActivityMinutesChange}
              className="w-full accent-Green-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-Black-300">
              <span>{minimumActivityMinutes} min</span>
              <span>{maximumActivityMinutes} min</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-medium text-Black-450 dark:text-Black-400">
              <span>Resting time</span>
              <span>{percentageOfRestingTime}%</span>
            </div>
            <input
              type="range"
              min={minimumRestPercentage}
              max={maximumRestPercentage}
              step={1}
              value={percentageOfRestingTime}
              onChange={handleRestPercentageChange}
              className="w-full accent-Blue-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-Black-300">
              <span>{minimumRestPercentage}%</span>
              <span>{maximumRestPercentage}%</span>
            </div>
          </div>
        </div>
        <Dialog.Footer>
          <div className="flex items-center justify-between text-sm text-Black-300">
            <span>Resting time ({percentageOfRestingTime}%)</span>
            <span>{formatMinutes(restMinutes)} min</span>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
