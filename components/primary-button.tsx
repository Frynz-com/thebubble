import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  href?: string;
  icon?: ReactNode;
  variant?: "filled" | "outline";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const baseClass =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition active:scale-95 disabled:opacity-50";

export function PrimaryButton({ children, href, icon, variant = "filled", type = "button", onClick, disabled }: PrimaryButtonProps) {
  const className =
    variant === "filled"
      ? `${baseClass} bg-primary-container text-on-primary-container shadow-cta`
      : `${baseClass} border-2 border-outline-variant bg-transparent text-primary`;

  if (href) {
    const props: ComponentProps<typeof Link> = { href, className };
    return (
      <Link {...props}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled}>
      {children}
      {icon}
    </button>
  );
}
