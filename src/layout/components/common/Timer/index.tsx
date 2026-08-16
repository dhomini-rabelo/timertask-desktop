import { twMerge } from "tailwind-merge";

interface TimerProps {
  className?: string;
  timerDisplayInSeconds: string;
  initialTimeInMinutes: number;
  lastExtraAddedMinutes?: number;
  strokeColor?: string;
  isOvertime?: boolean;
}

function getPercentage(totalSeconds: number, currentSeconds: number) {
  if (totalSeconds <= 0) {
    return 0;
  } else if (currentSeconds <= 0) {
    return Math.min(-currentSeconds / totalSeconds, 1);
  } else if (currentSeconds < totalSeconds) {
    return currentSeconds / totalSeconds;
  } else if (currentSeconds === totalSeconds) {
    return 1;
  } else {
    return (currentSeconds % totalSeconds) / totalSeconds;
  }
}

function getCircleDashoffset(
  initialTimeInMinutes: number,
  timerDisplayInSeconds: string,
  lastExtraAddedMinutes?: number,
) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalMinutes =
    lastExtraAddedMinutes && lastExtraAddedMinutes > 0
      ? lastExtraAddedMinutes
      : initialTimeInMinutes;
  const totalSeconds = totalMinutes * 60;
  const currentSeconds = Number(timerDisplayInSeconds);
  const percentage = getPercentage(totalSeconds, currentSeconds);
  const strokeDashoffset = circumference - percentage * circumference;

  return {
    circumference,
    radius,
    strokeDashoffset,
  };
}

export function Timer({
  className,
  timerDisplayInSeconds,
  initialTimeInMinutes,
  lastExtraAddedMinutes,
  strokeColor,
  isOvertime,
}: TimerProps) {
  const totalSeconds = Number(timerDisplayInSeconds);
  const isNegative = totalSeconds < 0;
  const absoluteSeconds = Math.abs(totalSeconds);
  const minutesLeft = Math.floor(absoluteSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secondsLeft = (absoluteSeconds % 60).toString().padStart(2, "0");
  const { radius, circumference, strokeDashoffset } = getCircleDashoffset(
    initialTimeInMinutes,
    timerDisplayInSeconds,
    lastExtraAddedMinutes,
  );
  const circleStrokeColor = strokeColor ?? "var(--color-Green-400)";

  return (
    <div
      className={twMerge(
        "relative flex items-center justify-center rounded-full bg-White text-Black-700 font-bold shadow-lg dark:bg-Black-800 dark:text-White",
        className,
      )}
    >
      <svg
        className="absolute top-0 left-0 w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={circleStrokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={twMerge(
          "z-10 tabular-nums",
          isOvertime ? "text-Red-500 dark:text-Red-400" : undefined,
        )}
      >{`${isNegative ? "-" : ""}${minutesLeft}:${secondsLeft}`}</span>
    </div>
  );
}
