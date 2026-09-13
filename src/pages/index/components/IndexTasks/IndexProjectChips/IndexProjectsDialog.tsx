import { Dialog } from "../../../../../layout/components/atoms/Dialog";
import { IndexProjectsFooter } from "./IndexProjectsFooter";
import { IndexProjectsList } from "./IndexProjectsList";

interface IndexProjectsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function IndexProjectsDialog({
  isOpen,
  onOpenChange,
}: IndexProjectsDialogProps) {
  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content
        title="Projects"
        description="Manage the projects of the current workflow"
      >
        <div className="flex flex-col gap-3">
          <IndexProjectsList />
        </div>
        <Dialog.Footer>
          <IndexProjectsFooter />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
