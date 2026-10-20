import { Bell } from "lucide-react";
import { Select } from "../../../../../../layout/components/atoms/Select";
import { alertMinutesOptions } from "../../../../states/tasks";

interface IndexAlertSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const alertOptions = alertMinutesOptions.map((minutes) => ({
  label: `${minutes} min`,
  value: minutes,
}));

export function IndexAlertSelect(props: IndexAlertSelectProps) {
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
