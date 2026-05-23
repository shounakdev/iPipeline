"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PipelineDetailsPage() {
  const params = useParams();
  const pipelineId = params.id as string;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [pipeline, setPipeline] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  async function fetchPipeline() {
    const res = await fetch(`${API_URL}/pipeline/${pipelineId}`, {
      cache: "no-store",
    });

    const data = await res.json();
    setPipeline(data);
  }

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();

    const interval = setInterval(() => {
      fetchPipeline();
    }, 3000);

    return () => clearInterval(interval);
  }, [pipelineId]);

  if (!pipeline) {
    return (
      <main style={styles.mainStyle}>
        <div style={styles.headerRowStyle}>
          <Link href="/" style={styles.backLinkStyle}>
            Back to dashboard
          </Link>

          <button onClick={toggleTheme} style={styles.themeToggleButtonStyle}>
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <p style={styles.pageSubtitleStyle}>Loading pipeline...</p>
      </main>
    );
  }

  const aiReport = pipeline.analysis?.report_json;
  const priorityItems = aiReport?.priority_items || [];

  return (
    <main style={styles.mainStyle}>
      <div style={styles.headerRowStyle}>
        <Link href="/" style={styles.backLinkStyle}>
          Back to dashboard
        </Link>

        <button onClick={toggleTheme} style={styles.themeToggleButtonStyle}>
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <h1 style={styles.pageTitleStyle}>Pipeline Details</h1>

      <p style={styles.pageSubtitleStyle}>{pipeline.id}</p>

      <section style={styles.gridStyle}>
        <InfoCard title="Status" value={pipeline.status} styles={styles} />

        <InfoCard
          title="Quality Gate"
          value={pipeline.quality_gate || "-"}
          styles={styles}
        />

        <InfoCard
          title="Coverage"
          value={
            pipeline.coverage !== null && pipeline.coverage !== undefined
              ? `${pipeline.coverage}%`
              : "-"
          }
          styles={styles}
        />

        <InfoCard
          title="Duration"
          value={
            pipeline.duration_seconds
              ? `${pipeline.duration_seconds.toFixed(1)}s`
              : "-"
          }
          styles={styles}
        />
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Repository</h2>

        <p style={styles.paragraphStyle}>
          <strong>Repo:</strong> {pipeline.repo_url}
        </p>

        <p style={styles.paragraphStyle}>
          <strong>Branch:</strong> {pipeline.branch}
        </p>

        <p style={styles.paragraphStyle}>
          <strong>Created:</strong>{" "}
          {new Date(pipeline.created_at).toLocaleString()}
        </p>
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>SonarQube Metrics</h2>

        <div style={styles.gridStyle}>
          <InfoCard title="Bugs" value={pipeline.bugs ?? "-"} styles={styles} />

          <InfoCard
            title="Vulnerabilities"
            value={pipeline.vulnerabilities ?? "-"}
            styles={styles}
          />

          <InfoCard
            title="Code Smells"
            value={pipeline.code_smells ?? "-"}
            styles={styles}
          />

          <InfoCard
            title="Duplication"
            value={
              pipeline.duplicated_lines_density !== null &&
              pipeline.duplicated_lines_density !== undefined
                ? `${pipeline.duplicated_lines_density}%`
                : "-"
            }
            styles={styles}
          />
        </div>

        {pipeline.sonar_report_url && (
          <a
            href={pipeline.sonar_report_url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.primaryLinkButtonStyle}
          >
            Open SonarQube Report
          </a>
        )}
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>SonarQube Issues</h2>

        {pipeline.sonar_issues && pipeline.sonar_issues.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.tableStyle}>
              <thead>
                <tr style={styles.tableHeaderRowStyle}>
                  <th style={styles.th}>Severity</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Line</th>
                </tr>
              </thead>

              <tbody>
                {pipeline.sonar_issues.map((issue: any) => (
                  <tr key={issue.key} style={styles.tableRowStyle}>
                    <td style={styles.td}>{issue.severity}</td>
                    <td style={styles.td}>{issue.type}</td>
                    <td style={styles.td}>{issue.message}</td>
                    <td style={styles.td}>{issue.line || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.paragraphStyle}>No SonarQube issues returned.</p>
        )}
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>AI DevOps Summary</h2>

        {aiReport ? (
          <>
            <p style={styles.paragraphStyle}>
              <strong>Final Status:</strong>{" "}
              <span style={{ fontWeight: 700 }}>{aiReport.final_status}</span>
            </p>

            <p style={styles.paragraphStyle}>
              <strong>Overall Summary:</strong> {aiReport.overall_summary}
            </p>

            <p style={styles.paragraphStyle}>
              <strong>Log Summary:</strong> {aiReport.log_summary}
            </p>

            <p style={styles.paragraphStyle}>
              <strong>SonarQube Summary:</strong> {aiReport.sonarqube_summary}
            </p>

            <p style={styles.paragraphStyle}>
              <strong>Confidence:</strong> {aiReport.confidence}
            </p>

            <h3 style={styles.subSectionTitleStyle}>Priority Items</h3>

            {priorityItems.length > 0 ? (
              <div style={styles.priorityGridStyle}>
                {priorityItems.map((item: any, index: number) => (
                  <div key={index} style={styles.priorityItemCardStyle}>
                    <p style={styles.paragraphStyle}>
                      <strong>Priority:</strong>{" "}
                      <span
                        style={{
                          color: getPriorityColor(item.priority),
                          fontWeight: 700,
                        }}
                      >
                        {item.priority}
                      </span>
                    </p>

                    <p style={styles.paragraphStyle}>
                      <strong>Issue:</strong> {item.issue}
                    </p>

                    <p style={styles.paragraphStyle}>
                      <strong>Why it matters:</strong> {item.why_it_matters}
                    </p>

                    <p style={styles.paragraphStyle}>
                      <strong>Suggested fix:</strong> {item.suggested_fix}
                    </p>

                    {item.helpful_link && (
                      <a
                        href={item.helpful_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkStyle}
                      >
                        Helpful Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.paragraphStyle}>No priority items.</p>
            )}

            <h3 style={styles.subSectionTitleStyle}>How to Pass / Improve</h3>

            <ul style={styles.listStyle}>
              {(aiReport.how_to_pass || []).map(
                (step: string, index: number) => (
                  <li key={index}>{step}</li>
                )
              )}
            </ul>
          </>
        ) : (
          <p style={styles.paragraphStyle}>No AI summary available yet.</p>
        )}
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Logs</h2>

        <pre style={styles.logBlockStyle}>
          {pipeline.logs && pipeline.logs.length > 0
            ? pipeline.logs.join("\n\n")
            : "No logs yet."}
        </pre>
      </section>

      <footer style={styles.footerStyle}>
        Made by{" "}
        <a
          href="https://linktr.ee/_shounakchandra"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLinkStyle}
        >
          Shounak
        </a>{" "}
        © 2026
      </footer>
    </main>
  );
}

function InfoCard({
  title,
  value,
  styles,
}: {
  title: string;
  value: string | number;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <div style={styles.infoCardStyle}>
      <p style={styles.infoCardTitleStyle}>{title}</p>
      <h3 style={styles.infoCardValueStyle}>{value}</h3>
    </div>
  );
}

function getPriorityColor(priority: string) {
  if (priority === "HIGH") return "#dc2626";
  if (priority === "MEDIUM") return "#ca8a04";

  return "#16a34a";
}

function getStyles(isDark: boolean): Record<string, CSSProperties> {
  const colors = {
    pageBg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "#0f172a" : "#ffffff",
    infoCardBg: isDark ? "#111827" : "#f8fafc",
    priorityCardBg: isDark ? "#111827" : "#ffffff",
    tableHeader: isDark ? "#1e293b" : "#f1f5f9",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#cbd5e1" : "#64748b",
    subtle: isDark ? "#94a3b8" : "#475569",
    border: isDark ? "#334155" : "#e2e8f0",
    strongBorder: isDark ? "#475569" : "#cbd5e1",
    link: isDark ? "#60a5fa" : "#2563eb",
    buttonBg: isDark ? "#f8fafc" : "#2563eb",
    buttonText: isDark ? "#020617" : "#ffffff",
    shadow: isDark
      ? "0 1px 8px rgba(0,0,0,0.35)"
      : "0 1px 4px rgba(0,0,0,0.08)",
  };

  return {
    mainStyle: {
      padding: "40px",
      fontFamily: "Arial",
      background: colors.pageBg,
      minHeight: "100vh",
      color: colors.text,
      transition: "background 0.2s ease, color 0.2s ease",
    },

    headerRowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "20px",
    },

    backLinkStyle: {
      color: colors.link,
      textDecoration: "none",
      fontWeight: 600,
    },

    themeToggleButtonStyle: {
      padding: "10px 14px",
      borderRadius: "999px",
      background: colors.cardBg,
      color: colors.text,
      border: `1px solid ${colors.strongBorder}`,
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      boxShadow: colors.shadow,
      whiteSpace: "nowrap",
    },

    pageTitleStyle: {
      marginTop: "20px",
      fontSize: "32px",
      color: colors.text,
    },

    pageSubtitleStyle: {
      color: colors.muted,
      marginBottom: "24px",
    },

    cardStyle: {
      background: colors.cardBg,
      color: colors.text,
      padding: "24px",
      borderRadius: "12px",
      boxShadow: colors.shadow,
      marginBottom: "24px",
      border: `1px solid ${colors.border}`,
      transition: "background 0.2s ease, border 0.2s ease",
    },

    sectionTitleStyle: {
      fontSize: "22px",
      marginBottom: "16px",
      color: colors.text,
    },

    subSectionTitleStyle: {
      marginTop: "20px",
      marginBottom: "12px",
      color: colors.text,
    },

    paragraphStyle: {
      color: colors.text,
      lineHeight: "1.6",
    },

    gridStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    },

    infoCardStyle: {
      background: colors.infoCardBg,
      padding: "16px",
      borderRadius: "10px",
      border: `1px solid ${colors.border}`,
      color: colors.text,
    },

    infoCardTitleStyle: {
      color: colors.subtle,
      marginBottom: "8px",
      fontWeight: 600,
    },

    infoCardValueStyle: {
      fontSize: "22px",
      color: colors.text,
      fontWeight: 700,
    },

    primaryLinkButtonStyle: {
      display: "inline-block",
      marginTop: "16px",
      color: colors.buttonText,
      background: colors.buttonBg,
      padding: "10px 14px",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: 600,
    },

    tableStyle: {
      width: "100%",
      borderCollapse: "collapse",
    },

    tableHeaderRowStyle: {
      background: colors.tableHeader,
    },

    tableRowStyle: {
      borderBottom: `1px solid ${colors.border}`,
    },

    th: {
      padding: "12px",
      textAlign: "left",
      fontSize: "14px",
      color: colors.text,
      fontWeight: 700,
    },

    td: {
      padding: "12px",
      fontSize: "14px",
      verticalAlign: "top",
      color: colors.text,
    },

    priorityGridStyle: {
      display: "grid",
      gap: "12px",
    },

    priorityItemCardStyle: {
      border: `1px solid ${colors.strongBorder}`,
      borderRadius: "10px",
      padding: "14px",
      background: colors.priorityCardBg,
      color: colors.text,
    },

    listStyle: {
      lineHeight: "1.8",
      color: colors.text,
      paddingLeft: "20px",
    },

    linkStyle: {
      color: colors.link,
      fontWeight: 600,
    },

    logBlockStyle: {
      background: "#020617",
      color: "#22c55e",
      padding: "20px",
      borderRadius: "10px",
      overflowX: "auto",
      whiteSpace: "pre-wrap",
      maxHeight: "600px",
      border: `1px solid ${colors.strongBorder}`,
    },

    footerStyle: {
      marginTop: "32px",
      paddingTop: "20px",
      borderTop: `1px solid ${colors.border}`,
      textAlign: "center",
      color: colors.muted,
      fontSize: "14px",
    },

    footerLinkStyle: {
      color: colors.link,
      fontWeight: 600,
      textDecoration: "none",
    },
  };
}