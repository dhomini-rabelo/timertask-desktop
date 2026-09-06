import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import type { SelectionOptionProps } from "./option.tsx";
import { SelectOption } from "./option.tsx";

export interface SelectRootProps {
  options: SelectionOptionProps[];
  value?: string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export function SelectRoot(props: SelectRootProps) {
  return (
    <RadixSelect.Root
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      disabled={props.disabled}
      name={props.name}
    >
      {props.children}
      <RadixSelect.Portal>
        <RadixSelect.Content className="z-50 overflow-hidden rounded-[12px] border border-Black-100 bg-White shadow-[0px_12px_40px_rgba(0,0,0,0.25)] dark:bg-Black-800 dark:border-Black-600">
          <RadixSelect.ScrollUpButton className="flex items-center justify-center h-8 p-1 text-Black-450 dark:text-Black-400">
            <ChevronUp className="h-4 w-4" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="px-2 py-1">
            {props.options.map((option) => (
              <SelectOption
                key={option.value}
                label={option.label}
                value={option.value}
                disabled={option.disabled}
              />
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex items-center justify-center h-8 p-1 text-Black-450 dark:text-Black-400">
            <ChevronDown className="h-4 w-4" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
