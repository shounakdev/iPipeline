"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  service_id: string;
  environment: string;
  started_at: string;
  resolved_at?: string | null;
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.incidents)) return record.incidents as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }

  return [];
}

function statusClass(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-red-100 text-red-700 border-red-200";
    case "ACKNOWLEDGED":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "RESOLVED":
      return "bg-green-100 text-green-700 border-green-200";
    case "FALSE_POSITIVE":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function severityClass(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "LOW":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncidents() {
      try {
        setError(null);

        const rawData = await apiFetch("/api/incidents");
        setIncidents(normalizeArray<Incident>(rawData));
      } catch (err) {
        console.error(err);
        setError(
          "Failed to load incidents. Check that the backend is running and /api/incidents is registered."
        );
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, []);

  if (loading) {
    return <div className="p-6">Loading incidents...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Incidents</h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <p className="text-sm text-zinc-500">
          Operational issues created from observability alerts.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          No incidents found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-medium">{incident.title}</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {incident.environment} · {incident.service_id}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Started {new Date(incident.started_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                      incident.status
                    )}`}
                  >
                    {incident.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}