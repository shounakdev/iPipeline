import {
  formatRemediationLabel,
} from "@/lib/remediation-format";
import type {
  ApprovalDecision,
  RecommendationStatus,
  RecoveryVerificationStatus,
  RemediationExecutionStatus,
} from "@/types/remediation";

type DisplayStatus =
  | RecommendationStatus
  | ApprovalDecision
  | RemediationExecutionStatus
  | RecoveryVerificationStatus;

type RemediationStatusBadgeProps = {
  status: DisplayStatus;
};

const STATUS_STYLES: Record<
  DisplayStatus,
  string
> = {
  PENDING_APPROVAL:
    "border-amber-300 bg-amber-100 text-amber-800 " +
    "dark:border-amber-800 dark:bg-amber-950/50 " +
    "dark:text-amber-300",
  APPROVED:
    "border-blue-300 bg-blue-100 text-blue-800 " +
    "dark:border-blue-800 dark:bg-blue-950/50 " +
    "dark:text-blue-300",
  REJECTED:
    "border-rose-300 bg-rose-100 text-rose-800 " +
    "dark:border-rose-800 dark:bg-rose-950/50 " +
    "dark:text-rose-300",
  EXECUTING:
    "border-orange-300 bg-orange-100 text-orange-800 " +
    "dark:border-orange-800 dark:bg-orange-950/50 " +
    "dark:text-orange-300",
  COMPLETED:
    "border-cyan-300 bg-cyan-100 text-cyan-800 " +
    "dark:border-cyan-800 dark:bg-cyan-950/50 " +
    "dark:text-cyan-300",
  FAILED:
    "border-red-300 bg-red-100 text-red-800 " +
    "dark:border-red-800 dark:bg-red-950/50 " +
    "dark:text-red-300",
  RECOVERY_VERIFIED:
    "border-emerald-300 bg-emerald-100 " +
    "text-emerald-800 dark:border-emerald-800 " +
    "dark:bg-emerald-950/50 dark:text-emerald-300",
  RECOVERY_FAILED:
    "border-red-400 bg-red-100 text-red-900 " +
    "dark:border-red-800 dark:bg-red-950/60 " +
    "dark:text-red-300",
  PENDING:
    "border-amber-300 bg-amber-100 text-amber-800 " +
    "dark:border-amber-800 dark:bg-amber-950/50 " +
    "dark:text-amber-300",
  IN_PROGRESS:
    "border-orange-300 bg-orange-100 text-orange-800 " +
    "dark:border-orange-800 dark:bg-orange-950/50 " +
    "dark:text-orange-300",
  SUCCEEDED:
    "border-emerald-300 bg-emerald-100 " +
    "text-emerald-800 dark:border-emerald-800 " +
    "dark:bg-emerald-950/50 dark:text-emerald-300",
  VERIFIED:
    "border-emerald-300 bg-emerald-100 " +
    "text-emerald-800 dark:border-emerald-800 " +
    "dark:bg-emerald-950/50 dark:text-emerald-300",
};

export function RemediationStatusBadge({
  status,
}: RemediationStatusBadgeProps) {
  return (
    <span
      className={
        "inline-flex rounded-full border px-2.5 py-1 " +
        "text-xs font-semibold " +
        STATUS_STYLES[status]
      }
    >
      {formatRemediationLabel(status)}
    </span>
  );
}

export default RemediationStatusBadge;
