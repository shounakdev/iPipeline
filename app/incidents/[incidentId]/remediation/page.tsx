"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  RemediationApprovalPanel,
  type RemediationActionName,
} from "@/components/remediation/RemediationApprovalPanel";
import { RemediationAuditHistory } from "@/components/remediation/RemediationAuditHistory";
import { RemediationEvidenceCard } from "@/components/remediation/RemediationEvidenceCard";
import { RemediationExecutionCard } from "@/components/remediation/RemediationExecutionCard";
import { RemediationSummaryCard } from "@/components/remediation/RemediationSummaryCard";
import { RemediationVerificationCard } from "@/components/remediation/RemediationVerificationCard";
import {
  canManageRemediations,
  getAuthServerSnapshot,
  getAuthSnapshot,
  parseCurrentUser,
  subscribeToAuth,
} from "@/lib/auth";
import {
  approveRemediation,
  executeRemediation,
  generateRemediationRecommendation,
  getRemediationDetail,
  listIncidentRemediations,
  rejectRemediation,
  verifyRemediationRecovery,
} from "@/lib/remediation-api";
import type {
  RemediationDetail,
} from "@/types/remediation";

export default function IncidentRemediationPage() {
  const params = useParams<{
    incidentId: string;
  }>();

  const incidentId =
    typeof params.incidentId === "string"
      ? params.incidentId
      : "";

  const rawCurrentUser = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );

  const currentUser = parseCurrentUser(
    rawCurrentUser,
  );

  const canManage = canManageRemediations(
    currentUser?.role,
  );

  const [remediation, setRemediation] =
    useState<RemediationDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [busyAction, setBusyAction] =
    useState<RemediationActionName | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const loadRemediation = useCallback(
    async () => {
      if (!incidentId) {
        setError("Incident ID is missing.");
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

        if (recommendations.length === 0) {
          setRemediation(null);
          return;
        }

        const latestRecommendation =
          recommendations[0];

        const detail = await getRemediationDetail(
          latestRecommendation.id,
        );

        setRemediation(detail);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load remediation.",
        );
      } finally {
        setLoading(false);
      }
    },
    [incidentId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRemediation();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRemediation]);

  async function generateRecommendation():
  Promise<void> {
    if (!incidentId || generating) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const recommendation =
        await generateRemediationRecommendation(
          incidentId,
        );

      const detail = await getRemediationDetail(
        recommendation.id,
      );

      setRemediation(detail);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate recommendation.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function performAction(
    action: RemediationActionName,
    operation: () => Promise<unknown>,
  ): Promise<void> {
    if (busyAction) {
      return;
    }

    setBusyAction(action);
    setError(null);

    try {
      await operation();
      await loadRemediation();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The remediation action failed.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (loading && !remediation) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/incidents/${incidentId}`}
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Back to Incident
          </Link>

          <div className="mt-6 rounded-xl border border-slate-300 bg-white px-6 py-20 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading remediation…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/incidents/${incidentId}`}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ← Back to Incident
            </Link>

            <Link
              href="/remediation"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              All Remediations
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadRemediation();
            }}
            disabled={loading || busyAction !== null}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <header>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
            Guarded self-healing
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Incident Remediation
          </h1>

          <p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-400">
            Incident ID: {incidentId}
          </p>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}

        {!remediation ? (
          <section className="rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
              No remediation recommendation
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Generate an evidence-grounded recommendation
              from the incident&apos;s latest RCA report,
              collected evidence, deployment correlation,
              and service-health snapshot.
            </p>

            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  void generateRecommendation();
                }}
                disabled={generating}
                className="mt-6 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {generating
                  ? "Generating…"
                  : "Generate Recommendation"}
              </button>
            ) : (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                Only administrators and SRE operators can
                generate remediation recommendations.
              </p>
            )}
          </section>
        ) : (
          <>
            <RemediationSummaryCard
              remediation={remediation}
            />

            <RemediationEvidenceCard
              evidence={
                remediation.evidence_summary
              }
            />

            <RemediationApprovalPanel
              remediation={remediation}
              canManage={canManage}
              busyAction={busyAction}
              onApprove={() => {
                void performAction(
                  "approve",
                  () =>
                    approveRemediation(
                      remediation.id,
                    ),
                );
              }}
              onReject={(reason) => {
                void performAction(
                  "reject",
                  () =>
                    rejectRemediation(
                      remediation.id,
                      {
                        rejection_reason: reason,
                      },
                    ),
                );
              }}
              onExecute={() => {
                void performAction(
                  "execute",
                  () =>
                    executeRemediation(
                      remediation.id,
                    ),
                );
              }}
              onVerify={() => {
                void performAction(
                  "verify",
                  () =>
                    verifyRemediationRecovery(
                      remediation.id,
                    ),
                );
              }}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <RemediationExecutionCard
                execution={remediation.execution}
              />

              <RemediationVerificationCard
                verification={
                  remediation.verification
                }
              />
            </div>

            <RemediationAuditHistory
              events={remediation.audit_history}
            />
          </>
        )}
      </div>
    </main>
  );
}
