import type {
  ErrorBudgetItem,
  ReliabilityAlert,
  ReliabilitySLOState,
  ReliabilityState,
  SLOMetricType,
} from "@/types/reliability";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATE_PRIORITY: Record<string, number> = {
  EXHAUSTED: 50,
  BREACHED: 40,
  WARNING: 30,
  NO_DATA: 20,
  HEALTHY: 10,
};

export function normalizeState(
  state: string | null | undefined,
): string {
  return state?.toUpperCase() ?? "NO_DATA";
}

/**
 * This only aggregates backend-returned states. It never compares a
 * measured value with a target in the browser.
 */
export function selectMostSevereBackendState(
  states: Array<string | null | undefined>,
): ReliabilityState {
  const normalized = states
    .map(normalizeState)
    .filter(Boolean);

  if (normalized.length === 0) {
    return "NO_DATA";
  }

  return normalized.reduce((current, candidate) => {
    const currentPriority = STATE_PRIORITY[current] ?? 0;
    const candidatePriority = STATE_PRIORITY[candidate] ?? 0;

    return candidatePriority > currentPriority
      ? candidate
      : current;
  }, normalized[0]);
}

export function pickMostSevereBudget(
  budgets: ErrorBudgetItem[],
): ErrorBudgetItem | null {
  if (budgets.length === 0) {
    return null;
  }

  return [...budgets].sort((left, right) => {
    const stateDifference =
      (STATE_PRIORITY[normalizeState(right.status)] ?? 0) -
      (STATE_PRIORITY[normalizeState(left.status)] ?? 0);

    if (stateDifference !== 0) {
      return stateDifference;
    }

    return right.burn_rate - left.burn_rate;
  })[0];
}

export function findMetric(
  slos: ReliabilitySLOState[],
  metricType: string,
): ReliabilitySLOState | null {
  return (
    slos.find(
      (slo) =>
        slo.metric_type.toUpperCase() ===
        metricType.toUpperCase(),
    ) ?? null
  );
}

export function metricLabel(
  metricType: SLOMetricType,
): string {
  switch (metricType.toUpperCase()) {
    case "AVAILABILITY":
      return "Availability";
    case "P95_LATENCY":
      return "p95 Latency";
    case "ERROR_RATE":
      return "Error Rate";
    default:
      return metricType
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        );
  }
}

export function formatMetricValue(
  metricType: SLOMetricType,
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  switch (metricType.toUpperCase()) {
    case "AVAILABILITY":
    case "ERROR_RATE":
      return `${NUMBER_FORMATTER.format(value)}%`;
    case "P95_LATENCY":
      return `${NUMBER_FORMATTER.format(value)} ms`;
    default:
      return NUMBER_FORMATTER.format(value);
  }
}

export function formatTarget(
  metricType: SLOMetricType,
  target: number | null | undefined,
): string {
  if (target === null || target === undefined) {
    return "Target: —";
  }

  switch (metricType.toUpperCase()) {
    case "AVAILABILITY":
      return `Target: ${NUMBER_FORMATTER.format(target)}%`;
    case "P95_LATENCY":
      return `Target: under ${NUMBER_FORMATTER.format(
        target,
      )} ms`;
    case "ERROR_RATE":
      return `Target: under ${NUMBER_FORMATTER.format(
        target,
      )}%`;
    default:
      return `Target: ${NUMBER_FORMATTER.format(target)}`;
  }
}

export function formatPercentage(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${NUMBER_FORMATTER.format(value)}%`;
}

export function formatBurnRate(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${NUMBER_FORMATTER.format(value)}x`;
}

export function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return DATE_FORMATTER.format(date);
}

export function formatRelativeTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const differenceMs = Date.now() - date.getTime();
  const future = differenceMs < 0;
  const absoluteMs = Math.abs(differenceMs);

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let amount: number;
  let unit: string;

  if (absoluteMs < hour) {
    amount = Math.max(1, Math.round(absoluteMs / minute));
    unit = amount === 1 ? "minute" : "minutes";
  } else if (absoluteMs < day) {
    amount = Math.round(absoluteMs / hour);
    unit = amount === 1 ? "hour" : "hours";
  } else {
    amount = Math.round(absoluteMs / day);
    unit = amount === 1 ? "day" : "days";
  }

  return future
    ? `in ${amount} ${unit}`
    : `${amount} ${unit} ago`;
}

export function formatDurationBetween(
  earlier: string | null | undefined,
  later: string | null | undefined,
): string | null {
  if (!earlier || !later) {
    return null;
  }

  const earlierTime = new Date(earlier).getTime();
  const laterTime = new Date(later).getTime();

  if (
    Number.isNaN(earlierTime) ||
    Number.isNaN(laterTime) ||
    laterTime < earlierTime
  ) {
    return null;
  }

  const differenceMs = laterTime - earlierTime;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (differenceMs < hour) {
    const minutes = Math.max(
      1,
      Math.round(differenceMs / minute),
    );
    return `${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    }`;
  }

  if (differenceMs < day) {
    const hours = Math.round(differenceMs / hour);
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const days = Math.round(differenceMs / day);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function deploymentLabel(
  deployment:
    | {
        id: string;
        version?: string | null;
        commit_sha?: string | null;
      }
    | null
    | undefined,
): string {
  if (!deployment) {
    return "Not linked";
  }

  return (
    deployment.version ??
    deployment.commit_sha ??
    deployment.id.slice(0, 8)
  );
}

export function alertLabel(alert: ReliabilityAlert): string {
  switch (alert.alert_type.toUpperCase()) {
    case "SLO_BREACH":
      return "SLO breach";
    case "AVAILABILITY_BREACH":
      return "Availability breach";
    case "LATENCY_BREACH":
      return "Latency breach";
    case "ERROR_RATE_BREACH":
      return "Error-rate breach";
    case "ERROR_BUDGET_BURN":
      return "Error-budget burn";
    case "ERROR_BUDGET_EXHAUSTED":
      return "Error budget exhausted";
    default:
      return alert.alert_type
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        );
  }
}

export function alertMetricType(
  alert: ReliabilityAlert,
): SLOMetricType {
  const type = alert.alert_type.toUpperCase();

  if (type.includes("AVAILABILITY")) {
    return "AVAILABILITY";
  }

  if (type.includes("LATENCY")) {
    return "P95_LATENCY";
  }

  if (type.includes("ERROR_RATE")) {
    return "ERROR_RATE";
  }

  return "";
}

export function formatAlertValue(
  alert: ReliabilityAlert,
  value: number | null | undefined,
): string {
  const metric = alertMetricType(alert);

  if (metric) {
    return formatMetricValue(metric, value);
  }

  return value === null || value === undefined
    ? "—"
    : NUMBER_FORMATTER.format(value);
}