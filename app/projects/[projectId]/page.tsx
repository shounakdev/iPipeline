"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  asArray,
  platformApi,
  type Project,
  type Service,
} from "@/lib/platformiq-api";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        const [projectData, servicesData] = await Promise.all([
          platformApi.getProject(projectId),
          platformApi.listServices(),
        ]);

        const allServices = asArray<Service>(servicesData, "services");

        setProject(projectData);
        setServices(
          allServices.filter((service) => service.project_id === projectId)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) loadProject();
  }, [projectId]);

  if (loading) {
    return <p className="text-[var(--text-muted)]">Loading project...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (!project) {
    return <p className="text-[var(--text-muted)]">Project not found.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-blue-400">
          ← Back to Projects
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-[var(--text-main)]">
          {project.name}
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          {project.description || "No description"}
        </p>
      </div>

      <h2 className="mb-3 text-xl font-semibold text-[var(--text-main)]">
        Services
      </h2>

      {services.length === 0 ? (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-[var(--text-muted)]">
          No services found for this project.
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition hover:border-blue-500"
            >
              <h3 className="text-lg font-semibold text-[var(--text-main)]">
                {service.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {service.description || "No description"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
