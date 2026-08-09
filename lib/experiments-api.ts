import { apiFetch } from "@/lib/api";
import type {
  Experiment,
  ExperimentBenchmark,
  ExperimentCreateInput,
  ExperimentListItem,
  ExperimentRun,
  ExperimentRunQueued,
} from "@/types/experiments";

export function listExperiments(): Promise<Experiment[]> {
  return apiFetch<Experiment[]>("/api/experiments");
}

export function getExperiment(experimentId: string): Promise<Experiment> {
  return apiFetch<Experiment>(
    `/api/experiments/${encodeURIComponent(experimentId)}`,
  );
}

export function createExperiment(
  input: ExperimentCreateInput,
): Promise<Experiment> {
  return apiFetch<Experiment>("/api/experiments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listExperimentRuns(
  experimentId: string,
): Promise<ExperimentRun[]> {
  return apiFetch<ExperimentRun[]>(
    `/api/experiments/${encodeURIComponent(experimentId)}/runs`,
  );
}

export function getExperimentRun(runId: string): Promise<ExperimentRun> {
  return apiFetch<ExperimentRun>(
    `/api/experiments/runs/${encodeURIComponent(runId)}`,
  );
}

export function listExperimentBenchmarks(
  experimentId: string,
): Promise<ExperimentBenchmark[]> {
  return apiFetch<ExperimentBenchmark[]>(
    `/api/experiments/${encodeURIComponent(experimentId)}/benchmarks`,
  );
}

export function startExperimentRun(
  experimentId: string,
): Promise<ExperimentRunQueued> {
  return apiFetch<ExperimentRunQueued>(
    `/api/experiments/${encodeURIComponent(experimentId)}/run`,
    { method: "POST" },
  );
}

export function abortExperimentRun(runId: string): Promise<ExperimentRun> {
  return apiFetch<ExperimentRun>(
    `/api/experiments/runs/${encodeURIComponent(runId)}/abort`,
    { method: "POST" },
  );
}

export async function getExperimentListItems(
  serviceNames: Map<string, string>,
): Promise<ExperimentListItem[]> {
  const experiments = await listExperiments();
  const runs = await Promise.all(
    experiments.map((experiment) => listExperimentRuns(experiment.id)),
  );

  return experiments.map((experiment, index) => ({
    experiment,
    latestRun: runs[index]?.[0] ?? null,
    serviceName:
      serviceNames.get(experiment.target_service_id) ??
      experiment.target_service_id,
  }));
}

export async function getExperimentPageData(experimentId: string): Promise<{
  experiment: Experiment;
  runs: ExperimentRun[];
  benchmarks: ExperimentBenchmark[];
}> {
  const [experiment, runs, benchmarks] = await Promise.all([
    getExperiment(experimentId),
    listExperimentRuns(experimentId),
    listExperimentBenchmarks(experimentId),
  ]);

  return { experiment, runs, benchmarks };
}