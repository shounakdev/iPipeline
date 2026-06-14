"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Theme = "light" | "dark";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type PipelineLogObject = {
  timestamp?: string;
  created_at?: string;
  level?: string;
  message?: string;
  line?: string;
  [key: string]: JsonValue | undefined;
};

type PipelineLog = string | PipelineLogObject;

type SonarIssue = {
  key?: string;
  rule?: string;
  severity?: string;
  component?: string;
  message?: string;
  line?: number | null;
  type?: string;
  [key: string]: JsonValue | undefined;
};

type Pipeline = {
  id: string;
  repo_url: string;
  branch: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_seconds?: number | null;
  coverage?: number | null;
  bugs?: number | null;
  vulnerabilities?: number | null;
  code_smells?: number | null;
  duplicated_lines_density?: number | null;
  quality_gate?: string | null;
  sonar_report_url?: string | null;
  sonar_issues?: SonarIssue[] | null;
  logs?: PipelineLog[] | null;
};



export default function PipelineDetailPage() {
  const params = useParams<{ id: string }>();
  const pipelineId = params.id;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>("light");

  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    const savedTheme = window.localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, 0);

  return () => window.clearTimeout(timer);
}, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handlePlatformThemeChange(event: Event) {
      const themeEvent = event as CustomEvent<Theme>;

      if (themeEvent.detail === "light" || themeEvent.detail === "dark") {
        setTheme(themeEvent.detail);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== "theme") return;

      if (event.newValue === "light" || event.newValue === "dark") {
        setTheme(event.newValue);
      }
    }

    window.addEventListener("platform-theme-change", handlePlatformThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "platform-theme-change",
        handlePlatformThemeChange
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPipeline() {
      try {
        const response = await fetch(`${API_URL}/pipeline/${pipelineId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pipeline ${pipelineId}`);
        }

        const data = (await response.json()) as Pipeline;

        if (cancelled) return;

        setPipeline(data);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Failed to load pipeline details"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const initialLoad = window.setTimeout(() => {
      void loadPipeline();
    }, 0);

    const interval = window.setInterval(() => {
      void loadPipeline();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [API_URL, pipelineId]);

  function getStatusColor(status?: string) {
    if (status === "SUCCESS") return "#16a34a";
    if (status === "FAILED") return "#dc2626";
    if (status === "RUNNING") return "#2563eb";

    return "#ca8a04";
  }

  function getGateColor(gate?: string | null) {
    if (gate === "PASSED" || gate === "OK") return "#16a34a";
    if (gate === "FAILED" || gate === "ERROR") return "#dc2626";

    return isDark ? "#cbd5e1" : "#6b7280";
  }

  function formatValue(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "-";
    return value;
  }

  function renderLog(log: PipelineLog, index: number) {
    if (typeof log === "string") {
      return (
        <div key={index} style={styles.logLineStyle}>
          {log}
        </div>
      );
    }

    const label = log.timestamp || log.created_at || `Log ${index + 1}`;
    const message = log.message || log.line || JSON.stringify(log);

    return (
      <div key={index} style={styles.logLineStyle}>
        <span style={styles.logMetaStyle}>{label}</span> {message}
      </div>
    );
  }

  if (loading) {
    return <main style={styles.mainStyle}>Loading pipeline...</main>;
  }

  if (error) {
    return (
      <main style={styles.mainStyle}>
        <Link href="/pipelineiq" style={styles.linkStyle}>
          ← Back to PipelineIQ
        </Link>

        <div style={styles.errorBoxStyle}>{error}</div>
      </main>
    );
  }

  if (!pipeline) {
    return (
      <main style={styles.mainStyle}>
        <Link href="/pipelineiq" style={styles.linkStyle}>
          ← Back to PipelineIQ
        </Link>

        <p style={styles.mutedTextStyle}>Pipeline not found.</p>
      </main>
    );
  }

  return (
    <main style={styles.mainStyle}>
      <Link href="/pipelineiq" style={styles.linkStyle}>
        ← Back to PipelineIQ
      </Link>

      <div style={styles.headerStyle}>
        <div>
          <h1 style={styles.titleStyle}>Pipeline Details</h1>
          <p style={styles.subtitleStyle}>{pipeline.id}</p>
        </div>

        <span
          style={{
            ...styles.statusBadgeStyle,
            background: getStatusColor(pipeline.status),
          }}
        >
          {pipeline.status}
        </span>
      </div>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Repository</h2>

        <div style={styles.gridStyle}>
          <Info label="Repo" value={pipeline.repo_url} styles={styles} />
          <Info label="Branch" value={pipeline.branch} styles={styles} />
          <Info
            label="Created"
            value={formatValue(pipeline.created_at)}
            styles={styles}
          />
          <Info
            label="Updated"
            value={formatValue(pipeline.updated_at)}
            styles={styles}
          />
        </div>
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Execution</h2>

        <div style={styles.gridStyle}>
          <Info
            label="Started"
            value={formatValue(pipeline.started_at)}
            styles={styles}
          />
          <Info
            label="Finished"
            value={formatValue(pipeline.finished_at)}
            styles={styles}
          />
          <Info
            label="Duration"
            value={
              pipeline.duration_seconds !== null &&
              pipeline.duration_seconds !== undefined
                ? `${pipeline.duration_seconds.toFixed(1)}s`
                : "-"
            }
            styles={styles}
          />
          <Info
            label="Quality Gate"
            value={
              <span style={{ color: getGateColor(pipeline.quality_gate) }}>
                {pipeline.quality_gate || "-"}
              </span>
            }
            styles={styles}
          />
        </div>
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>SonarQube Metrics</h2>

        <div style={styles.gridStyle}>
          <Info
            label="Coverage"
            value={
              pipeline.coverage !== null && pipeline.coverage !== undefined
                ? `${pipeline.coverage}%`
                : "-"
            }
            styles={styles}
          />
          <Info
            label="Bugs"
            value={formatValue(pipeline.bugs)}
            styles={styles}
          />
          <Info
            label="Vulnerabilities"
            value={formatValue(pipeline.vulnerabilities)}
            styles={styles}
          />
          <Info
            label="Code Smells"
            value={formatValue(pipeline.code_smells)}
            styles={styles}
          />
        </div>

        {pipeline.sonar_report_url && (
          <a
            href={pipeline.sonar_report_url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.externalLinkStyle}
          >
            Open SonarQube Report →
          </a>
        )}
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>SonarQube Issues</h2>

        {pipeline.sonar_issues?.length ? (
          <div style={styles.issueListStyle}>
            {pipeline.sonar_issues.map((issue, index) => (
              <div key={issue.key || index} style={styles.issueCardStyle}>
                <div style={styles.issueHeaderStyle}>
                  <span>{issue.severity || "UNKNOWN"}</span>
                  <span>{issue.type || issue.rule || "Issue"}</span>
                </div>

                <p style={styles.issueMessageStyle}>
                  {issue.message || "No message"}
                </p>

                <p style={styles.mutedTextStyle}>
                  {issue.component || "Unknown component"}
                  {issue.line ? `:${issue.line}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.mutedTextStyle}>No SonarQube issues found.</p>
        )}
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Logs</h2>

        {pipeline.logs?.length ? (
          <div style={styles.logBoxStyle}>
            {pipeline.logs.map((log, index) => renderLog(log, index))}
          </div>
        ) : (
          <p style={styles.mutedTextStyle}>No logs available yet.</p>
        )}
      </section>
    </main>
  );
}

function Info({
  label,
  value,
  styles,
}: {
  label: string;
  value: string | number | React.ReactNode;
  styles: Record<string, CSSProperties>;
}) {
  return (
    <div>
      <div style={styles.infoLabelStyle}>{label}</div>
      <div style={styles.infoValueStyle}>{value}</div>
    </div>
  );
}

function getStyles(isDark: boolean): Record<string, CSSProperties> {
  const colors = {
    pageBg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "#0f172a" : "#ffffff",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#cbd5e1" : "#475569",
    border: isDark ? "#334155" : "#e2e8f0",
    link: isDark ? "#60a5fa" : "#2563eb",
    logBg: isDark ? "#020617" : "#f1f5f9",
    errorBg: isDark ? "#450a0a" : "#fee2e2",
    errorText: isDark ? "#fecaca" : "#991b1b",
  };

  return {
    mainStyle: {
      padding: "40px",
      minHeight: "100vh",
      background: colors.pageBg,
      color: colors.text,
      fontFamily: "Arial",
    },

    headerStyle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      marginTop: "24px",
      marginBottom: "24px",
    },

    titleStyle: {
      fontSize: "32px",
      marginBottom: "8px",
      color: colors.text,
    },

    subtitleStyle: {
      color: colors.muted,
      wordBreak: "break-all",
    },

    cardStyle: {
      background: colors.cardBg,
      color: colors.text,
      padding: "24px",
      borderRadius: "12px",
      marginBottom: "24px",
      border: `1px solid ${colors.border}`,
    },

    sectionTitleStyle: {
      fontSize: "22px",
      marginBottom: "16px",
      color: colors.text,
    },

    gridStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "16px",
    },

    infoLabelStyle: {
      color: colors.muted,
      fontSize: "14px",
      marginBottom: "6px",
    },

    infoValueStyle: {
      color: colors.text,
      fontWeight: 600,
      wordBreak: "break-all",
    },

    linkStyle: {
      color: colors.link,
      fontWeight: 600,
      textDecoration: "none",
    },

    externalLinkStyle: {
      display: "inline-block",
      marginTop: "16px",
      color: colors.link,
      fontWeight: 600,
      textDecoration: "none",
    },

    statusBadgeStyle: {
      color: "#ffffff",
      padding: "8px 12px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },

    issueListStyle: {
      display: "grid",
      gap: "12px",
    },

    issueCardStyle: {
      border: `1px solid ${colors.border}`,
      borderRadius: "10px",
      padding: "14px",
      background: colors.pageBg,
    },

    issueHeaderStyle: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      fontSize: "13px",
      fontWeight: 700,
      color: colors.muted,
      marginBottom: "8px",
    },

    issueMessageStyle: {
      color: colors.text,
      marginBottom: "8px",
    },

    logBoxStyle: {
      background: colors.logBg,
      border: `1px solid ${colors.border}`,
      borderRadius: "10px",
      padding: "16px",
      maxHeight: "420px",
      overflow: "auto",
      fontFamily: "monospace",
      fontSize: "13px",
      lineHeight: "1.6",
    },

    logLineStyle: {
      color: colors.text,
      marginBottom: "6px",
      whiteSpace: "pre-wrap",
    },

    logMetaStyle: {
      color: colors.muted,
      marginRight: "8px",
    },

    mutedTextStyle: {
      color: colors.muted,
    },

    errorBoxStyle: {
      marginTop: "24px",
      padding: "16px",
      borderRadius: "10px",
      background: colors.errorBg,
      color: colors.errorText,
      border: `1px solid ${colors.errorText}`,
    },
  };
}