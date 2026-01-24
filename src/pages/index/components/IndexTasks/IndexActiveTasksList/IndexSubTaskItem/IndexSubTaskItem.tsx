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
import { useTasksState, type SubTask } from "../../../../states/tasks";
import {
  calculateTotalTimeInSeconds,
  shouldAutoStart,
} from "../../../../states/tasks/utils";
import { errorMessageAtom, indexTasksPageStateAtom } from "../../shared-state";
import { IndexEditInput } from "../shared-components/IndexEditInput";
import { IndexAlertSelect } from "./IndexAlertSelect";
import { IndexDebugTimer, type IndexDebugTimerHandle } from "./IndexDebugTimer";

interface IndexSubTaskItemState {
  alertMinutes: string;
}

interface IndexSubTaskItemProps {
  task: SubTask;
  isActive: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function IndexSubTaskItem({
  task,
  isActive,
  dragHandleProps,
}: IndexSubTaskItemProps) {
  const [indexTasksPageState, setIndexTasksPageState] = useAtom(
    indexTasksPageStateAtom,
  );
  const isEditing = indexTasksPageState.editingTaskId === task?.id;
  const deleteTask = useTasksState((props) => props.actions.deleteSubtask);
  const executeSubTask = useTasksState((props) => props.actions.executeSubtask);
  const stopSubtask = useTasksState((props) => props.actions.stopSubtask);
  const toggleSubtask = useTasksState((props) => props.actions.toggleSubtask);
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
  const [state, setState] = useState<IndexSubTaskItemState>({
    alertMinutes: "5",
  });
  const dispatchErrorMessage = useSetAtom(errorMessageAtom);
  const debuggingTimerRef = useRef<IndexDebugTimerHandle | null>(null);

  function handleToggleSubtaskTimer(isGlobalTimerRunning: boolean) {
    if (!timerState.isRunning) {
      if (isGlobalTimerRunning && !isResting) {
        executeSubTask(task.id);
        timerActions.start();
      } else if (!isResting) {
        dispatchErrorMessage("Global timer is not running");
      }
    } else {
      stopSubtask(task.id);
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
          title: "Task Alert",
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
    const areTheTimersAlreadyInTheSameState =
      timerState.isRunning === isGlobalTimerRunning;

    if (
      isActive &&
      timerState.currentTimeInSeconds > 0 &&
      !areTheTimersAlreadyInTheSameState
    ) {
      handleToggleSubtaskTimer(isGlobalTimerRunning);
    }
  }, [isGlobalTimerRunning]);

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
          isActive
            ? "border-Green-400 bg-Green-50/30 dark:bg-Green-400/10"
            : "border-Black-100/30 hover:border-Green-400/50 dark:border-Black-600"
        }`}
      >
        {isEditing ? (
          <IndexEditInput initialValue={task.title} listingMode="subtasks" />
        ) : (
          <>
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                {!task.isRunning && (
                  <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-Black-400 hover:text-Black-700 dark:hover:text-White transition-colors"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}

                {isActive && (
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
                    : isActive
                      ? "text-Black-700 dark:text-White font-semibold"
                      : "text-Black-500 dark:text-Black-400"
                }`}
              >
                {task.title}
              </span>
            </div>
            <div className="flex items-center">
              {!isActive && (
                <div className="flex items-center mr-2">
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEditTask(task.id)}
                      className="text-Yellow-400 hover:text-Yellow-500 transition-all p-2"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    {!task.isRunning && (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-Red-400 hover:text-Red-500 transition-all p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isActive && (
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      handleToggleSubtaskTimer(isGlobalTimerRunning)
                    }
                    className="text-Green-400 hover:text-Green-500 transition-all p-2"
                  >
                    {timerState.isRunning ? (
                      <Square className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                  </button>

                  {timerState.isRunning && (
                    <button
                      onClick={() => toggleSubtask(task.id)}
                      className="transition-all p-2"
                      title="Mark as complete"
                    >
                      <Check className="w-5 h-5 text-Green-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isEditing && isActive && (
        <div className="flex flex-col gap-2 rounded-xl px-3 py-2 transition-all">
          <div className="flex items-center justify-between transition-all">
            <div className="flex items-center gap-1 transition-all">
              <button
                onClick={() => handleEditTask(task.id)}
                className="text-Yellow-400 hover:text-Yellow-500 transition-all p-2"
              >
                <Pencil className="w-5 h-5" />
              </button>
              {!task.isRunning && (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-Red-400 hover:text-Red-500 transition-all p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            {!task.isRunning && (
              <div className="w-max-content">
                <IndexAlertSelect
                  value={state.alertMinutes}
                  onChange={(value) =>
                    setState((previousState) => ({
                      ...previousState,
                      alertMinutes: value,
                    }))
                  }
                />
              </div>
            )}
            {task.isRunning && (
              <div className="w-full pl-2">
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
