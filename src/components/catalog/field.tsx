import type { ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <p className="mt-2 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
    </label>
  );
}
