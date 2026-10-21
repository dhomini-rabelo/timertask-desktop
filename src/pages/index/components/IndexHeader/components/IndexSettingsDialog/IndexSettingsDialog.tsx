import { Dialog } from "../../../../../../layout/components/atoms/Dialog";
import { IndexAlertTimesSettings } from "./IndexAlertTimesSettings.tsx";
import { IndexProjectsSwitch } from "./IndexProjectsSwitch.tsx";

interface IndexSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function IndexSettingsDialog({
  isOpen,
  onOpenChange,
}: IndexSettingsDialogProps) {
  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content title="Settings" description="App-wide preferences">
        <div className="flex flex-col gap-3">
          <IndexProjectsSwitch />
          <div className="border-t border-Black-100/60 pt-3 dark:border-Black-600">
            <IndexAlertTimesSettings />
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
