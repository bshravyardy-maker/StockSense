import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const styles: Record<Variant, string> = {
    primary: "bg-[var(--color-anthracite)] text-white hover:bg-[var(--color-anthracite-dark)]",
    ghost: "bg-transparent text-[var(--color-anthracite)] hover:bg-black/5 border border-[var(--color-line)]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
