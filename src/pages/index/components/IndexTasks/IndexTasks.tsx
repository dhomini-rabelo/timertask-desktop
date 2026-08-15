import { Box } from "../../../../layout/components/atoms/Box";
import { useListingTasks } from "../../hooks/useListingTasks";
import { useStoredTasks } from "../../hooks/useStoredTasks";
import { IndexActiveTasksList } from "./IndexActiveTasksList/IndexActiveTasksList";
import { IndexAddInput } from "./IndexAddInput";
import { IndexErrorMessage } from "./IndexErrorMessage";
import { IndexFooter } from "./IndexFooter/IndexFooter";

export function IndexTasks() {
  useStoredTasks();
  const { activeTasks, tasks } = useListingTasks();

  return (
    <Box className="w-full max-w-[600px] ml-auto p-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-Black-700 dark:text-White flex items-center gap-1.5">
          Tasks
        </h2>
        <p className="text-Black-300 dark:text-Black-400 text-sm">
          Manage your daily tasks efficiently, keep track of debugging time, and
          avoid wasting time on easy tasks.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <IndexAddInput />

        <IndexErrorMessage />

        <div className="flex flex-col gap-3 max-h-[calc(100vh-400px)] min-h-[250px] overflow-y-auto">
          {activeTasks.length === 0 ? (
            <div className="grow flex items-center justify-center">
              <span className="text-base text-Black-400">
                {tasks.length > 0
                  ? "All tasks completed!"
                  : "No tasks yet. Add one above!"}
              </span>
            </div>
          ) : (
            <IndexActiveTasksList />
          )}
        </div>

        <IndexFooter />
      </div>
    </Box>
  );
}
