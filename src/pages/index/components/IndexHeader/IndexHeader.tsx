import { Logo } from "../../../../layout/components/atoms/Logo";
import { useStoredWorkflows } from "../../hooks/useStoredWorkflows";
import { useWorkflowsState } from "../../states/workflows";
import { IndexDarkModeToggle } from "./components/IndexDarkModeToggle";
import { IndexWorkflowDialog } from "./components/IndexWorkflowDialog/IndexWorkflowDialog";
import { IndexWorkflowSelector } from "./components/IndexWorkflowSelector";

type IndexHeaderProps = {
  showOnlyLogo?: boolean;
};

export function IndexHeader({ showOnlyLogo }: IndexHeaderProps) {
  const workflows = useStoredWorkflows();
  const selectedWorkflowId = useWorkflowsState(
    (props) => props.state.selectedWorkflowId,
  );
  const workflowActions = useWorkflowsState((props) => props.actions);

  const workflowOptions = workflows.map((workflow) => ({
    label: workflow.title,
    value: workflow.id,
  }));

  function handleWorkflowChange(value: string) {
    workflowActions.setSelectedWorkflowId(value);
  }

  if (showOnlyLogo) {
    return (
      <div className="flex w-full items-center justify-center pt-2">
        <Logo />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 pb-2 pt-2">
      <Logo />
      <div className="flex items-center gap-3">
        <IndexWorkflowSelector
          options={workflowOptions}
          value={selectedWorkflowId ?? undefined}
          isDisabled={workflowOptions.length === 0}
          onChange={handleWorkflowChange}
        />
        <IndexWorkflowDialog />
        <IndexDarkModeToggle />
      </div>
    </div>
  );
}
