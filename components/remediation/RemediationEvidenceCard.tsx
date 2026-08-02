import {
  formatRemediationLabel,
  formatRemediationValue,
} from "@/lib/remediation-format";

type RemediationEvidenceCardProps = {
  evidence: Record<string, unknown>;
};

export function RemediationEvidenceCard({
  evidence,
}: RemediationEvidenceCardProps) {
  const evidenceEntries = Object.entries(
    evidence,
  );

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Recommendation evidence
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Evidence used by the guarded recommendation
          rules. This information is advisory and does
          not execute an action.
        </p>
      </div>

      <div className="p-5">
        {evidenceEntries.length > 0 ? (
          <dl className="grid gap-4 md:grid-cols-2">
            {evidenceEntries.map(
              ([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {formatRemediationLabel(key)}
                  </dt>

                  <dd className="mt-2">
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-800 dark:text-slate-200">
                      {formatRemediationValue(value)}
                    </pre>
                  </dd>
                </div>
              ),
            )}
          </dl>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
            No structured recommendation evidence is
            available.
          </div>
        )}
      </div>
    </section>
  );
}

export default RemediationEvidenceCard;
