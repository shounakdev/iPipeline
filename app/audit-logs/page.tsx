export default function AuditLogsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-main)]">
        Audit Logs
      </h1>

      <p className="mt-2 text-[var(--text-muted)]">
        Audit log frontend shell is ready. Backend audit event listing can be
        connected in the next patch.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-[var(--text-muted)]">
        PlatformIQ will use this page to show user actions such as project
        creation, service creation, repository linking, and pipeline triggers.
      </div>
    </div>
  );
}
