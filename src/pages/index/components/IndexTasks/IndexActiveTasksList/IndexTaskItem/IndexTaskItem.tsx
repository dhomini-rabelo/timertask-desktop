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
import { formatTime } from "../../../../../../code/utils/date";
import { Timer } from "../../../../../../layout/components/common/Timer";
import { useCountUpTimer } from "../../../../../../layout/components/common/Timer/hooks/useCountUpTimer";

import { useCountdownTimerState } from "../../../../states/countdownTimer";
import { useTasksState, type Task } from "../../../../states/tasks";
import {
  calculateTotalTimeInSeconds,
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

  const isTimerActive = timerState.isRunning;
  const hasBeenStarted = task.timeEvents.some(
    (event) => event.type === "start",
  );
  const isGlobalActive = isGlobalTimerRunning && !isResting;
  const wasAutoPausedRef = useRef(false);

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
    <div
      className={`group rounded-xl border bg-White shadow-sm hover:shadow-md transition-all overflow-hidden dark:bg-Black-700 dark:border-Black-600 ${
        isTimerActive
          ? "border-Green-400 dark:border-Green-400"
          : "border-Black-100 hover:border-Green-400/50"
      }`}
    >
      <div
        className={`flex items-center justify-between p-3 sm:p-4 transition-all ${
          isTimerActive ? "bg-Green-400/5 dark:bg-Green-400/10" : ""
        }`}
      >
        {isEditing ? (
          <IndexEditInput initialValue={task.title} />
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {!isTimerActive && (
                  <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-Black-450 dark:text-Black-400 hover:text-Black-700 dark:hover:text-White transition-colors"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}

                {hasBeenStarted && (
                  <div className="relative w-14 h-14 shrink-0">
                    <Timer
                      className="w-full h-full text-[11px]"
                      timerDisplayInSeconds={timerState.currentTimeInSeconds.toString()}
                      initialTimeInMinutes={Number(state.alertMinutes)}
                    />
                  </div>
                )}
              </div>

              <span
                className={`text-sm font-medium transition-colors truncate min-w-0 ${
                  task.completed
                    ? "text-Black-450 dark:text-Black-400 line-through"
                    : isTimerActive
                      ? "text-Black-700 dark:text-White font-semibold"
                      : "text-Black-500 dark:text-Black-400"
                }`}
                title={task.title}
              >
                {task.title}
              </span>
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

      {!isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-Black-100/60 dark:border-Black-600 transition-all">
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
            <IndexTaskNoteDialog taskId={task.id} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 min-w-0 grow">
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
              <div className="w-full sm:w-auto min-w-0">
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
