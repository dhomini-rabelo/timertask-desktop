import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskGroup } from "../../../states/tasks";
import { IndexTaskGroup } from "./IndexTaskGroup/IndexTaskGroup";

interface IndexSortableTaskGroupProps {
  group: TaskGroup;
}

export function IndexSortableTaskGroup({ group }: IndexSortableTaskGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IndexTaskGroup
        group={group}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
