
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  KeyboardEvent,
  MouseEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { StatusBadge } from "@/components/reliability/StatusBadge";
import {
  getServiceErrorBudget,
  getServiceReliability,
  listReliabilityAlerts,
  listServices,
} from "@/lib/reliability-api";
import {
  findMetric,
  formatBurnRate,
  formatDate,
  formatMetricValue,
  formatPercentage,
  normalizeState,
  pickMostSevereBudget,
  selectMostSevereBackendState,
} from "@/lib/reliability-format";
import type {
  ErrorBudgetItem,
  ReliabilityAlert,
  ReliabilitySLOState,
  ReliabilityState,
} from "@/types/reliability";

type GlobalReliabilityRow = {
  serviceId: string;
  serviceName: string;
  overallStatus: ReliabilityState;
  availability: ReliabilitySLOState | null;
  latency: ReliabilitySLOState | null;
  errorRate: ReliabilitySLOState | null;
  budget: ErrorBudgetItem | null;
  openAlertCount: number;
  lastBreachAt: string | null;
};

function MetricTableCell({
  measurement,
  metricType,
}: {
  measurement: ReliabilitySLOState | null;
  metricType: string;
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-slate-900 dark:text-slate-100">
        {formatMetricValue(
          metricType,
          measurement?.measured_value,
        )}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {measurement
          ? normalizeState(measurement.status).replaceAll(
              "_",
              " ",
            )
          : "NO DATA"}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "healthy" | "danger";
}) {
  const valueClass =
    tone === "healthy"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-700 dark:text-red-400"
        : "text-slate-950 dark:text-slate-100";

  return (
    <article className="rounded-xl border border-slate-300 bg-white p-5 text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${valueClass}`}
      >
        {value}
      </p>
    </article>
  );
}

export default function ReliabilityPage() {
  const router = useRouter();
  const [rows, setRows] = useState<GlobalReliabilityRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReliability = useCallback(async () => {
    try {
      const [services, allAlerts] = await Promise.all([
        listServices(),
        listReliabilityAlerts(),
      ]);

      const alertsByService = new Map<
        string,
        ReliabilityAlert[]
      >();

      allAlerts.forEach((alert) => {
        const current =
          alertsByService.get(alert.service_id) ?? [];
        current.push(alert);
        alertsByService.set(alert.service_id, current);
      });

      const serviceRows = await Promise.all(
        services.map(async (service) => {
          const [reliability, errorBudget] =
            await Promise.all([
              getServiceReliability(service.id),
              getServiceErrorBudget(service.id),
            ]);

          const budget = pickMostSevereBudget(
            errorBudget.budgets,
          );

          const overallStatus =
            reliability.overall_status ??
            selectMostSevereBackendState([
              ...reliability.slos.map((slo) => slo.status),
              ...errorBudget.budgets.map(
                (item) => item.status,
              ),
            ]);

          const serviceAlerts =
            alertsByService.get(service.id) ?? [];

          const lastBreach =
            [...serviceAlerts].sort(
              (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime(),
            )[0] ?? null;

          return {
            serviceId: service.id,
            serviceName:
              reliability.service_name || service.name,
            overallStatus,
            availability: findMetric(
              reliability.slos,
              "AVAILABILITY",
            ),
            latency: findMetric(
              reliability.slos,
              "P95_LATENCY",
            ),
            errorRate: findMetric(
              reliability.slos,
              "ERROR_RATE",
            ),
            budget,
            openAlertCount:
              reliability.open_alert_count ??
              reliability.open_alerts.length,
            lastBreachAt: lastBreach?.created_at ?? null,
          } satisfies GlobalReliabilityRow;
        }),
      );

      setRows(serviceRows);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load reliability data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    void loadReliability();
  }, [loadReliability]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReliability();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadReliability]);

  const summary = useMemo(() => {
    const healthyServices = rows.filter(
      (row) =>
        normalizeState(row.overallStatus) === "HEALTHY",
    ).length;

    const breachingServices = rows.filter((row) =>
      ["BREACHED", "EXHAUSTED"].includes(
        normalizeState(row.overallStatus),
      ),
    ).length;

    const openAlerts = rows.reduce(
      (total, row) => total + row.openAlertCount,
      0,
    );

    return {
      totalServices: rows.length,
      healthyServices,
      breachingServices,
      openAlerts,
    };
  }, [rows]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
              PlatformIQ
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              Reliability
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              SLO health, error budgets and active
              reliability alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total services"
            value={summary.totalServices}
          />
          <SummaryCard
            label="Healthy services"
            value={summary.healthyServices}
            tone="healthy"
          />
          <SummaryCard
            label="Breaching services"
            value={summary.breachingServices}
            tone="danger"
          />
          <SummaryCard
            label="Open alerts"
            value={summary.openAlerts}
            tone={
              summary.openAlerts > 0 ? "danger" : "default"
            }
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
              Service reliability
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Values and states are displayed from the
              backend reliability engine.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-600 dark:text-slate-400">
              Loading reliability data…
            </div>
          ) : error ? (
            <div className="m-5 rounded-lg border border-dashed border-red-300 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="font-medium text-red-700 dark:text-red-400">
                Could not load reliability data
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {error}
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="m-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
              No services were returned by the backend.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr className="text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">
                      Availability
                    </th>
                    <th className="px-4 py-3">
                      p95 Latency
                    </th>
                    <th className="px-4 py-3">
                      Error Rate
                    </th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">
                      Burn Rate
                    </th>
                    <th className="px-4 py-3">Alerts</th>
                    <th className="px-4 py-3">
                      Last Breach
                    </th>
                    <th className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {rows.map((row) => {
                    const destination = `/services/${row.serviceId}/reliability`;
                    const burnRate =
                      row.budget?.burn_rate ?? null;
                    const burnIsElevated =
                      burnRate !== null && burnRate > 1;

                    return (
                      <tr
                        key={row.serviceId}
                        tabIndex={0}
                        role="link"
                        onClick={() =>
                          router.push(destination)
                        }
                        onKeyDown={(
                          event: KeyboardEvent<HTMLTableRowElement>,
                        ) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            router.push(destination);
                          }
                        }}
                        className="cursor-pointer border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:border-slate-800 dark:hover:bg-slate-800/60 dark:focus:bg-slate-800/60"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <Link
                                href={destination}
                                onClick={(
                                  event: MouseEvent<HTMLAnchorElement>,
                                ) => event.stopPropagation()}
                                className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                              >
                                {row.serviceName}
                              </Link>
                              <div className="mt-1">
                                <StatusBadge
                                  status={row.overallStatus}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <MetricTableCell
                            measurement={row.availability}
                            metricType="AVAILABILITY"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <MetricTableCell
                            measurement={row.latency}
                            metricType="P95_LATENCY"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <MetricTableCell
                            measurement={row.errorRate}
                            metricType="ERROR_RATE"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {formatPercentage(
                                row.budget
                                  ?.remaining_percentage,
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {row.budget
                                ? normalizeState(
                                    row.budget.status,
                                  ).replaceAll("_", " ")
                                : "NO DATA"}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={
                              burnIsElevated
                                ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                : "font-medium text-slate-900 dark:text-slate-100"
                            }
                          >
                            {formatBurnRate(burnRate)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {row.openAlertCount > 0 ? (
                            <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              {row.openAlertCount}
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              0
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-400">
                          {formatDate(row.lastBreachAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <Link
                            href={destination}
                            onClick={(
                              event: MouseEvent<HTMLAnchorElement>,
                            ) => event.stopPropagation()}
                            className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}