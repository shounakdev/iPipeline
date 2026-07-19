type RemediationSectionProps = {
  summary: string | null;
  resolutionSummary?: string | null;
};

export function RemediationSection({
  summary,
  resolutionSummary,
}: RemediationSectionProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Remediation
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Recovery plan, implementation activity, and
          resolution outcome.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {summary ? (
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Remediation plan
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              No remediation plan has been recorded.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Recovery actions, owners, validation steps,
              and rollback decisions can be recorded here
              in a future sprint.
            </p>
          </div>
        )}

        {resolutionSummary ? (
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Resolution summary
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {resolutionSummary}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RemediationSection;
