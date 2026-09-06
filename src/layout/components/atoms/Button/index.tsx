import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "danger" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-Green-500 hover:bg-Green-400 text-White dark:bg-Green-500 dark:hover:bg-Green-400",
    danger: "bg-Red-500 hover:bg-Red-400 text-White",
    secondary:
      "bg-Blue-600 hover:bg-Blue-500 text-White dark:bg-Blue-600 dark:hover:bg-Blue-500",
  };

  return (
    <button
      className={twMerge(
        "flex items-center justify-center gap-2.5 px-16 py-4 rounded-xl font-bold text-sm leading-[1.2] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
