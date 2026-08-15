import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../../states/tasks";
import { IndexTaskItem } from "./IndexTaskItem/IndexTaskItem";

interface IndexSortableTaskItemProps {
  task: Task;
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
      <IndexTaskItem
        task={task}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
