
import type {
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incidents";

export type IncidentActionTone =
  | "primary"
  | "warning"
  | "success"
  | "danger";

export type IncidentStatusAction = {
  kind: "acknowledge" | "status";
  targetStatus: IncidentStatus;
  label: string;
  tone: IncidentActionTone;
};

export const INCIDENT_STATUS_ACTIONS: Record<
  IncidentStatus,
  readonly IncidentStatusAction[]
> = {
  DETECTED: [
    {
      kind: "acknowledge",
      targetStatus: "ACKNOWLEDGED",
      label: "Acknowledge",
      tone: "primary",
    },
  ],

  ACKNOWLEDGED: [
    {
      kind: "status",
      targetStatus: "INVESTIGATING",
      label: "Start investigation",
      tone: "primary",
    },
  ],

  INVESTIGATING: [
    {
      kind: "status",
      targetStatus: "ACTION_RECOMMENDED",
      label: "Record recommendation",
      tone: "warning",
    },
    {
      kind: "status",
      targetStatus: "REMEDIATING",
      label: "Start remediation",
      tone: "warning",
    },
  ],

  ACTION_RECOMMENDED: [
    {
      kind: "status",
      targetStatus: "REMEDIATING",
      label: "Start remediation",
      tone: "warning",
    },
  ],

  REMEDIATING: [
    {
      kind: "status",
      targetStatus: "RESOLVED",
      label: "Resolve",
      tone: "success",
    },
    {
      kind: "status",
      targetStatus: "FAILED_RECOVERY",
      label: "Mark recovery failed",
      tone: "danger",
    },
  ],

  FAILED_RECOVERY: [
    {
      kind: "status",
      targetStatus: "INVESTIGATING",
      label: "Resume investigation",
      tone: "primary",
    },
    {
      kind: "status",
      targetStatus: "REMEDIATING",
      label: "Retry remediation",
      tone: "warning",
    },
  ],

  RESOLVED: [],
};

export const INCIDENT_SEVERITY_PRIORITY: Record<
  IncidentSeverity,
  number
> = {
  "SEV-1": 3,
  "SEV-2": 2,
  "SEV-3": 1,
};

export function getIncidentStatusActions(
  status: IncidentStatus,
): readonly IncidentStatusAction[] {
  return INCIDENT_STATUS_ACTIONS[status];
}

export function isIncidentTransitionAllowed(
  currentStatus: IncidentStatus,
  targetStatus: IncidentStatus,
): boolean {
  return INCIDENT_STATUS_ACTIONS[currentStatus].some(
    (action) =>
      action.targetStatus === targetStatus,
  );
}

export function isOpenIncidentStatus(
  status: IncidentStatus,
): boolean {
  return status !== "RESOLVED";
}

export function formatIncidentStatus(
  status: IncidentStatus,
): string {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export function formatIncidentSeverity(
  severity: IncidentSeverity,
): string {
  return severity;
}
