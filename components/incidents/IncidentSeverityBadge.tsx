import type { IncidentSeverity } from "@/types/incidents";

type IncidentSeverityBadgeProps = {
  severity: IncidentSeverity;
  className?: string;
};

const severityClasses: Record<
  IncidentSeverity,
  string
> = {
  "SEV-1":
    "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",

  "SEV-2":
    "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300",

  "SEV-3":
    "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
};

export function IncidentSeverityBadge({
  severity,
  className = "",
}: IncidentSeverityBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
        severityClasses[severity],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {severity}
    </span>
  );
}

export default IncidentSeverityBadge;
