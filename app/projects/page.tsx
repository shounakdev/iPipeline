"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { asArray, platformApi, type Project } from "@/lib/platformiq-api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await platformApi.listProjects();
        setProjects(asArray<Project>(data, "projects"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Projects</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Manage PlatformIQ projects and the services inside them.
        </p>
      </div>

      {loading && <p className="text-[var(--text-muted)]">Loading projects...</p>}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-[var(--text-muted)]">
          No projects found.
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition hover:border-blue-500"
          >
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              {project.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {project.description || "No description"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
