import type {
  ChaosObservation,
  ChaosRunStatus,
} from "@/types/experiments";

const TERMINAL_STATUSES = new Set<ChaosRunStatus>([
  "COMPLETED",
  "FAILED",
  "ABORTED",
]);

export function isTerminalRunStatus(
  status: ChaosRunStatus,
): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isActiveRunStatus(
  status?: ChaosRunStatus | null,
): boolean {
  return Boolean(status && !isTerminalRunStatus(status));
}

export function nextPollDelay(
  status?: ChaosRunStatus | null,
): number | null {
  return isActiveRunStatus(status) ? 4000 : null;
}

export function formatExperimentLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) {
    return "—";
  }

  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  }

  const minutes = seconds / 60;
  return `${minutes.toFixed(minutes < 10 ? 1 : 0)} min`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function sortObservations(
  observations: ChaosObservation[],
): ChaosObservation[] {
  return [...observations].sort((left, right) => {
    const difference =
      new Date(left.observed_at).getTime() -
      new Date(right.observed_at).getTime();

    return difference || left.id.localeCompare(right.id);
  });
}

export function readableValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "—";
  }
  return JSON.stringify(value);
}