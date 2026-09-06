import type { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={twMerge(
        "w-full h-[48px] px-4 py-2 rounded-[12px] border border-Black-100 bg-White text-Black-700 placeholder:text-Black-450 text-[12px] leading-[1.5] outline-none focus:border-Green-400 focus:ring-1 focus:ring-Green-400 transition-all dark:bg-Black-700 dark:border-Black-500 dark:text-White dark:placeholder:text-Black-400",
        className,
      )}
      {...props}
    />
  );
}
