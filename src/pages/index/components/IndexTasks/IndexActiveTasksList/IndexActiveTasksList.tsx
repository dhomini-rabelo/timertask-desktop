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
import { useListingTasks } from "../../../hooks/useListingTasks";
import { isTaskGroup, type TaskItem, useTasksState } from "../../../states/tasks";
import type { TaskActivityStatus } from "../../../states/tasks/utils";
import { IndexTasksSection } from "./shared-components/IndexTasksSection";
import { IndexSortableTaskGroup } from "./IndexSortableTaskGroup";
import { IndexSortableTaskItem } from "./IndexSortableTaskItem";

function renderSectionItem(item: TaskItem) {
  return isTaskGroup(item) ? (
    <IndexSortableTaskGroup key={item.id} group={item} />
  ) : (
    <IndexSortableTaskItem key={item.id} task={item} />
  );
}

export function IndexActiveTasksList() {
  const reorderItems = useTasksState((props) => props.actions.reorderItems);
  const { activeSectionItems, pausedSectionItems, pendingSectionItems } =
    useListingTasks();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <IndexTasksSection
        status="active"
        label="Active"
        items={activeSectionItems}
        groupId={null}
        layout="grid"
        renderItem={renderSectionItem}
      />

      <IndexTasksSection
        status="paused"
        label="Paused"
        items={pausedSectionItems}
        groupId={null}
        layout="grid"
        renderItem={renderSectionItem}
      />

      <IndexTasksSection
        status="pending"
        label="Pending"
        items={pendingSectionItems}
        groupId={null}
        layout="grid"
        renderItem={renderSectionItem}
      />
    </DndContext>
  );
}
