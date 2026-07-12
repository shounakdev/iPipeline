"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { MetricCard } from "@/components/reliability/MetricCard";
import { RecentMeasurementsTable } from "@/components/reliability/RecentMeasurementsTable";
import { ReliabilityAlertsTable } from "@/components/reliability/ReliabilityAlertsTable";
import { StatusBadge } from "@/components/reliability/StatusBadge";
import { getServiceReliabilityPageData } from "@/lib/reliability-api";
import {
  deploymentLabel,
  findMetric,
  formatBurnRate,
  formatDurationBetween,
  formatPercentage,
  formatRelativeTime,
  metricLabel,
  normalizeState,
  pickMostSevereBudget,
} from "@/lib/reliability-format";
import type {
  ReliabilityAlert,
  ServiceErrorBudgetResponse,
  ServiceReliabilityResponse,
} from "@/types/reliability";

type RecentMeasurement = ComponentProps<
  typeof RecentMeasurementsTable
>["measurements"][number];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function selectCorrelationAlert(
  alerts: ReliabilityAlert[],
): ReliabilityAlert | null {
  const activeAlerts = alerts
    .filter((alert) =>
      ["OPEN", "ACKNOWLEDGED"].includes(
        normalizeState(alert.status),
      ),
    )
    .sort((left, right) => {
      const leftPriority =
        normalizeState(left.status) === "OPEN" ? 0 : 1;
      const rightPriority =
        normalizeState(right.status) === "OPEN" ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return (
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime()
      );
    });

  return (
    activeAlerts.find(
      (alert) => alert.deployment || alert.deployment_id,
    ) ??
    activeAlerts[0] ??
    null
  );
}

export default function ServiceReliabilityPage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [reliability, setReliability] =
    useState<ServiceReliabilityResponse | null>(null);
  const [errorBudget, setErrorBudget] =
    useState<ServiceErrorBudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    let cancelled = false;

    getServiceReliabilityPageData(serviceId)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setReliability(data.reliability);
        setErrorBudget(data.errorBudget);
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load service reliability.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const handleRefresh = useCallback(async () => {
    if (!serviceId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data =
        await getServiceReliabilityPageData(serviceId);
      setReliability(data.reliability);
      setErrorBudget(data.errorBudget);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load service reliability.",
      );
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const availability = useMemo(
    () =>
      findMetric(
        reliability?.slos ?? [],
        "AVAILABILITY",
      ),
    [reliability],
  );

  const latency = useMemo(
    () =>
      findMetric(
        reliability?.slos ?? [],
        "P95_LATENCY",
      ),
    [reliability],
  );

  const errorRate = useMemo(
    () =>
      findMetric(
        reliability?.slos ?? [],
        "ERROR_RATE",
      ),
    [reliability],
  );

  const primaryBudget = useMemo(
    () => pickMostSevereBudget(errorBudget?.budgets ?? []),
    [errorBudget],
  );

  const activeAlerts = useMemo(
    () =>
      (reliability?.open_alerts ?? []).filter((alert) =>
        ["OPEN", "ACKNOWLEDGED"].includes(
          normalizeState(alert.status),
        ),
      ),
    [reliability],
  );

  const recentMeasurements = useMemo<RecentMeasurement[]>(
    () =>
      (reliability?.slos ?? []).flatMap((slo) => {
        if (
          slo.measured_value === null ||
          slo.evaluated_at === null
        ) {
          return [];
        }

        return [
          {
            ...slo,
            measured_value: slo.measured_value,
            evaluated_at: slo.evaluated_at,
            measurement_id: slo.slo_definition_id,
            is_breached:
              normalizeState(slo.status) === "BREACHED",
          },
        ];
      }),
    [reliability],
  );

  const correlationAlert = useMemo(
    () => selectCorrelationAlert(activeAlerts),
    [activeAlerts],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <p className="text-center text-sm text-slate-500">
          Loading service reliability…
        </p>
      </main>
    );
  }

  if (error || !reliability) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-red-700">
            Could not load service reliability
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {error ?? "The service response was empty."}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const latestDeployment = reliability.latest_deployment;
  const correlatedDeployment =
    correlationAlert?.deployment ??
    (correlationAlert?.deployment_id &&
    latestDeployment?.id === correlationAlert.deployment_id
      ? latestDeployment
      : correlationAlert?.deployment_id
        ? { id: correlationAlert.deployment_id }
        : null);

  const correlationDelay = formatDurationBetween(
    correlatedDeployment?.created_at,
    correlationAlert?.created_at,
  );

  const correlationMetric = (() => {
    const alertType =
      correlationAlert?.alert_type.toUpperCase() ?? "";

    if (alertType.includes("AVAILABILITY")) {
      return "Availability";
    }

    if (alertType.includes("LATENCY")) {
      return "Latency";
    }

    if (alertType.includes("ERROR_RATE")) {
      return "Error rate";
    }

    if (alertType.includes("ERROR_BUDGET")) {
      return "Error budget";
    }

    return "SLO";
  })();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <header>
            <Link
              href="/reliability"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
            >
              ← Reliability
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {reliability.service_name} Reliability
            </h1>
            <p className="mt-2 text-slate-600">
              Backend-evaluated SLO health, error budget and
              active alerts.
            </p>
          </header>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Availability"
            metricType="AVAILABILITY"
            measurement={availability}
          />
          <MetricCard
            title="p95 Latency"
            metricType="P95_LATENCY"
            measurement={latency}
          />
          <MetricCard
            title="Error Rate"
            metricType="ERROR_RATE"
            measurement={errorRate}
          />

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-600">
                Error Budget Remaining
              </h2>
              <StatusBadge
                status={primaryBudget?.status ?? "NO_DATA"}
              />
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              {formatPercentage(
                primaryBudget?.remaining_percentage,
              )}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Consumed</dt>
                <dd className="font-semibold text-slate-900">
                  {formatPercentage(
                    primaryBudget?.consumed_percentage,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">
                  Burn rate
                </dt>
                <dd className="font-semibold text-slate-900">
                  {formatBurnRate(
                    primaryBudget?.burn_rate,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">State</dt>
                <dd className="font-semibold text-slate-900">
                  {primaryBudget
                    ? normalizeState(
                        primaryBudget.status,
                      ).replaceAll("_", " ")
                    : "NO DATA"}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <article
            className={`rounded-2xl border p-5 shadow-sm ${
              (primaryBudget?.burn_rate ?? 0) > 1
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-slate-600">
              Burn Rate
            </p>
            <p
              className={`mt-3 text-3xl font-bold ${
                (primaryBudget?.burn_rate ?? 0) > 1
                  ? "text-red-700"
                  : "text-slate-950"
              }`}
            >
              {formatBurnRate(primaryBudget?.burn_rate)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {primaryBudget
                ? `${metricLabel(
                    primaryBudget.metric_type,
                  )} error budget`
                : "No error-budget result"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              Latest Deployment
            </p>

            {latestDeployment ? (
              <>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Link
                    href={`/deployments/${latestDeployment.id}`}
                    className="text-2xl font-bold text-slate-950 hover:text-blue-700 hover:underline"
                  >
                    {deploymentLabel(latestDeployment)}
                  </Link>
                  <StatusBadge
                    status={
                      latestDeployment.status ?? "NO_DATA"
                    }
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Deployed{" "}
                  {formatRelativeTime(
                    latestDeployment.created_at,
                  )}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No deployment was returned for this service.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              Breach Correlation
            </p>

            {!correlationAlert ? (
              <p className="mt-3 text-sm text-slate-500">
                No active breach is available for correlation.
              </p>
            ) : correlatedDeployment ? (
              <>
                <p className="mt-3 font-semibold text-slate-950">
                  {correlationMetric} breached after
                  deployment{" "}
                  {deploymentLabel(correlatedDeployment)}.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {correlationDelay
                    ? `The correlated deployment occurred ${correlationDelay} before the breach.`
                    : "The breach occurred after a linked deployment."}
                </p>
                <p className="mt-3 text-xs font-medium text-amber-700">
                  Potentially release-related. Correlation does
                  not prove causation.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-semibold text-slate-950">
                  No deployment was identified before this
                  breach.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  The active alert is not linked to a correlated
                  deployment.
                </p>
              </>
            )}
          </article>
        </section>

        <div className="mt-6 space-y-6">
          <Section
            title="Open Reliability Alerts"
            description="OPEN alerts are shown first, followed by ACKNOWLEDGED alerts."
          >
            <ReliabilityAlertsTable alerts={activeAlerts} />
          </Section>

          <Section
            title="Recent SLO Measurements"
            description="The latest backend measurement returned for each configured SLO."
          >
            <RecentMeasurementsTable
              measurements={recentMeasurements}
            />
          </Section>
        </div>
      </div>
    </main>
  );
}