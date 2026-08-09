import type { ExperimentListItem } from "@/types/experiments";
import { ExperimentCard } from "./experiment-card";

export function ExperimentList({
  items,
  canManage,
  busyId,
  onStart,
  onAbort,
}: {
  items: ExperimentListItem[];
  canManage: boolean;
  busyId: string | null;
  onStart: (item: ExperimentListItem) => void;
  onAbort: (item: ExperimentListItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-semibold">No experiments yet</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create an experiment to begin reliability validation.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <ExperimentCard
          key={item.experiment.id}
          item={item}
          canManage={canManage}
          busy={busyId === item.experiment.id}
          onStart={() => onStart(item)}
          onAbort={() => onAbort(item)}
        />
      ))}
    </div>
  );
}
