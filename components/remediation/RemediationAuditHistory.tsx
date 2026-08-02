import {
  formatRemediationDate,
  formatRemediationLabel,
  formatRemediationValue,
} from "@/lib/remediation-format";
import type {
  RemediationAuditEvent,
} from "@/types/remediation";

type RemediationAuditHistoryProps = {
  events: RemediationAuditEvent[];
};

export function RemediationAuditHistory({
  events,
}: RemediationAuditHistoryProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Audit history
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Chronological record of recommendation and
          operator decisions.
        </p>
      </div>

      <div className="p-5">
        {events.length > 0 ? (
          <ol className="space-y-5">
            {events.map((event, index) => {
              const detailEntries = Object.entries(
                event.details,
              );

              return (
                <li
                  key={event.id}
                  className="relative border-l-2 border-slate-300 pl-6 dark:border-slate-700"
                >
                  <span className="absolute -left-2 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900 dark:bg-blue-400" />

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-100">
                        {formatRemediationLabel(
                          event.action,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Event {index + 1} · Actor:{" "}
                        {event.actor_id ?? "System"}
                      </p>
                    </div>

                    <time className="text-xs text-slate-500 dark:text-slate-400">
                      {formatRemediationDate(
                        event.created_at,
                      )}
                    </time>
                  </div>

                  {detailEntries.length > 0 ? (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {detailEntries.map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="rounded-md bg-slate-50 p-3 dark:bg-slate-950/40"
                          >
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {formatRemediationLabel(
                                key,
                              )}
                            </dt>

                            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">
                              {formatRemediationValue(
                                value,
                              )}
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            No remediation audit events have been
            recorded.
          </div>
        )}
      </div>
    </section>
  );
}

export default RemediationAuditHistory;
