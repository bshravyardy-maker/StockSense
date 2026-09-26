import { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-anthracite)] px-4">
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-lg p-8">
        <h1 className="text-xl font-bold text-[var(--color-anthracite)] mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-muted)] mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
