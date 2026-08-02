"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RemediationStatusBadge } from "@/components/remediation/RemediationStatusBadge";
import {
  formatRemediationAction,
  formatRemediationDate,
} from "@/lib/remediation-format";
import {
  listRemediations,
} from "@/lib/remediation-api";
import type {
  RecommendationStatus,
  RemediationDetail,
} from "@/types/remediation";

type StatusFilter =
  | ""
  | RecommendationStatus;

type SummaryCardProps = {
  label: string;
  value: number;
  description: string;
  tone: string;
};

function SummaryCard({
  label,
  value,
  description,
  tone,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </p>

      <p
        className={
          "mt-2 text-3xl font-bold " + tone
        }
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function RemediationDashboardPage() {
  const [remediations, setRemediations] =
    useState<RemediationDetail[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("");

  const loadRemediations = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await listRemediations();
        setRemediations(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load remediations.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRemediations();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRemediations]);

  /*
   * The backend returns newest recommendations first.
   * Keep the current recommendation for each incident
   * on this operational dashboard.
   */
  const currentRemediations = useMemo(() => {
    const byIncident = new Map<
      string,
      RemediationDetail
    >();

    for (const remediation of remediations) {
      if (
        !byIncident.has(remediation.incident_id)
      ) {
        byIncident.set(
          remediation.incident_id,
          remediation,
        );
      }
    }

    return Array.from(byIncident.values());
  }, [remediations]);

  const filteredRemediations = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return currentRemediations.filter(
      (remediation) => {
        if (
          statusFilter &&
          remediation.status !== statusFilter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          remediation.id,
          remediation.incident_id,
          remediation.service_id,
          remediation.environment,
          remediation.action_type,
          remediation.reason,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        );
      },
    );
  }, [
    currentRemediations,
    search,
    statusFilter,
  ]);

  const pendingCount =
    currentRemediations.filter(
      (item) =>
        item.status === "PENDING_APPROVAL",
    ).length;

  const activeCount =
    currentRemediations.filter(
      (item) =>
        item.status === "APPROVED" ||
        item.status === "EXECUTING" ||
        item.status === "COMPLETED",
    ).length;

  const recoveredCount =
    currentRemediations.filter(
      (item) =>
        item.status === "RECOVERY_VERIFIED",
    ).length;

  const failedCount =
    currentRemediations.filter(
      (item) =>
        item.status === "FAILED" ||
        item.status === "RECOVERY_FAILED",
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Guarded self-healing
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Remediation
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Review recommendations, operator decisions,
              command execution, recovery verification,
              and failed-recovery outcomes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadRemediations();
            }}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Pending approval"
            value={pendingCount}
            description="Waiting for human review"
            tone="text-amber-700 dark:text-amber-300"
          />

          <SummaryCard
            label="Active remediation"
            value={activeCount}
            description="Approved, executing, or awaiting verification"
            tone="text-blue-700 dark:text-blue-300"
          />

          <SummaryCard
            label="Recovery verified"
            value={recoveredCount}
            description="Service health successfully restored"
            tone="text-emerald-700 dark:text-emerald-300"
          />

          <SummaryCard
            label="Failed recovery"
            value={failedCount}
            description="Execution or recovery validation failed"
            tone="text-red-700 dark:text-red-300"
          />
        </div>

        <section className="rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-300 p-5 dark:border-slate-700">
            <div className="flex flex-wrap gap-4">
              <label className="min-w-60 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Search
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder="Service, incident, action, or environment"
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                />
              </label>

              <label className="w-full sm:w-64">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </span>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value as
                        StatusFilter,
                    );
                  }}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                >
                  <option value="">All statuses</option>
                  <option value="PENDING_APPROVAL">
                    Pending approval
                  </option>
                  <option value="APPROVED">
                    Approved
                  </option>
                  <option value="REJECTED">
                    Rejected
                  </option>
                  <option value="EXECUTING">
                    Executing
                  </option>
                  <option value="COMPLETED">
                    Awaiting verification
                  </option>
                  <option value="FAILED">
                    Execution failed
                  </option>
                  <option value="RECOVERY_VERIFIED">
                    Recovery verified
                  </option>
                  <option value="RECOVERY_FAILED">
                    Recovery failed
                  </option>
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="m-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </div>
          ) : null}

          {loading && remediations.length === 0 ? (
            <div className="px-6 py-20 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading remediation activity…
            </div>
          ) : null}

          {!loading &&
          filteredRemediations.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                No remediations found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Generate a recommendation from an incident
                detail page or adjust these filters.
              </p>

              <Link
                href="/incidents"
                className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                View Incidents
              </Link>
            </div>
          ) : null}

          {filteredRemediations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-950/50">
                  <tr>
                    {[
                      "Action",
                      "Service",
                      "Environment",
                      "Recommendation",
                      "Approval",
                      "Execution",
                      "Verification",
                      "Created",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRemediations.map(
                    (remediation) => (
                      <tr
                        key={remediation.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {formatRemediationAction(
                            remediation.action_type,
                          )}
                        </td>

                        <td className="max-w-48 break-all px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {remediation.service_id}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {remediation.environment}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <RemediationStatusBadge
                            status={
                              remediation.status
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {remediation.approval ? (
                            <RemediationStatusBadge
                              status={
                                remediation.approval
                                  .decision
                              }
                            />
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Awaiting decision
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {remediation.execution ? (
                            <RemediationStatusBadge
                              status={
                                remediation.execution
                                  .execution_status
                              }
                            />
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Not started
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {remediation.verification ? (
                            <RemediationStatusBadge
                              status={
                                remediation.verification
                                  .verification_status
                              }
                            />
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              Not verified
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatRemediationDate(
                            remediation.created_at,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <Link
                            href={
                              `/incidents/` +
                              `${remediation.incident_id}` +
                              "/remediation"
                            }
                            className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
