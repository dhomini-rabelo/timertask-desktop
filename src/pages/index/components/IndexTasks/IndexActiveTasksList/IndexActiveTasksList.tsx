import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useListingTasks } from "../../../hooks/useListingTasks";
import { isTaskGroup, type TaskItem, useTasksState } from "../../../states/tasks";
import type { TaskActivityStatus } from "../../../states/tasks/utils";
import { IndexSortableTaskGroup } from "./IndexSortableTaskGroup";
import { IndexSortableTaskItem } from "./IndexSortableTaskItem";

function renderSectionItems(items: TaskItem[]) {
  return items.map((item) =>
    isTaskGroup(item) ? (
      <IndexSortableTaskGroup key={item.id} group={item} />
    ) : (
      <IndexSortableTaskItem key={item.id} task={item} />
    ),
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
      {activeSectionItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-tight text-Black-450 dark:text-Black-400">
            Active
          </span>
          <div
            className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1"
            tabIndex={0}
            role="region"
            aria-label="Active tasks"
          >
            <SortableContext
              items={activeSectionItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {renderSectionItems(activeSectionItems)}
            </SortableContext>
          </div>
        </div>
      )}

      {pausedSectionItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-tight text-Black-450 dark:text-Black-400">
            Paused
          </span>
          <SortableContext
            items={pausedSectionItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {renderSectionItems(pausedSectionItems)}
          </SortableContext>
        </div>
      )}

      {pendingSectionItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-tight text-Black-450 dark:text-Black-400">
            Pending
          </span>
          <SortableContext
            items={pendingSectionItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {renderSectionItems(pendingSectionItems)}
          </SortableContext>
        </div>
      )}
    </DndContext>
  );
}
