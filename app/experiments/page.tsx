"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { CreateExperimentDialog } from "@/components/experiments/create-experiment-dialog";
import { ExperimentList } from "@/components/experiments/experiment-list";
import { RunExperimentDialog } from "@/components/experiments/run-experiment-dialog";
import {
  canManageExperiments,
  getAuthServerSnapshot,
  getAuthSnapshot,
  parseCurrentUser,
  subscribeToAuth,
} from "@/lib/auth";
import { isActiveRunStatus } from "@/lib/experiment-format";
import {
  abortExperimentRun,
  createExperiment,
  getExperimentListItems,
  startExperimentRun,
} from "@/lib/experiments-api";
import { listServices } from "@/lib/reliability-api";
import type { ExperimentCreateInput, ExperimentListItem } from "@/types/experiments";
import type { ServiceListItem } from "@/types/reliability";

export default function ExperimentsPage() {
  const rawUser = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthServerSnapshot);
  const canManage = canManageExperiments(parseCurrentUser(rawUser)?.role);
  const [items, setItems] = useState<ExperimentListItem[]>([]);
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [runTarget, setRunTarget] = useState<ExperimentListItem | null>(null);

  const loadExperiments = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const serviceList = await listServices();
      const names = new Map(serviceList.map((service) => [service.id, service.name]));
      const nextItems = await getExperimentListItems(names);
      setServices(serviceList);
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load experiments.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadExperiments(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadExperiments]);

  const hasActiveRun = items.some((item) => isActiveRunStatus(item.latestRun?.status));
  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = window.setInterval(() => void loadExperiments(true), 4000);
    return () => window.clearInterval(interval);
  }, [hasActiveRun, loadExperiments]);

  async function handleCreate(input: ExperimentCreateInput) {
    setCreateBusy(true);
    setActionError(null);
    try {
      await createExperiment(input);
      setCreateOpen(false);
      await loadExperiments(true);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Unable to create experiment.";
      setActionError(message);
      throw new Error(message);
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleStart() {
    if (!runTarget || !canManage) return;
    setBusyId(runTarget.experiment.id);
    setActionError(null);
    try {
      await startExperimentRun(runTarget.experiment.id);
      setRunTarget(null);
      await loadExperiments(true);
    } catch (startError) {
      setActionError(startError instanceof Error ? startError.message : "Unable to start run.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAbort(item: ExperimentListItem) {
    if (!canManage || !item.latestRun) return;
    if (!window.confirm(`Abort the active run for “${item.experiment.name}”?`)) return;
    setBusyId(item.experiment.id);
    setActionError(null);
    try {
      await abortExperimentRun(item.latestRun.id);
      await loadExperiments(true);
    } catch (abortError) {
      setActionError(abortError instanceof Error ? abortError.message : "Unable to abort run.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen text-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">Reliability lab</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Experiments</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Manage controlled failure scenarios and measure detection, diagnosis and recovery performance.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadExperiments()} disabled={loading} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">Refresh</button>
            <button type="button" onClick={() => setCreateOpen(true)} disabled={!canManage} title={!canManage ? "Admin or operator role required" : undefined} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Create experiment</button>
          </div>
        </header>

        {!canManage ? <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">You have read-only access. Starting, aborting and creating experiments requires an admin or operator role.</p> : null}
        {actionError ? <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{actionError}</p> : null}

        <section className="mt-8">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">Loading experiments…</div>
          ) : error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30"><h2 className="font-semibold text-red-700 dark:text-red-300">Could not load experiments</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p></div>
          ) : (
            <ExperimentList items={items} canManage={canManage} busyId={busyId} onStart={setRunTarget} onAbort={(item) => void handleAbort(item)} />
          )}
        </section>
      </div>

      <CreateExperimentDialog open={createOpen} services={services} busy={createBusy} error={actionError} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <RunExperimentDialog experiment={runTarget?.experiment ?? null} open={Boolean(runTarget)} busy={Boolean(busyId)} onClose={() => setRunTarget(null)} onConfirm={() => void handleStart()} />
    </main>
  );
}