import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useListingTasks } from "../../../../hooks/useListingTasks";
import { useTasksState, type Task, type TaskGroup } from "../../../../states/tasks";
import {
  bucketByActivityStatus,
  getGroupChildren,
  getTaskActivityStatus,
} from "../../../../states/tasks/utils";
import type { TaskActivityStatus } from "../../../../states/tasks/utils";
import { IndexTasksSection } from "../shared-components/IndexTasksSection";
import { IndexSortableTaskItem } from "../IndexSortableTaskItem";

interface IndexGroupTasksListProps {
  group: TaskGroup;
}

export function IndexGroupTasksList({ group }: IndexGroupTasksListProps) {
  const reorderItems = useTasksState((props) => props.actions.reorderItems);
  const { tasks } = useListingTasks();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const children = getGroupChildren(tasks, group.id).filter(
    (task) => !task.completed,
  );
  const {
    active: activeSectionItems,
    paused: pausedSectionItems,
    pending: pendingSectionItems,
  } = bucketByActivityStatus(children, getTaskActivityStatus);

  const sectionByItemId = new Map<string, TaskActivityStatus>();
  activeSectionItems.forEach((item) => sectionByItemId.set(item.id, "active"));
  pausedSectionItems.forEach((item) => sectionByItemId.set(item.id, "paused"));
  pendingSectionItems.forEach((item) =>
    sectionByItemId.set(item.id, "pending"),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeSection = sectionByItemId.get(active.id as string);
    const overSection = sectionByItemId.get(over.id as string);

    if (!activeSection || activeSection !== overSection) {
      return;
    }

    reorderItems(active.id as string, over.id as string);
  }

  if (children.length === 0) {
    return (
      <p className="text-sm text-Black-450 dark:text-Black-400">
        No tasks yet.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-2 py-1"
        tabIndex={0}
        role="region"
        aria-label={`${group.title} subtasks`}
      >
        <IndexTasksSection
          status="active"
          label="Active"
          items={activeSectionItems}
          groupId={group.id}
          layout="list"
          renderItem={(item) => (
            <IndexSortableTaskItem key={item.id} task={item as Task} />
          )}
        />

        <IndexTasksSection
          status="paused"
          label="Paused"
          items={pausedSectionItems}
          groupId={group.id}
          layout="list"
          renderItem={(item) => (
            <IndexSortableTaskItem key={item.id} task={item as Task} />
          )}
        />

        <IndexTasksSection
          status="pending"
          label="Pending"
          items={pendingSectionItems}
          groupId={group.id}
          layout="list"
          renderItem={(item) => (
            <IndexSortableTaskItem key={item.id} task={item as Task} />
          )}
        />
      </div>
    </DndContext>
  );
}
