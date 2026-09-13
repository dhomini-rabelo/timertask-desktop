import { Dialog } from "../../../../../../layout/components/atoms/Dialog";
import { IndexWorkflowFooter } from "./IndexWorkflowFooter.tsx";
import { IndexWorkflowList } from "./IndexWorkflowList.tsx";

interface IndexWorkflowDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function IndexWorkflowDialog({
  isOpen,
  onOpenChange,
}: IndexWorkflowDialogProps) {
  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content title="Workflows" description="Manage your workflow list">
        <div className="flex flex-col gap-3">
          <IndexWorkflowList />
        </div>
        <Dialog.Footer>
          <IndexWorkflowFooter />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
