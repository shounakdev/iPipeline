type RcaSectionProps = {
  summary: string | null;
};

export function RcaSection({
  summary,
}: RcaSectionProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Root cause analysis
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Structured investigation findings and causal
          evidence.
        </p>
      </div>

      <div className="p-5">
        {summary ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
            {summary}
          </p>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              Root Cause Analysis has not yet been
              completed.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Future incident-response work can record the
              primary cause, contributing factors,
              supporting evidence, and prevention actions
              here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default RcaSection;
