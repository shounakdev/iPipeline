"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "PipelineIQ", href: "/pipelineiq" },
  { label: "Audit Logs", href: "/audit-logs" },
  { label: "Settings", href: "/settings" },
];

type Theme = "light" | "dark";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("dark");

  const isDark = theme === "dark";

  function applyTheme(nextTheme: Theme, shouldBroadcast = true) {
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);

    if (shouldBroadcast) {
      window.dispatchEvent(
        new CustomEvent("platform-theme-change", { detail: nextTheme })
      );
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme, false);
    } else {
      applyTheme("dark", false);
    }

    function handlePlatformThemeChange(event: Event) {
      const themeEvent = event as CustomEvent<Theme>;

      if (themeEvent.detail === "light" || themeEvent.detail === "dark") {
        applyTheme(themeEvent.detail, false);
      }
    }

    window.addEventListener("platform-theme-change", handlePlatformThemeChange);

    return () => {
      window.removeEventListener(
        "platform-theme-change",
        handlePlatformThemeChange
      );
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
  }

  const themeVars = {
    "--page-bg": isDark ? "#020617" : "#f8fafc",
    "--sidebar-bg": isDark ? "#0f172a" : "#ffffff",
    "--sidebar-border": isDark ? "#1e293b" : "#e2e8f0",

    "--text-main": isDark ? "#f8fafc" : "#0f172a",
    "--text-muted": isDark ? "#cbd5e1" : "#475569",

    "--nav-text": isDark ? "#ffffff" : "#0f172a",
    "--nav-hover": isDark ? "#1e293b" : "#e2e8f0",

    "--card-bg": isDark ? "#111827" : "#ffffff",
    "--card-border": isDark ? "#334155" : "#e2e8f0",

    "--button-bg": isDark ? "#f8fafc" : "#111827",
    "--button-text": isDark ? "#020617" : "#ffffff",
  } as CSSProperties;

  return (
    <div
      style={themeVars}
      className="min-h-screen bg-[var(--page-bg)] text-[var(--text-main)] transition-colors"
    >
      <div className="flex min-h-screen">
        <aside className="flex min-h-screen w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-6 transition-colors">
          <Link href="/" className="block">
            <div
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-main)" }}
            >
              PlatformIQ
            </div>

            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Intelligent software delivery platform
            </p>
          </Link>

          <button
            onClick={toggleTheme}
            className="mt-6 rounded-full border border-[var(--sidebar-border)] bg-[var(--button-bg)] px-4 py-2 text-sm font-semibold transition"
            style={{ color: "var(--button-text)" }}
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    active ? "bg-blue-600" : "hover:bg-[var(--nav-hover)]"
                  }`}
                  style={{
                    color: active ? "#ffffff" : "var(--nav-text)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 bg-[var(--page-bg)] p-8 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
