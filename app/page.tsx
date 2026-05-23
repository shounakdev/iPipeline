"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Pipeline = {
  id: string;
  repo_url: string;
  branch: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  coverage?: number | null;
  bugs?: number | null;
  vulnerabilities?: number | null;
  code_smells?: number | null;
  quality_gate?: string | null;
};

type Metrics = {
  total_pipelines: number;
  success_rate: number;
  failure_rate: number;
  avg_pipeline_time_seconds: number;
};

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedTestScript, setCopiedTestScript] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  const testScriptSnippet = `"test": "echo \\"No tests configured yet\\" && exit 0"`;

  async function fetchPipelines() {
    const res = await fetch(`${API_URL}/pipelines`, {
      cache: "no-store",
    });

    const data = await res.json();
    setPipelines(data);
  }

  async function fetchMetrics() {
    try {
      const res = await fetch(`${API_URL}/metrics`, {
        cache: "no-store",
      });

      const data = await res.json();
      setMetrics(data);
    } catch {
      setMetrics(null);
    }
  }

  async function triggerPipeline() {
    setLoading(true);

    await fetch(`${API_URL}/pipeline/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo_url: repoUrl,
        branch,
      }),
    });

    await fetchPipelines();
    await fetchMetrics();

    setLoading(false);
  }

  async function copyTestScript() {
    try {
      await navigator.clipboard.writeText(testScriptSnippet);
      setCopiedTestScript(true);

      setTimeout(() => {
        setCopiedTestScript(false);
      }, 1500);
    } catch {
      setCopiedTestScript(false);
    }
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
    fetchPipelines();
    fetchMetrics();

    const interval = setInterval(() => {
      fetchPipelines();
      fetchMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function getStatusColor(status: string) {
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

  return (
    <main style={styles.mainStyle}>
      <div style={styles.headerRowStyle}>
        <div>
          <h1 style={styles.pageTitleStyle}>Intelligent CI/CD Platform</h1>

          <p style={styles.pageSubtitleStyle}>
            Real repo execution, SonarQube quality checks, and AI DevOps
            summaries.
          </p>
        </div>

        <button onClick={toggleTheme} style={styles.themeToggleButtonStyle}>
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Currently Supported Project Types</h2>

        <p style={styles.sectionDescriptionStyle}>
          This MVP currently supports JavaScript/TypeScript projects that use
          npm-based install, test, and build commands.
        </p>

        <div style={styles.supportGridStyle}>
          <div>
            <h3 style={styles.supportedTitleStyle}>Supported Now</h3>

            <ul style={styles.listStyle}>
              <li>Node.js</li>
              <li>React</li>
              <li>Next.js</li>
              <li>Vite</li>
              <li>Express.js</li>
              <li>Basic TypeScript/JavaScript apps</li>
            </ul>
          </div>

          <div>
            <h3 style={styles.comingSoonTitleStyle}>Support Coming Soon</h3>

            <ul style={styles.listStyle}>
              <li>Java Maven / Spring Boot</li>
              <li>Python / FastAPI / Django</li>
              <li>Go</li>
              <li>Rust</li>
              <li>.NET</li>
              <li>Monorepos with multiple apps</li>
              <li>Docker-based custom build commands</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>How to Use This Platform</h2>

        <p style={styles.sectionDescriptionStyle}>
          Before triggering a pipeline, make sure your repository is using a
          supported JavaScript or TypeScript setup and has the required npm
          scripts in package.json.
        </p>

        <div style={styles.instructionGridStyle}>
          <div>
            <h3 style={styles.supportedTitleStyle}>Before Running a Pipeline</h3>

            <ul style={styles.listStyle}>
              <li>
                Use a supported repo type like Next.js, React, Vite, Express.js,
                or a basic Node.js project.
              </li>
              <li>
                Make sure the repository has a <strong>package.json</strong>{" "}
                file in the root folder.
              </li>
              <li>
                Make sure <strong>build</strong> and <strong>test</strong>{" "}
                scripts exist inside package.json.
              </li>
              <li>
                If your project does not have tests yet, add a safe placeholder
                test script.
              </li>
              <li>
                If your code is in a feature branch, enter that exact branch
                name in the Branch field.
              </li>
              <li>
                If you changed package.json on a feature branch, push that
                branch before running the pipeline.
              </li>
            </ul>
          </div>

          <div>
            <h3 style={styles.comingSoonTitleStyle}>
              Required package.json Example
            </h3>

            <div style={styles.copyCodeRowStyle}>
              <code style={styles.inlineCodeStyle}>{testScriptSnippet}</code>

              <button onClick={copyTestScript} style={styles.copyButtonStyle}>
                {copiedTestScript ? "Copied!" : "Copy"}
              </button>
            </div>

            <pre style={styles.codeBlockStyle}>{`{
  "name": "meetup",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "server": "node server.js",
    "test": "echo \\"No tests configured yet\\" && exit 0"
  },
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`}</pre>
          </div>
        </div>

        <p style={styles.noteStyle}>
          Example: If your branch is <strong>feature/login-page</strong>, type{" "}
          <strong>feature/login-page</strong> in the Branch input. Do not leave
          it as main unless you want to run the main branch.
        </p>
      </section>

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Trigger Pipeline</h2>

        <input
          placeholder="Repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={styles.repoInputStyle}
        />

        <input
          placeholder="Branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          style={styles.branchInputStyle}
        />

        <button
          onClick={triggerPipeline}
          disabled={loading}
          style={{
            ...styles.buttonStyle,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Triggering..." : "Run Pipeline"}
        </button>
      </section>

      {metrics && (
        <section style={styles.metricsGridStyle}>
          <MetricCard
            title="Total Pipelines"
            value={metrics.total_pipelines}
            styles={styles}
          />
          <MetricCard
            title="Success Rate"
            value={`${metrics.success_rate}%`}
            styles={styles}
          />
          <MetricCard
            title="Failure Rate"
            value={`${metrics.failure_rate}%`}
            styles={styles}
          />
          <MetricCard
            title="Avg Time"
            value={`${metrics.avg_pipeline_time_seconds}s`}
            styles={styles}
          />
        </section>
      )}

      <section style={styles.cardStyle}>
        <h2 style={styles.sectionTitleStyle}>Pipelines</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.tableStyle}>
            <thead>
              <tr style={styles.tableHeaderRowStyle}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Repo</th>
                <th style={styles.th}>Branch</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Quality Gate</th>
                <th style={styles.th}>Coverage</th>
                <th style={styles.th}>Issues</th>
                <th style={styles.th}>Duration</th>
              </tr>
            </thead>

            <tbody>
              {pipelines.map((pipeline) => (
                <tr key={pipeline.id} style={styles.tableRowStyle}>
                  <td style={styles.td}>
                    <Link
                      href={`/pipeline/${pipeline.id}`}
                      style={styles.linkStyle}
                    >
                      {pipeline.id.slice(0, 8)}
                    </Link>
                  </td>

                  <td style={styles.td}>{pipeline.repo_url}</td>
                  <td style={styles.td}>{pipeline.branch}</td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadgeStyle,
                        background: getStatusColor(pipeline.status),
                      }}
                    >
                      {pipeline.status}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        color: getGateColor(pipeline.quality_gate),
                        fontWeight: 600,
                      }}
                    >
                      {pipeline.quality_gate || "-"}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {pipeline.coverage !== null &&
                    pipeline.coverage !== undefined
                      ? `${pipeline.coverage}%`
                      : "-"}
                  </td>

                  <td style={styles.td}>
                    Bugs: {pipeline.bugs ?? "-"} | Vuln:{" "}
                    {pipeline.vulnerabilities ?? "-"} | Smells:{" "}
                    {pipeline.code_smells ?? "-"}
                  </td>

                  <td style={styles.td}>
                    {pipeline.duration_seconds
                      ? `${pipeline.duration_seconds.toFixed(1)}s`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function MetricCard({
  title,
  value,
  styles,
}: {
  title: string;
  value: string | number;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <div style={styles.metricCardStyle}>
      <p style={styles.metricTitleStyle}>{title}</p>
      <h3 style={styles.metricValueStyle}>{value}</h3>
    </div>
  );
}

function getStyles(isDark: boolean): Record<string, CSSProperties> {
  const colors = {
    pageBg: isDark ? "#020617" : "#f8fafc",
    cardBg: isDark ? "#0f172a" : "#ffffff",
    cardBgSoft: isDark ? "#111827" : "#f8fafc",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#cbd5e1" : "#475569",
    subtle: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    strongBorder: isDark ? "#475569" : "#cbd5e1",
    tableHeader: isDark ? "#1e293b" : "#f1f5f9",
    inputBg: isDark ? "#020617" : "#ffffff",
    codeBg: isDark ? "#020617" : "#0f172a",
    codeText: "#e2e8f0",
    buttonBg: isDark ? "#f8fafc" : "#111827",
    buttonText: isDark ? "#020617" : "#ffffff",
    link: isDark ? "#60a5fa" : "#2563eb",
    green: isDark ? "#4ade80" : "#166534",
    amber: isDark ? "#fbbf24" : "#92400e",
    noteBg: isDark ? "#1e293b" : "#f1f5f9",
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
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "30px",
    },

    pageTitleStyle: {
      fontSize: "32px",
      marginBottom: "8px",
      color: colors.text,
    },

    pageSubtitleStyle: {
      color: colors.muted,
      marginBottom: "0",
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

    cardStyle: {
      background: colors.cardBg,
      color: colors.text,
      padding: "24px",
      borderRadius: "12px",
      marginBottom: "24px",
      boxShadow: colors.shadow,
      border: `1px solid ${colors.border}`,
      transition: "background 0.2s ease, border 0.2s ease",
    },

    sectionTitleStyle: {
      fontSize: "22px",
      marginBottom: "16px",
      color: colors.text,
    },

    sectionDescriptionStyle: {
      color: colors.muted,
      marginBottom: "12px",
    },

    supportGridStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
    },

    instructionGridStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
      alignItems: "start",
    },

    supportedTitleStyle: {
      fontSize: "16px",
      marginBottom: "10px",
      color: colors.green,
    },

    comingSoonTitleStyle: {
      fontSize: "16px",
      marginBottom: "10px",
      color: colors.amber,
    },

    listStyle: {
      lineHeight: "1.8",
      color: colors.text,
      paddingLeft: "20px",
    },

    copyCodeRowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      background: colors.cardBgSoft,
      border: `1px solid ${colors.strongBorder}`,
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "14px",
    },

    inlineCodeStyle: {
      fontSize: "13px",
      color: colors.text,
      overflowX: "auto",
      whiteSpace: "nowrap",
    },

    copyButtonStyle: {
      padding: "8px 12px",
      borderRadius: "8px",
      background: colors.buttonBg,
      color: colors.buttonText,
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },

    codeBlockStyle: {
      background: colors.codeBg,
      color: colors.codeText,
      padding: "16px",
      borderRadius: "10px",
      fontSize: "13px",
      lineHeight: "1.6",
      overflowX: "auto",
      whiteSpace: "pre",
      border: `1px solid ${colors.strongBorder}`,
    },

    noteStyle: {
      marginTop: "18px",
      padding: "14px",
      borderRadius: "10px",
      background: colors.noteBg,
      color: colors.muted,
      border: `1px solid ${colors.strongBorder}`,
      lineHeight: "1.6",
    },

    repoInputStyle: {
      padding: "12px",
      width: "420px",
      marginRight: "10px",
      border: `1px solid ${colors.strongBorder}`,
      borderRadius: "8px",
      background: colors.inputBg,
      color: colors.text,
      outline: "none",
    },

    branchInputStyle: {
      padding: "12px",
      width: "120px",
      marginRight: "10px",
      border: `1px solid ${colors.strongBorder}`,
      borderRadius: "8px",
      background: colors.inputBg,
      color: colors.text,
      outline: "none",
    },

    buttonStyle: {
      padding: "12px 20px",
      borderRadius: "8px",
      background: colors.buttonBg,
      color: colors.buttonText,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },

    metricsGridStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    },

    metricCardStyle: {
      background: colors.cardBg,
      padding: "20px",
      borderRadius: "12px",
      boxShadow: colors.shadow,
      border: `1px solid ${colors.border}`,
    },

    metricTitleStyle: {
      color: colors.subtle,
      marginBottom: "8px",
    },

    metricValueStyle: {
      fontSize: "24px",
      color: colors.text,
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

    linkStyle: {
      color: colors.link,
      fontWeight: 600,
    },

    statusBadgeStyle: {
      color: "#ffffff",
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
    },

    footerStyle: {
      marginTop: "40px",
      padding: "20px 0",
      textAlign: "center",
      color: colors.muted,
      fontSize: "14px",
      borderTop: `1px solid ${colors.border}`,
    },

    footerLinkStyle: {
      color: colors.link,
      fontWeight: 600,
      textDecoration: "none",
    },
  };
}