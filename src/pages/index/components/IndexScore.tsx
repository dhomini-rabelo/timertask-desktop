import {
  Award,
  CheckCircle2,
  Clock,
  Hourglass,
  PlayCircle,
  Repeat,
  Sun,
  Zap,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useCountdownTimerState } from "../states/countdownTimer";
import { useTasksState } from "../states/tasks";
import {
  calculateCurrentStreak,
  calculateTasksCompleted,
  calculateTasksInProgress,
  calculateTodayFocusedTime,
  calculateTotalFocusedTime,
  calculateTotalSessions,
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
  const items = useTasksState((store) => store.state.items);

  const todayFocusedTime = calculateTodayFocusedTime(items);
  const totalFocusedTime = calculateTotalFocusedTime(items);
  const totalSessions = calculateTotalSessions(items);
  // Derived from the two values above instead of a separate helper, to
  // avoid re-scanning items to recompute totalFocusedTime/totalSessions.
  const averageSessionTime =
    totalSessions === 0 ? 0 : Math.round(totalFocusedTime / totalSessions);
  const tasksInProgress = calculateTasksInProgress(items);
  const currentStreak = calculateCurrentStreak(items);
  const tasksCompleted = calculateTasksCompleted(items);

  const scoreItems = [
    {
      label: "Today's Focus",
      value: formatDuration(todayFocusedTime),
      icon: Sun,
      color: "text-Yellow-400",
      bg: "bg-Yellow-100",
    },
    {
      label: "Focused Time",
      value: formatDuration(totalFocusedTime),
      icon: Clock,
      color: "text-Blue-400",
      bg: "bg-Blue-100",
    },
    {
      label: "Tasks Started",
      value: totalSessions,
      icon: Hourglass,
      color: "text-Blue-400",
      bg: "bg-Blue-100",
    },
    {
      label: "Avg / task",
      value: formatDuration(averageSessionTime),
      icon: Repeat,
      color: "text-Green-400",
      bg: "bg-Green-100",
    },
    {
      label: "In Progress",
      value: tasksInProgress,
      icon: PlayCircle,
      color: "text-Yellow-400",
      bg: "bg-Yellow-100",
    },
    {
      label: "Tasks Completed",
      value: `${tasksCompleted} tasks`,
      icon: CheckCircle2,
      color: "text-Green-400",
      bg: "bg-Green-100",
    },
    {
      label: "Total cycles",
      value: totalCycles,
      icon: Award,
      color: "text-Green-400",
      bg: "bg-Green-100",
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
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
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
    </div>
  );
}
