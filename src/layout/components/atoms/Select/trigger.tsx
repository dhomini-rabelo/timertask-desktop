import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface SelectTriggerProps {
  className?: string;
  children: ReactNode;
}

export function SelectTrigger(props: SelectTriggerProps) {
  return (
    <RadixSelect.Trigger
      className={twMerge(
        "w-full h-[48px] px-4 py-2 rounded-[12px] border border-Black-100 bg-White text-Black-700 text-[12px] leading-normal outline-none transition-all flex items-center justify-between gap-2 data-placeholder:text-Black-450 dark:data-placeholder:text-Black-400 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-Black-700 dark:border-Black-500 dark:text-White",
        props.className,
      )}
    >
      {props.children}
      <RadixSelect.Icon>
        <ChevronDown className="h-4 w-4 text-Black-450 dark:text-Black-400" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}
