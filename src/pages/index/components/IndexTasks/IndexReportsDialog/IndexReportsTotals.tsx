import { CheckCircle2, Clock, Zap } from "lucide-react";
import { formatDuration } from "./reportsViewUtils";

interface IndexReportsTotalsProps {
  focusedSeconds: number;
  cycles: number;
  completedCount: number;
}

export function IndexReportsTotals({
  focusedSeconds,
  cycles,
  completedCount,
}: IndexReportsTotalsProps) {
  const tiles = [
    {
      key: "focused",
      icon: Clock,
      label: "Focused",
      value: formatDuration(focusedSeconds),
    },
    {
      key: "cycles",
      icon: Zap,
      label: "Cycles",
      value: cycles,
    },
    {
      key: "completed",
      icon: CheckCircle2,
      label: "Completed",
      value: completedCount,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="flex flex-col gap-1 p-3 rounded-xl bg-Black-100/30 dark:bg-Black-700"
        >
          <span className="text-xs text-Black-400 flex items-center gap-1.5">
            <tile.icon className="w-3.5 h-3.5" />
            {tile.label}
          </span>
          <span className="text-lg font-bold text-Black-700 dark:text-White">
            {tile.value}
          </span>
        </div>
      ))}
    </div>
  );
}
