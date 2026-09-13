import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Fragment, type ReactNode } from "react";
import type { TaskItem } from "../../../../states/tasks";
import type { TaskActivityStatus } from "../../../../states/tasks/utils";
import { IndexInsertTaskPoint } from "./IndexInsertTaskPoint";

interface IndexTasksSectionProps {
  status: TaskActivityStatus;
  label: string;
  items: TaskItem[];
  groupId: string | null;
  layout: "grid" | "list";
  renderItem: (item: TaskItem) => ReactNode;
}

export function IndexTasksSection({
  status,
  label,
  items,
  groupId,
  layout,
  renderItem,
}: IndexTasksSectionProps) {
  if (items.length === 0) {
    return null;
  }

  const wrapperClassName =
    layout === "grid"
      ? "grid grid-cols-1 lg:grid-cols-2 gap-3 items-start"
      : "flex flex-col gap-3";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-bold uppercase tracking-tight text-Black-450 dark:text-Black-400">
        {label}
      </span>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={wrapperClassName} data-tasks-section={status}>
          {items.map((item) => (
            <Fragment key={item.id}>
              <IndexInsertTaskPoint
                groupId={groupId}
                beforeId={item.id}
                status={status}
                className={layout === "grid" ? "col-span-full" : undefined}
              />
              {renderItem(item)}
            </Fragment>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
