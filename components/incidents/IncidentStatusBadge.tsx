import { formatIncidentStatus } from "@/lib/incident-status";
import type { IncidentStatus } from "@/types/incidents";

type IncidentStatusBadgeProps = {
  status: IncidentStatus;
  className?: string;
};

const statusClasses: Record<
  IncidentStatus,
  string
> = {
  DETECTED:
    "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",

  ACKNOWLEDGED:
    "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",

  INVESTIGATING:
    "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300",

  ACTION_RECOMMENDED:
    "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",

  REMEDIATING:
    "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300",

  RESOLVED:
    "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",

  FAILED_RECOVERY:
    "border-red-400 bg-red-200 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
};

export function IncidentStatusBadge({
  status,
  className = "",
}: IncidentStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {formatIncidentStatus(status)}
    </span>
  );
}

export default IncidentStatusBadge;
