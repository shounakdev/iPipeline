import { normalizeState } from "@/lib/reliability-format";

type StatusBadgeProps = {
  status: string | null | undefined;
};

const STATUS_CLASSES: Record<string, string> = {
  HEALTHY:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  SUCCEEDED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  SUCCESS:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  RESOLVED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  WARNING:
    "border-amber-200 bg-amber-50 text-amber-700",
  ACKNOWLEDGED:
    "border-amber-200 bg-amber-50 text-amber-700",
  BREACHED: "border-red-200 bg-red-50 text-red-700",
  EXHAUSTED: "border-red-200 bg-red-50 text-red-700",
  OPEN: "border-red-200 bg-red-50 text-red-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  NO_DATA:
    "border-slate-200 bg-slate-50 text-slate-600",
};

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalized = normalizeState(status);
  const classes =
    STATUS_CLASSES[normalized] ??
    "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}