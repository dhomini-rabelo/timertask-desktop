import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../../states/tasks";
import { IndexSubTaskItem } from "./IndexSubTaskItem/IndexSubTaskItem";

interface IndexSortableTaskItemProps {
  task: Task;
  dragHandleProps?: Record<string, unknown>;
}

export function IndexSortableTaskItem({ task }: IndexSortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IndexSubTaskItem
        task={task}
        isActive
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
