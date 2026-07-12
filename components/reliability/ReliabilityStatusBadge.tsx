import type { ReliabilityState } from "@/types/reliability";

type ReliabilityStatusBadgeProps = {
  status: ReliabilityState | null | undefined;
  className?: string;
};

const STATUS_CLASSES: Record<string, string> = {
  HEALTHY:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  WARNING:
    "border-amber-200 bg-amber-50 text-amber-700",
  ACKNOWLEDGED:
    "border-amber-200 bg-amber-50 text-amber-700",
  BREACHED:
    "border-red-200 bg-red-50 text-red-700",
  EXHAUSTED:
    "border-red-200 bg-red-50 text-red-700",
  OPEN:
    "border-red-200 bg-red-50 text-red-700",
  RESOLVED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  NO_DATA:
    "border-slate-200 bg-slate-50 text-slate-600",
};

export function ReliabilityStatusBadge({
  status,
  className = "",
}: ReliabilityStatusBadgeProps) {
  const normalizedStatus =
    status?.toUpperCase() ?? "NO_DATA";

  const statusClasses =
    STATUS_CLASSES[normalizedStatus] ??
    "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border",
        "px-2.5 py-1 text-xs font-semibold",
        statusClasses,
        className,
      ].join(" ")}
    >
      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}

export default ReliabilityStatusBadge;
