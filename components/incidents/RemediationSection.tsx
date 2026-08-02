"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { RemediationStatusBadge } from "@/components/remediation/RemediationStatusBadge";
import {
  formatRemediationAction,
} from "@/lib/remediation-format";
import {
  generateRemediationRecommendation,
  listIncidentRemediations,
} from "@/lib/remediation-api";
import type {
  RemediationRecommendation,
} from "@/types/remediation";

type RemediationSectionProps = {
  incidentId: string;
  summary: string | null;
  resolutionSummary?: string | null;
  canManage: boolean;
};

export function RemediationSection({
  incidentId,
  summary,
  resolutionSummary,
  canManage,
}: RemediationSectionProps) {
  const [recommendation, setRecommendation] =
    useState<RemediationRecommendation | null>(
      null,
    );

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadRecommendation = useCallback(
    async () => {
      if (!incidentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const recommendations =
          await listIncidentRemediations(
            incidentId,
          );

        setRecommendation(
          recommendations[0] ?? null,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : (
                "Unable to load remediation " +
                "recommendations."
              ),
        );
      } finally {
        setLoading(false);
      }
    },
    [incidentId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecommendation();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRecommendation]);

  async function generateRecommendation():
  Promise<void> {
    if (generating) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const created =
        await generateRemediationRecommendation(
          incidentId,
        );

      setRecommendation(created);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : (
              "Unable to generate remediation " +
              "recommendation."
            ),
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
          Remediation
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Guarded recovery recommendation, operator
          approval, execution, and verification.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Checking remediation status…
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}

        {!loading && recommendation ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Recommended action
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                  {formatRemediationAction(
                    recommendation.action_type,
                  )}
                </h3>
              </div>

              <RemediationStatusBadge
                status={recommendation.status}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {recommendation.reason}
            </p>

            <Link
              href={
                `/incidents/${incidentId}` +
                "/remediation"
              }
              className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              View Remediation
            </Link>
          </div>
        ) : null}

        {!loading && !recommendation ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              No remediation recommendation has been
              generated.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Generate a recommendation from the latest
              RCA report, incident evidence, deployment
              correlation, and service health.
            </p>

            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  void generateRecommendation();
                }}
                disabled={generating}
                className="mt-5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {generating
                  ? "Generating…"
                  : "Generate Recommendation"}
              </button>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Only administrators and SRE operators can
                generate recommendations.
              </p>
            )}
          </div>
        ) : null}

        {summary ? (
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
              Recorded remediation summary
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {summary}
            </p>
          </div>
        ) : null}

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