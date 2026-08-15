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
import { useTasksState } from "../../../states/tasks";
import { IndexSortableTaskItem } from "./IndexSortableTaskItem";

export function IndexActiveTasksList() {
  const reorderItems = useTasksState((props) => props.actions.reorderItems);
  const { activeTasks } = useListingTasks();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderItems(active.id as string, over.id as string);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activeTasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {activeTasks.map((task) => (
          <IndexSortableTaskItem key={task.id} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
