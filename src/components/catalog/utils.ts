import type { ThemeMode } from "./form-state";

export function formatDate(value: string) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function normalizeDateInput(value: string) {
  return value ? value.slice(0, 10) : "";
}

export function resolveSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function cycleTheme(mode: ThemeMode): ThemeMode {
  if (mode === "system") return "light";
  if (mode === "light") return "dark";
  return "system";
}
