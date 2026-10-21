import { Bell } from "lucide-react";
import { Select } from "../../../../../../layout/components/atoms/Select";
import { useSettingsState } from "../../../../states/settings";

interface IndexAlertSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function IndexAlertSelect(props: IndexAlertSelectProps) {
  const alertTimes = useSettingsState((store) => store.state.alertTimes);
  const alertOptions = alertTimes.map((minutes) => ({
    label: `${minutes} min`,
    value: String(minutes),
  }));

  return (
    <Select.Root
      options={alertOptions}
      value={props.value}
      onValueChange={props.onChange}
    >
      <Select.Trigger className="h-8 rounded-full px-2.5 py-0 text-Black-700 text-xs w-auto shrink-0">
        <Select.DisplayValue
          startIcon={<Bell className="h-4 w-4 text-Yellow-400" />}
        />
      </Select.Trigger>
    </Select.Root>
  );
}
