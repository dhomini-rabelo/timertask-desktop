import { sendNotification } from "@tauri-apps/plugin-notification";
import { useAtom, useSetAtom } from "jotai";
import {
  Check,
  GripVertical,
  Pencil,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatClockValue, formatTime } from "../../../../../../code/utils/date";
import { Timer } from "../../../../../../layout/components/common/Timer";
import { useCountUpTimer } from "../../../../../../layout/components/common/Timer/hooks/useCountUpTimer";

import { useListingTasks } from "../../../../hooks/useListingTasks";
import { useCountdownTimerState } from "../../../../states/countdownTimer";
import { useTasksState, type Task } from "../../../../states/tasks";
import {
  calculateTotalTimeInSeconds,
  getTimeRangeFromEvents,
  shouldAutoStart,
} from "../../../../states/tasks/utils";
import { errorMessageAtom, indexTasksPageStateAtom } from "../../shared-state";
import { IndexEditInput } from "../shared-components/IndexEditInput";
import { IndexTaskNoteDialog } from "../IndexTaskNoteDialog";
import { IndexAlertSelect } from "./IndexAlertSelect";
import { IndexDebugTimer, type IndexDebugTimerHandle } from "./IndexDebugTimer";

interface IndexTaskItemState {
  alertMinutes: string;
}

interface IndexTaskItemProps {
  task: Task;
  dragHandleProps?: Record<string, unknown>;
}

export function IndexTaskItem({ task, dragHandleProps }: IndexTaskItemProps) {
  const [indexTasksPageState, setIndexTasksPageState] = useAtom(
    indexTasksPageStateAtom,
  );
  const isEditing = indexTasksPageState.editingTaskId === task?.id;
  const deleteTask = useTasksState((props) => props.actions.deleteItem);
  const executeTask = useTasksState((props) => props.actions.executeTask);
  const stopTask = useTasksState((props) => props.actions.stopTask);
  const toggleTask = useTasksState((props) => props.actions.toggleTask);
  const isGlobalTimerRunning = useCountdownTimerState(
    (store) => store.state.isRunning,
  );
  const isResting = useCountdownTimerState((store) => store.state.isResting);
  const { actions: timerActions, state: timerState } = useCountUpTimer({
    initialSeconds: calculateTotalTimeInSeconds(task.timeEvents),
    autoStart:
      isGlobalTimerRunning &&
      !isResting &&
      task.isRunning &&
      shouldAutoStart(task.timeEvents),
  });
  const [state, setState] = useState<IndexTaskItemState>({
    alertMinutes: "5",
  });
  const dispatchErrorMessage = useSetAtom(errorMessageAtom);
  const debuggingTimerRef = useRef<IndexDebugTimerHandle | null>(null);
  const { groups } = useListingTasks();

  const isTimerActive = timerState.isRunning;
  const hasBeenStarted = task.timeEvents.some(
    (event) => event.type === "start",
  );
  const isGlobalActive = isGlobalTimerRunning && !isResting;
  const wasAutoPausedRef = useRef(false);
  const groupTitle = task.groupId
    ? groups.find((group) => group.id === task.groupId)?.title
    : undefined;
  const taskTimeRange = getTimeRangeFromEvents(task.timeEvents);
  const totalTimeInSeconds = calculateTotalTimeInSeconds(task.timeEvents);

  function handleToggleTaskTimer(isGlobalTimerRunning: boolean) {
    wasAutoPausedRef.current = false;
    if (!timerState.isRunning) {
      if (isGlobalTimerRunning && !isResting) {
        executeTask(task.id);
        timerActions.start();
      } else if (!isResting) {
        dispatchErrorMessage("Global timer is not running");
      }
    } else {
      stopTask(task.id);
      timerActions.stop();
    }
  }

  function playAlertSound(currentTimeInSeconds: number) {
    const debuggingTimeInSeconds =
      debuggingTimerRef.current?.getDebuggingTimeInSeconds() ?? 0;

    const alarmAudio = new Audio("/alarm-loop.mp3");
    const restartPositionInSeconds = 0;
    alarmAudio.currentTime = restartPositionInSeconds;
    alarmAudio
      .play()
      .catch(() => {})
      .then(() => {
        sendNotification({
          title: `Task: ${task.title}`,
          body: `Time: ${formatTime(currentTimeInSeconds)}${
            debuggingTimeInSeconds > 0
              ? ` | Debug: ${formatTime(debuggingTimeInSeconds)}`
              : ""
          }`,
        });
      });
  }

  function handleEditTask(taskId: string) {
    setIndexTasksPageState((prev) => ({
      ...prev,
      editingTaskId: taskId,
    }));
  }

  useEffect(() => {
    if (!isGlobalActive) {
      if (timerState.isRunning) {
        stopTask(task.id);
        timerActions.stop();
        wasAutoPausedRef.current = true;
      }
      return;
    }
    if (wasAutoPausedRef.current && !timerState.isRunning) {
      executeTask(task.id);
      timerActions.start();
    }
    wasAutoPausedRef.current = false;
  }, [isGlobalActive]);

  useEffect(() => {
    const alertTimerInSeconds = Number(state.alertMinutes) * 60;
    const isAlertTimerReached =
      timerState.currentTimeInSeconds === alertTimerInSeconds;
    const hasAlertTimeBeenReachedAndPassedHalfWayToTheNextAlertTime =
      timerState.currentTimeInSeconds > alertTimerInSeconds
        ? timerState.currentTimeInSeconds % alertTimerInSeconds ===
          alertTimerInSeconds / 2
        : false;
    const hasAlertTimeBeenReachedAndAnotherAlertTimeIsPassed =
      timerState.currentTimeInSeconds > alertTimerInSeconds
        ? timerState.currentTimeInSeconds % alertTimerInSeconds === 0
        : false;
    const shouldPlayAlert =
      isAlertTimerReached ||
      hasAlertTimeBeenReachedAndPassedHalfWayToTheNextAlertTime ||
      hasAlertTimeBeenReachedAndAnotherAlertTimeIsPassed;
    if (shouldPlayAlert) {
      playAlertSound(timerState.currentTimeInSeconds);
    }
  }, [timerState.currentTimeInSeconds, state.alertMinutes]);

  return (
    <div className="group space-y-0 bg-Black-100/50 border border-Black-300/15 rounded-xl dark:bg-Black-700/50 dark:border-Black-600">
      <div
        className={`flex items-center justify-between p-4 rounded-xl bg-white border transition-all shadow-sm hover:shadow-md dark:bg-Black-700 ${
          isTimerActive
            ? "border-Green-400 bg-Green-50/30 dark:bg-Green-400/10"
            : "border-Black-100/30 hover:border-Green-400/50 dark:border-Black-600"
        }`}
      >
        {isEditing ? (
          <IndexEditInput initialValue={task.title} />
        ) : (
          <>
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                {!isTimerActive && (
                  <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-Black-400 hover:text-Black-700 dark:hover:text-White transition-colors"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}

                {hasBeenStarted && (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16">
                      <Timer
                        className="w-full h-full text-xs"
                        timerDisplayInSeconds={timerState.currentTimeInSeconds.toString()}
                        initialTimeInMinutes={Number(state.alertMinutes)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <span
                className={`text-sm font-medium transition-colors break-all ${
                  task.completed
                    ? "text-Black-400 line-through"
                    : isTimerActive
                      ? "text-Black-700 dark:text-White font-semibold"
                      : "text-Black-500 dark:text-Black-400"
                }`}
              >
                {task.title}
              </span>
              {groupTitle && (
                <span className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all text-xs">
                  {groupTitle}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleToggleTaskTimer(isGlobalTimerRunning)}
                className="text-Green-400 hover:text-Green-500 transition-all p-2"
              >
                {timerState.isRunning ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              {isTimerActive && (
                <button
                  onClick={() => toggleTask(task.id)}
                  className="transition-all p-2"
                  title="Mark as complete"
                >
                  <Check className="w-5 h-5 text-Green-400" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {!isEditing && hasBeenStarted && (
        <div className="flex items-center px-3 py-1.5">
          <div className="flex items-center gap-2 text-xs text-Black-400">
            <span className="font-medium">
              Start {formatClockValue(taskTimeRange.startTime)}
            </span>
            <span className="font-medium">
              End {formatClockValue(taskTimeRange.endTime)}
            </span>
            <span className="font-medium">
              Duration {formatTime(totalTimeInSeconds)}
            </span>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-all">
          <div className="flex items-center gap-1 transition-all shrink-0">
            <button
              onClick={() => handleEditTask(task.id)}
              className="text-Yellow-400 hover:text-Yellow-500 transition-all p-2"
            >
              <Pencil className="w-5 h-5" />
            </button>
            {!isTimerActive && (
              <button
                onClick={() => deleteTask(task.id)}
                className="text-Red-400 hover:text-Red-500 transition-all p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <IndexTaskNoteDialog taskId={task.id} label="Notes" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <IndexAlertSelect
              value={state.alertMinutes}
              onChange={(value) =>
                setState((previousState) => ({
                  ...previousState,
                  alertMinutes: value,
                }))
              }
            />
            {hasBeenStarted && (
              <div className="flex-1 min-w-0">
                <IndexDebugTimer
                  ref={debuggingTimerRef}
                  isRunning={timerState.isRunning}
                  targetMinutes={Number(state.alertMinutes)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
