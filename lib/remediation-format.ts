import type {
  RemediationActionType,
} from "@/types/remediation";

const ACTION_LABELS: Record<
  RemediationActionType,
  string
> = {
  ROLLBACK_DEPLOYMENT: "Roll back deployment",
  RESTART_POD: "Restart pod",
  SCALE_REPLICAS: "Scale replicas",
  REDEPLOY_REVISION: "Redeploy revision",
};

export function formatRemediationAction(
  action: RemediationActionType,
): string {
  return ACTION_LABELS[action];
}

export function formatRemediationLabel(
  value: string,
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

export function formatRemediationDate(
  value?: string | null,
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRemediationValue(
  value: unknown,
): string {
  if (value === null || value === undefined) {
    return "Not available";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}
