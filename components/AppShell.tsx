"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser, logout } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "PipelineIQ", href: "/pipelineiq" },
  { label: "Deployments", href: "/deployments" },
  { label: "Event Explorer", href: "/events" },
  { label: "Observability", href: "/observability" },
  { label: "Incidents", href: "/incidents" },
  { label: "Reliability", href: "/reliability" },
  { label: "Audit Logs", href: "/audit-logs" },
  { label: "Settings", href: "/settings" },
];

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    /*
     * Run the initial browser-only auth check asynchronously.
     * This avoids calling setState directly in the effect body.
     */
    const timer = window.setTimeout(() => {
      setUser(getCurrentUser());
    }, 0);

    function handleAuthChange() {
      setUser(getCurrentUser());
    }

    window.addEventListener(
      "platform-auth-change",
      handleAuthChange,
    );
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "platform-auth-change",
        handleAuthChange,
      );

      window.removeEventListener(
        "storage",
        handleAuthChange,
      );
    };
  }, []);

  function handleLogout() {
    logout();
    setUser(null);

    window.dispatchEvent(
      new Event("platform-auth-change"),
    );

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen">
        <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          {/* Logo */}
          <Link href="/" className="block">
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              PlatformIQ
            </div>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Intelligent software delivery platform
            </p>
          </Link>

          {/* User information */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition-colors dark:border-slate-700 dark:bg-slate-800/60">
            {user ? (
              <>
                <p className="break-words font-semibold text-slate-950 dark:text-slate-50">
                  {user.email}
                </p>

                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Role: {user.role}
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block rounded-lg bg-blue-600 px-3 py-2 text-center font-medium text-white transition hover:bg-blue-500"
              >
                Login
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 space-y-2">
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
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-800 hover:bg-slate-200 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance
            </p>

            <ThemeToggle />
          </div>
        </aside>

        {/* Page content */}
        <main className="min-w-0 flex-1 bg-slate-50 p-8 transition-colors duration-200 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}