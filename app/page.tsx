import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-main)]">
        PlatformIQ Dashboard
      </h1>

      <p className="mt-2 text-[var(--text-muted)]">
        Control plane for projects, services, pipelines, audit logs, and platform settings.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Link
          href="/projects"
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition hover:bg-[var(--nav-hover)]"
        >
          <h2 className="text-xl font-semibold text-[var(--text-main)]">
            Projects
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Manage PlatformIQ projects and linked services.
          </p>
        </Link>

        <Link
          href="/services"
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition hover:bg-[var(--nav-hover)]"
        >
          <h2 className="text-xl font-semibold text-[var(--text-main)]">
            Services
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            View services, repositories, environments, and pipelines.
          </p>
        </Link>

        <Link
          href="/pipelineiq"
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition hover:bg-[var(--nav-hover)]"
        >
          <h2 className="text-xl font-semibold text-[var(--text-main)]">
            PipelineIQ
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Trigger and monitor intelligent CI/CD pipeline runs.
          </p>
        </Link>
      </div>
    </div>
  );
}
