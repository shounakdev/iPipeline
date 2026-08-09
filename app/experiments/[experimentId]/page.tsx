"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { BenchmarkSummary } from "@/components/experiments/benchmark-summary";
import { DiagnosisResult } from "@/components/experiments/diagnosis-result";
import { ExperimentStatusBadge } from "@/components/experiments/experiment-status-badge";
import { ExperimentTimeline } from "@/components/experiments/experiment-timeline";
import { LinkedPlatformEvents } from "@/components/experiments/linked-platform-events";
import { RunExperimentDialog } from "@/components/experiments/run-experiment-dialog";
import {
  canManageExperiments,
  getAuthServerSnapshot,
  getAuthSnapshot,
  parseCurrentUser,
  subscribeToAuth,
} from "@/lib/auth";
import {
  formatDateTime,
  formatExperimentLabel,
  isActiveRunStatus,
  nextPollDelay,
  readableValue,
} from "@/lib/experiment-format";
import {
  abortExperimentRun,
  getExperimentPageData,
  getExperimentRun,
  startExperimentRun,
} from "@/lib/experiments-api";
import type {
  Experiment,
  ExperimentBenchmark,
  ExperimentRun,
} from "@/types/experiments";

function ConfigurationCard({ experiment }: { experiment: Experiment }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Scenario configuration</h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scenario</dt><dd className="mt-1 font-medium">{formatExperimentLabel(experiment.scenario_type)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failure injected</dt><dd className="mt-1 font-medium">{formatExperimentLabel(experiment.failure_type)}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target service</dt><dd className="mt-1 break-all font-medium">{experiment.target_service_id}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environment</dt><dd className="mt-1 font-medium">{experiment.target_environment}</dd></div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50 sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Namespace</dt><dd className="mt-1 font-medium">{experiment.target_namespace}</dd></div>
      </dl>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><h3 className="text-sm font-semibold">Failure parameters</h3><dl className="mt-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">{Object.entries(experiment.failure_config).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-slate-100 py-2 first:pt-0 last:border-0 last:pb-0 dark:border-slate-800"><dt className="text-slate-500">{formatExperimentLabel(key)}</dt><dd className="break-all text-right font-medium">{readableValue(value)}</dd></div>)}</dl></div>
        <div><h3 className="text-sm font-semibold">Expected behavior</h3><dl className="mt-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">{Object.entries(experiment.expected_behavior).length ? Object.entries(experiment.expected_behavior).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-slate-100 py-2 first:pt-0 last:border-0 last:pb-0 dark:border-slate-800"><dt className="text-slate-500">{formatExperimentLabel(key)}</dt><dd className="break-all text-right font-medium">{readableValue(value)}</dd></div>) : <p className="text-slate-500">No expectations configured.</p>}</dl></div>
      </div>
    </section>
  );
}

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const experimentId = typeof params.experimentId === "string" ? params.experimentId : "";
  const rawUser = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthServerSnapshot);
  const canManage = canManageExperiments(parseCurrentUser(rawUser)?.role);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [benchmarks, setBenchmarks] = useState<ExperimentBenchmark[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );
  const selectedBenchmark = selectedRun?.benchmark ?? benchmarks.find((item) => item.chaos_run_id === selectedRun?.id) ?? null;

  const loadPage = useCallback(async (quiet = false) => {
    if (!experimentId) return;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const data = await getExperimentPageData(experimentId);
      setExperiment(data.experiment);
      setRuns(data.runs);
      setBenchmarks(data.benchmarks);
      setSelectedRunId((current) => current && data.runs.some((run) => run.id === current) ? current : data.runs[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load experiment.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPage(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadPage]);

  useEffect(() => {
    const delay = nextPollDelay(selectedRun?.status);
    if (!delay || !selectedRun) return;
    const interval = window.setInterval(async () => {
      try {
        const updated = await getExperimentRun(selectedRun.id);
        setRuns((current) => current.map((run) => run.id === updated.id ? updated : run));
        if (!isActiveRunStatus(updated.status)) await loadPage(true);
      } catch {
        // A manual refresh still exposes a transient polling failure.
      }
    }, delay);
    return () => window.clearInterval(interval);
  }, [loadPage, selectedRun]);

  async function handleStart() {
    if (!experiment || !canManage) return;
    setActionBusy(true);
    setError(null);
    try {
      const queued = await startExperimentRun(experiment.id);
      setRunDialogOpen(false);
      await loadPage(true);
      setSelectedRunId(queued.run_id);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start run.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAbort() {
    if (!selectedRun || !canManage) return;
    if (!window.confirm("Abort this active experiment run?")) return;
    setActionBusy(true);
    setError(null);
    try {
      const updated = await abortExperimentRun(selectedRun.id);
      setRuns((current) => current.map((run) => run.id === updated.id ? updated : run));
      await loadPage(true);
    } catch (abortError) {
      setError(abortError instanceof Error ? abortError.message : "Unable to abort run.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading && !experiment) {
    return <div className="rounded-xl border border-slate-200 bg-white px-6 py-20 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">Loading experiment…</div>;
  }
  if (!experiment) {
    return <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30"><h1 className="font-semibold text-red-700 dark:text-red-300">Could not load experiment</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error ?? "The experiment was not found."}</p><Link href="/experiments" className="mt-5 inline-block text-sm font-medium text-blue-700 hover:underline dark:text-blue-400">← Back to experiments</Link></div>;
  }

  const active = isActiveRunStatus(selectedRun?.status);
  return (
    <main className="mx-auto max-w-7xl space-y-6 text-slate-950 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/experiments" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">← Back to experiments</Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadPage()} disabled={loading || actionBusy} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">Refresh</button>
          {active ? <button type="button" onClick={() => void handleAbort()} disabled={!canManage || actionBusy} title={!canManage ? "Admin or operator role required" : undefined} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">{actionBusy ? "Aborting…" : "Abort run"}</button> : <button type="button" onClick={() => setRunDialogOpen(true)} disabled={!canManage || actionBusy || !experiment.enabled} title={!canManage ? "Admin or operator role required" : undefined} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">Start run</button>}
        </div>
      </div>

      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">Experiment</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{experiment.name}</h1>{experiment.description ? <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{experiment.description}</p> : null}</div>{selectedRun ? <ExperimentStatusBadge status={selectedRun.status} /> : <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500">Not run</span>}</div>
        {runs.length > 0 ? <label className="mt-5 block max-w-md text-sm font-medium">Viewing run<select value={selectedRun?.id ?? ""} onChange={(event) => setSelectedRunId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{runs.map((run) => <option key={run.id} value={run.id}>{formatDateTime(run.started_at)} — {formatExperimentLabel(run.status)}</option>)}</select></label> : null}
        {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      </header>

      <ConfigurationCard experiment={experiment} />
      <div className="grid gap-6 xl:grid-cols-2"><ExperimentTimeline observations={selectedRun?.observations ?? []} /><div className="space-y-6"><LinkedPlatformEvents run={selectedRun} /><DiagnosisResult run={selectedRun} /></div></div>
      <BenchmarkSummary benchmark={selectedBenchmark} />

      <RunExperimentDialog experiment={experiment} open={runDialogOpen} busy={actionBusy} onClose={() => setRunDialogOpen(false)} onConfirm={() => void handleStart()} />
    </main>
  );
}