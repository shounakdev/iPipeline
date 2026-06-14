"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getLinkedRepository,
  platformApi,
  type Service,
} from "@/lib/platformiq-api";
import { ApiError } from "@/lib/api";
import { canTriggerPipeline, getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const tabs = ["Overview", "Repository", "Environments", "Pipelines", "Audit"];

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [service, setService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [triggerResultJson, setTriggerResultJson] = useState("");

  const [user] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return getCurrentUser();
  });

  const allowedToTrigger = canTriggerPipeline(user?.role);

  useEffect(() => {
    async function loadService() {
      try {
        const data = await platformApi.getService(serviceId);
        setService(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) loadService();
  }, [serviceId]);

  const repository = useMemo(() => getLinkedRepository(service), [service]);
  const branch = repository?.default_branch || "main";

  async function handleTriggerPipeline() {
    if (!allowedToTrigger) {
      setError("You do not have permission to trigger pipelines.");
      return;
    }

    if (!repository?.repo_url) {
      setError("No linked repository found for this service");
      return;
    }

    setTriggering(true);
    setError("");
    setTriggerResultJson("");

    try {
      const result = await platformApi.triggerPipeline(
        repository.repo_url,
        branch
      );

      setTriggerResultJson(
        JSON.stringify(result ?? { message: "Pipeline triggered" }, null, 2)
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Please login to trigger a pipeline.");
          router.push("/login");
          return;
        }

        if (err.status === 403) {
          setError("You do not have permission to trigger pipelines.");
          return;
        }

        setError(err.message);
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to trigger pipeline");
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return <p className="text-[var(--text-muted)]">Loading service...</p>;
  }

  if (error && !service) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (!service) {
    return <p className="text-[var(--text-muted)]">Service not found.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/services" className="text-sm text-blue-400">
          ← Back to Services
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-[var(--text-main)]">
          {service.name}
        </h1>

        <p className="mt-2 text-[var(--text-muted)]">
          {service.description || "No description"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--card-border)] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--nav-hover)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-red-200">
          {error}
        </div>
      )}

      {activeTab === "Overview" && (
        <Panel title="Overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Service ID" value={service.id} />
            <Info label="Project ID" value={service.project_id || "N/A"} />
            <Info label="Type" value={service.service_type || "N/A"} />
            <Info label="Owner" value={service.owner || "N/A"} />
          </div>
        </Panel>
      )}

      {activeTab === "Repository" && (
        <Panel title="Repository">
          {repository ? (
            <div className="space-y-3">
              <Info label="Provider" value={repository.provider || "N/A"} />
              <Info label="Repo URL" value={repository.repo_url} />
              <Info label="Default Branch" value={branch} />
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">
              No linked repository found for this service.
            </p>
          )}
        </Panel>
      )}

      {activeTab === "Environments" && (
        <Panel title="Environments">
          {service.environments?.length ? (
            <div className="space-y-3">
              {service.environments.map((env) => (
                <div
                  key={env.id || env.name}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--page-bg)] p-4"
                >
                  <div className="font-medium text-[var(--text-main)]">
                    {env.name}
                  </div>

                  <div className="text-sm text-[var(--text-muted)]">
                    Active: {env.is_active ? "Yes" : "No"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No environments found.</p>
          )}
        </Panel>
      )}

      {activeTab === "Pipelines" && (
        <Panel title="Pipelines">
          <div className="mb-5 rounded-lg border border-[var(--card-border)] bg-[var(--page-bg)] p-4">
            <div className="mb-2 text-sm text-[var(--text-muted)]">
              Linked Repository
            </div>

            <div className="break-all text-[var(--text-main)]">
              {repository?.repo_url || "No repository linked"}
            </div>

            <div className="mt-2 text-sm text-[var(--text-muted)]">
              Branch: {branch}
            </div>
          </div>

          <button
            onClick={handleTriggerPipeline}
            disabled={triggering || !repository?.repo_url || !allowedToTrigger}
            title={
              !allowedToTrigger
                ? "Viewers cannot trigger pipelines"
                : !repository?.repo_url
                ? "No repository linked"
                : undefined
            }
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!allowedToTrigger
              ? "Trigger Pipeline Disabled"
              : triggering
              ? "Triggering..."
              : "Trigger Pipeline"}
          </button>

          {triggerResultJson && (
            <pre className="mt-5 overflow-auto rounded-lg border border-[var(--card-border)] bg-[var(--page-bg)] p-4 text-sm text-green-400">
              {triggerResultJson}
            </pre>
          )}
        </Panel>
      )}

      {activeTab === "Audit" && (
        <Panel title="Audit">
          {service.audit_events?.length ? (
            <div className="space-y-3">
              {service.audit_events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--page-bg)] p-4"
                >
                  <div className="font-medium text-[var(--text-main)]">
                    {event.action || "Unknown action"}
                  </div>

                  <div className="text-sm text-[var(--text-muted)]">
                    {event.created_at || "No timestamp"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">
              No audit events found for this service.
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
      <h2 className="mb-4 text-xl font-semibold text-[var(--text-main)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-sm text-[var(--text-muted)]">{label}</div>
      <div className="break-all text-[var(--text-main)]">{value}</div>
    </div>
  );
}