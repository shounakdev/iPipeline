"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { IncidentActions } from "@/components/incidents/IncidentActions";
import { IncidentAssignmentPanel } from "@/components/incidents/IncidentAssignmentPanel";
import { IncidentComments } from "@/components/incidents/IncidentComments";
import { IncidentHeader } from "@/components/incidents/IncidentHeader";
import { IncidentImpactSummary } from "@/components/incidents/IncidentImpactSummary";
import { IncidentMetricsCard } from "@/components/incidents/IncidentMetricsCard";
import { IncidentRCASection } from "@/components/incidents/IncidentRCASection";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { RemediationSection } from "@/components/incidents/RemediationSection";
import { SuspectedDeploymentCard } from "@/components/incidents/SuspectedDeploymentCard";
import {
  canManageIncidents,
  canManageRemediations,
  getAuthServerSnapshot,
  getAuthSnapshot,
  parseCurrentUser,
  subscribeToAuth,
} from "@/lib/auth";
import { getIncidentPageData } from "@/lib/incidents-api";
import type {
  IncidentDetail,
  IncidentMetricsResponse,
  IncidentTimelineResponse,
} from "@/types/incidents";

export default function IncidentDetailPage() {
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

  const canEdit = canManageIncidents(
    currentUser?.role,
  );

  const canManageRemediation =
    canManageRemediations(
      currentUser?.role,
    );

  const [incidentDetail, setIncidentDetail] =
    useState<IncidentDetail | null>(null);

  const [timeline, setTimeline] =
    useState<IncidentTimelineResponse | null>(
      null,
    );

  const [metrics, setMetrics] =
    useState<IncidentMetricsResponse | null>(
      null,
    );

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadIncident = useCallback(async () => {
    if (!incidentId) {
      setError("Incident ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data =
        await getIncidentPageData(incidentId);

      setIncidentDetail(data.incident);
      setTimeline(data.timeline);
      setMetrics(data.metrics);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load incident.",
      );
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadIncident();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadIncident]);

  if (loading && !incidentDetail) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/incidents"
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Back to Incidents
          </Link>

          <div className="mt-6 rounded-xl border border-slate-300 bg-white px-6 py-20 text-center text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading incident…
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !incidentDetail ||
    !timeline ||
    !metrics
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/incidents"
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            ← Back to Incidents
          </Link>

          <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-8 text-center shadow-sm dark:border-red-900 dark:bg-red-950/30">
            <h1 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Could not load incident
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {error ??
                "The incident response was incomplete."}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadIncident();
              }}
              disabled={loading}
              className="mt-5 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
            >
              {loading ? "Loading…" : "Try again"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/incidents"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            ← Back to Incidents
          </Link>

          <button
            type="button"
            onClick={() => {
              void loadIncident();
            }}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <IncidentHeader
          incidentDetail={incidentDetail}
          actions={
            <IncidentActions
              incidentId={incidentId}
              status={
                incidentDetail.incident.status
              }
              canEdit={canEdit}
              onChanged={loadIncident}
            />
          }
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <IncidentImpactSummary
            incidentDetail={incidentDetail}
            metrics={metrics}
          />

          <SuspectedDeploymentCard
            deployment={
              incidentDetail.suspected_deployment
            }
            deploymentId={
              incidentDetail.incident
                .suspected_deployment_id
            }
          />
        </div>

        <IncidentAssignmentPanel
          incidentId={incidentId}
          status={incidentDetail.incident.status}
          currentAssignment={
            incidentDetail.current_assignment
          }
          canEdit={canEdit}
          onChanged={loadIncident}
        />

        <IncidentMetricsCard metrics={metrics} />

        <IncidentTimeline timeline={timeline} />

        <IncidentRCASection
          incidentId={incidentId}
        />

        <RemediationSection
          incidentId={incidentId}
          summary={
            incidentDetail.remediation_summary
          }
          resolutionSummary={
            incidentDetail.resolution_summary
          }
          canManage={canManageRemediation}
        />

        <IncidentComments
          incidentId={incidentId}
          comments={incidentDetail.comments}
          canEdit={canEdit}
          onChanged={loadIncident}
        />
      </div>
    </main>
  );
}