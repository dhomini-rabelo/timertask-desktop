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
import { useListingTasks } from "../../../../hooks/useListingTasks";
import { useTasksState, type TaskGroup } from "../../../../states/tasks";
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

  const visibleChildren = tasks.filter(
    (task) => task.groupId === group.id && !task.completed
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderItems(active.id as string, over.id as string);
    }
  }

  if (visibleChildren.length === 0) {
    return <p className="text-sm text-Black-400">No tasks yet.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleChildren.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {visibleChildren.map((task) => (
            <IndexSortableTaskItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
