export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-main)]">
        Settings
      </h1>

      <p className="mt-2 text-[var(--text-muted)]">
        PlatformIQ settings page is ready.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text-main)]">
          Workspace Settings
        </h2>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Future settings can include organization details, integrations,
          repository providers, pipeline defaults, and access control.
        </p>
      </div>
    </div>
  );
}
