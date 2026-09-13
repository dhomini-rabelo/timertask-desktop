import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Input } from "../../../../../../layout/components/atoms/Input";
import { useStoredSettings } from "../../../../hooks/useStoredSettings";
import { useProjectsState } from "../../../../states/projects";
import { useTasksState } from "../../../../states/tasks";
import type { TaskActivityStatus } from "../../../../states/tasks/utils";
import { indexTasksPageStateAtom } from "../../shared-state";

const idleCloseDelayInMilliseconds = 20000;

interface IndexInsertTaskPointProps {
  groupId: string | null;
  beforeId: string;
  status: TaskActivityStatus;
  className?: string;
}

export function IndexInsertTaskPoint({
  groupId,
  beforeId,
  status,
  className,
}: IndexInsertTaskPointProps) {
  const insertTask = useTasksState((props) => props.actions.insertTask);
  const executeTask = useTasksState((props) => props.actions.executeTask);
  const stopTask = useTasksState((props) => props.actions.stopTask);
  const projects = useProjectsState((props) => props.state.projects);
  const selectedProjectId = useProjectsState(
    (props) => props.state.selectedProjectId,
  );
  const { projectsEnabled } = useStoredSettings();
  const [indexTasksPageState, setIndexTasksPageState] = useAtom(
    indexTasksPageStateAtom,
  );
  const [title, setTitle] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = indexTasksPageState.insertingBeforeId === beforeId;

  // Closes when another gap opens (RT-017), on timeout (RT-012), or via blur/Esc:
  // always reopens blank next time, never with text left over from a previous session.
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setInteractionTick(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || title.trim()) {
      return;
    }

    const timeout = setTimeout(() => {
      setIndexTasksPageState((prev) =>
        prev.insertingBeforeId === beforeId
          ? { ...prev, insertingBeforeId: null }
          : prev,
      );
    }, idleCloseDelayInMilliseconds);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, title, interactionTick, beforeId]);

  function open() {
    setIndexTasksPageState((prev) => ({
      ...prev,
      insertingBeforeId: beforeId,
    }));
  }

  function close() {
    setIndexTasksPageState((prev) => ({
      ...prev,
      insertingBeforeId: null,
    }));
  }

  function registerInteraction() {
    setInteractionTick((tick) => tick + 1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
  }

  function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const selectedProject = projectsEnabled
      ? projects.find((project) => project.id === selectedProjectId)
      : undefined;
    const composedTitle = selectedProject
      ? `[${selectedProject.title}] ${trimmedTitle}`
      : trimmedTitle;

    const newTaskId = insertTask(composedTitle, groupId, beforeId);
    if (newTaskId) {
      if (status === "active") {
        executeTask(newTaskId);
      } else if (status === "paused") {
        executeTask(newTaskId);
        stopTask(newTaskId);
      }
    }

    setTitle("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    registerInteraction();

    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      close();
    }
  }

  function handleClick() {
    registerInteraction();
  }

  function handleBlur() {
    if (!title.trim()) {
      close();
    }
  }

  if (!isOpen) {
    return (
      <div
        className={twMerge(
          "group relative h-2 hover:h-9 transition-all",
          className,
        )}
      >
        <button
          type="button"
          onClick={open}
          className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-Black-450 hover:text-Green-400 dark:text-Black-400 transition-opacity"
        >
          + adicionar task
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
        placeholder="Add a task..."
        className="h-9"
      />
    </div>
  );
}
