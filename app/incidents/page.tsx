"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { IncidentsTable } from "@/components/incidents/IncidentsTable";
import {
  getIncidentMetricsSummary,
  getUnacknowledgedIncidentCount,
  listIncidents,
} from "@/lib/incidents-api";
import { listServices } from "@/lib/reliability-api";
import type {
  IncidentListResponse,
  IncidentMetricsSummary,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incidents";

type IncidentFilters = {
  status: IncidentStatus | "";
  severity: IncidentSeverity | "";
  serviceId: string;
  environment: string;
  assigneeId: string;
};

type ServiceOption = {
  id: string;
  name: string;
};

const EMPTY_FILTERS: IncidentFilters = {
  status: "",
  severity: "",
  serviceId: "",
  environment: "",
  assigneeId: "",
};

const INCIDENT_STATUSES: IncidentStatus[] = [
  "DETECTED",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "ACTION_RECOMMENDED",
  "REMEDIATING",
  "RESOLVED",
  "FAILED_RECOVERY",
];

const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "SEV-1",
  "SEV-2",
  "SEV-3",
];

function formatStatusLabel(
  status: IncidentStatus,
): string {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?:
    | "default"
    | "danger"
    | "warning"
    | "healthy";
}) {
  const valueClass =
    tone === "danger"
      ? "text-red-700 dark:text-red-400"
      : tone === "warning"
        ? "text-orange-700 dark:text-orange-400"
        : tone === "healthy"
          ? "text-emerald-700 dark:text-emerald-400"
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

export default function IncidentsPage() {
  const [incidentData, setIncidentData] =
    useState<IncidentListResponse | null>(null);

  const [summary, setSummary] =
    useState<IncidentMetricsSummary | null>(
      null,
    );

  const [
    unacknowledgedIncidentCount,
    setUnacknowledgedIncidentCount,
  ] = useState(0);

  const [services, setServices] = useState<
    ServiceOption[]
  >([]);

  const [draftFilters, setDraftFilters] =
    useState<IncidentFilters>(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<IncidentFilters>(EMPTY_FILTERS);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        incidentsResponse,
        summaryResponse,
        unacknowledgedCount,
      ] = await Promise.all([
        listIncidents({
          status:
            appliedFilters.status || undefined,
          severity:
            appliedFilters.severity || undefined,
          service_id:
            appliedFilters.serviceId || undefined,
          environment:
            appliedFilters.environment ||
            undefined,
          assignee_id:
            appliedFilters.assigneeId ||
            undefined,
          page,
          page_size: 25,
        }),
        getIncidentMetricsSummary(),
        getUnacknowledgedIncidentCount(),
      ]);

      setIncidentData(incidentsResponse);
      setSummary(summaryResponse);
      setUnacknowledgedIncidentCount(
        unacknowledgedCount,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load incidents.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadIncidents();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadIncidents]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void listServices()
        .then((serviceList) => {
          setServices(
            serviceList
              .map((service) => ({
                id: service.id,
                name: service.name,
              }))
              .sort((left, right) =>
                left.name.localeCompare(right.name),
              ),
          );
        })
        .catch(() => {
          setServices([]);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(draftFilters);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const handleRefresh = () => {
    void loadIncidents();
  };

  const totalPages =
    incidentData?.total_pages ?? 1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
              PlatformIQ
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Incidents
            </h1>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Investigate operational incidents,
              response progress and recovery activity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Open incidents"
            value={
              summary?.open_incident_count ?? "—"
            }
            tone={
              (summary?.open_incident_count ?? 0) >
              0
                ? "warning"
                : "default"
            }
          />

          <SummaryCard
            label="SEV-1 incidents"
            value={
              summary?.sev_1_incident_count ?? "—"
            }
            tone="danger"
          />

          <SummaryCard
            label="SEV-2 incidents"
            value={
              summary?.sev_2_incident_count ?? "—"
            }
            tone="warning"
          />

          <SummaryCard
            label="Unacknowledged incidents"
            value={
              summary
                ? unacknowledgedIncidentCount
                : "—"
            }
            tone={
              unacknowledgedIncidentCount > 0
                ? "danger"
                : "default"
            }
          />

          <SummaryCard
            label="Average MTTA"
            value={
              summary?.average_mtta_display ?? "—"
            }
          />

          <SummaryCard
            label="Average MTTR"
            value={
              summary?.average_mttr_display ?? "—"
            }
            tone="healthy"
          />
        </section>

        <section className="mt-8 space-y-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Narrow the incident queue by operational
              attributes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                Status
              </span>

              <select
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event.target
                      .value as
                      | IncidentStatus
                      | "",
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">
                  All statuses
                </option>

                {INCIDENT_STATUSES.map(
                  (incidentStatus) => (
                    <option
                      key={incidentStatus}
                      value={incidentStatus}
                    >
                      {formatStatusLabel(
                        incidentStatus,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                Severity
              </span>

              <select
                value={draftFilters.severity}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    severity: event.target
                      .value as
                      | IncidentSeverity
                      | "",
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">
                  All severities
                </option>

                {INCIDENT_SEVERITIES.map(
                  (severity) => (
                    <option
                      key={severity}
                      value={severity}
                    >
                      {severity}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                Service
              </span>

              <select
                value={draftFilters.serviceId}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    serviceId: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">
                  All services
                </option>

                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                Environment
              </span>

              <input
                value={
                  draftFilters.environment
                }
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    environment:
                      event.target.value,
                  }))
                }
                placeholder="e.g. staging"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">
                Assigned operator
              </span>

              <input
                value={
                  draftFilters.assigneeId
                }
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    assigneeId:
                      event.target.value,
                  }))
                }
                placeholder="Operator user ID"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Apply filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-300 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Incident queue
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Open incidents are ordered first,
                followed by severity and detection
                time.
              </p>
            </div>

            {incidentData && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {incidentData.total} total
              </p>
            )}
          </div>

          {error ? (
            <div className="m-5 rounded-lg border border-dashed border-red-300 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="font-medium text-red-700 dark:text-red-400">
                Could not load incidents
              </p>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
              >
                Try again
              </button>
            </div>
          ) : (
            <IncidentsTable
              incidents={
                incidentData?.items ?? []
              }
              loading={loading}
            />
          )}

          {!error &&
            !loading &&
            incidentData &&
            incidentData.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-300 px-5 py-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1),
                    )
                  }
                  disabled={page <= 1}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Previous
                </button>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Page {page} of {totalPages}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1,
                      ),
                    )
                  }
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Next
                </button>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
