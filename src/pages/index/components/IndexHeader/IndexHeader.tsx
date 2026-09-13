import { Settings } from "lucide-react";
import { useState } from "react";
import { Logo } from "../../../../layout/components/atoms/Logo";
import { useStoredWorkflows } from "../../hooks/useStoredWorkflows";
import { useWorkflowsState } from "../../states/workflows";
import { IndexDarkModeToggle } from "./components/IndexDarkModeToggle";
import { IndexSettingsDialog } from "./components/IndexSettingsDialog/IndexSettingsDialog";
import { IndexWorkflowDialog } from "./components/IndexWorkflowDialog/IndexWorkflowDialog";
import { IndexWorkflowSelector } from "./components/IndexWorkflowSelector";

const MANAGE_WORKFLOW_OPTION_VALUE = "manage-workflows";

type IndexHeaderProps = {
  showOnlyLogo?: boolean;
};

export function IndexHeader({ showOnlyLogo }: IndexHeaderProps) {
  const workflows = useStoredWorkflows();
  const selectedWorkflowId = useWorkflowsState(
    (props) => props.state.selectedWorkflowId,
  );
  const workflowActions = useWorkflowsState((props) => props.actions);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const workflowOptions = [
    ...workflows.map((workflow) => ({
      label: workflow.title,
      value: workflow.id,
    })),
    { label: "Manage", value: MANAGE_WORKFLOW_OPTION_VALUE },
  ];

  function handleWorkflowChange(value: string) {
    if (value === MANAGE_WORKFLOW_OPTION_VALUE) {
      setIsWorkflowDialogOpen(true);
      return;
    }

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
        <IndexWorkflowDialog
          isOpen={isWorkflowDialogOpen}
          onOpenChange={setIsWorkflowDialogOpen}
        />
        <button
          type="button"
          onClick={() => setIsSettingsDialogOpen(true)}
          className="flex items-center p-2 justify-center rounded-xl border border-Blue-400 bg-Blue-400 text-White transition-colors hover:bg-Blue-300 dark:bg-Blue-600 dark:border-Blue-600 dark:hover:bg-Blue-500"
        >
          <Settings className="h-5 w-5" />
        </button>
        <IndexDarkModeToggle />
      </div>
      <IndexSettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />
    </div>
  );
}
