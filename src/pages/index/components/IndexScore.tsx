import { Award, CheckCircle2, Clock, Zap } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Box } from "../../../layout/components/atoms/Box";
import { useCountdownTimerState } from "../states/countdownTimer";
import { useTasksState } from "../states/tasks";
import {
  calculateCurrentStreak,
  calculateTasksCompleted,
  calculateTotalFocusedTime,
} from "../states/tasks/scoreUtils";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function IndexScore() {
  const totalCycles = useCountdownTimerState(
    (store) => store.state.totalCycles,
  );
  const tasks = useTasksState((store) => store.state.tasks);

  const totalFocusedTime = calculateTotalFocusedTime(tasks);
  const currentStreak = calculateCurrentStreak(tasks);
  const tasksCompleted = calculateTasksCompleted(tasks);

  const scoreItems = [
    {
      label: "Total cycles",
      value: totalCycles,
      icon: Award,
      color: "text-Green-400",
      bg: "bg-Green-100",
    },
    {
      label: "Tasks Completed",
      value: `${tasksCompleted} tasks`,
      icon: CheckCircle2,
      color: "text-Green-400",
      bg: "bg-Green-100",
    },
    {
      label: "Focused Time",
      value: formatDuration(totalFocusedTime),
      icon: Clock,
      color: "text-Blue-400",
      bg: "bg-Blue-100",
    },
    {
      label: "Current Streak",
      value: `${currentStreak} days`,
      icon: Zap,
      color: "text-Red-400",
      bg: "bg-Red-100",
    },
  ];

  return (
    <Box className="w-96 px-6 py-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8">
        {scoreItems.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 items-start">
            <div className="flex items-center gap-2">
              <div
                className={twMerge(
                  "flex items-center justify-center rounded-lg p-1.5 shadow-sm ring-1 ring-black/5 dark:ring-white/20",
                  item.color,
                  item.bg,
                  "dark:bg-transparent",
                )}
              >
                <item.icon size={14} />
              </div>
              <span className="text-[10px] font-bold text-Black-450 uppercase tracking-tight dark:text-Black-400">
                {item.label}
              </span>
            </div>
            <div className="pl-0.5">
              <span className="text-xl font-bold text-Black-700 dark:text-White">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Box>
  );
}
