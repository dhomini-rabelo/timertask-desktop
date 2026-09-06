import { twMerge } from "tailwind-merge";

interface ProgressBarProps {
  percentage: number;
  label?: string;
  className?: string;
}

export function ProgressBar({
  percentage,
  label = "Progress",
  className,
}: ProgressBarProps) {
  return (
    <div className={twMerge("pt-3", className)}>
      <div className="flex items-center justify-between text-xs text-Black-500 dark:text-Black-400">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">{percentage}%</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-Black-100/50 dark:bg-Black-600">
        <div
          className="h-2 rounded-full bg-Green-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
