"use client";

import { useState } from "react";

import type { ServiceListItem } from "@/types/reliability";
import type {
  ChaosScenarioType,
  ExperimentCreateInput,
} from "@/types/experiments";

const SCENARIOS: ChaosScenarioType[] = [
  "FAULTY_RELEASE",
  "POD_KILL",
  "NETWORK_DELAY",
  "DATABASE_DELAY",
  "CPU_PRESSURE",
];

const DEFAULT_FAILURE_CONFIG = JSON.stringify(
  { duration_seconds: 120 },
  null,
  2,
);

export function CreateExperimentDialog({
  open,
  services,
  busy,
  error,
  onClose,
  onCreate,
}: {
  open: boolean;
  services: ServiceListItem[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (input: ExperimentCreateInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scenario, setScenario] = useState<ChaosScenarioType>("POD_KILL");
  const [serviceId, setServiceId] = useState("");
  const [environment, setEnvironment] = useState("staging");
  const [namespace, setNamespace] = useState("platformiq-staging");
  const [failureConfig, setFailureConfig] = useState(DEFAULT_FAILURE_CONFIG);
  const [expectedBehavior, setExpectedBehavior] = useState("{}");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const effectiveServiceId = serviceId || services[0]?.id || "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    try {
      const parsedFailure = JSON.parse(failureConfig) as Record<string, unknown>;
      const parsedExpected = JSON.parse(expectedBehavior) as Record<string, unknown>;
      if (!parsedFailure || Array.isArray(parsedFailure) || typeof parsedFailure !== "object") {
        throw new Error("Failure configuration must be a JSON object.");
      }
      if (!parsedExpected || Array.isArray(parsedExpected) || typeof parsedExpected !== "object") {
        throw new Error("Expected behavior must be a JSON object.");
      }

      await onCreate({
        name,
        description: description || undefined,
        scenario_type: scenario,
        target_service_id: effectiveServiceId,
        target_environment: environment,
        target_namespace: namespace,
        failure_config: parsedFailure,
        expected_behavior: parsedExpected,
        enabled: true,
      });
    } catch (submitError) {
      if (submitError instanceof SyntaxError) {
        setValidationError("Configuration fields must contain valid JSON.");
      } else if (submitError instanceof Error) {
        setValidationError(submitError.message);
      }
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="create-dialog-title" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()} className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 id="create-dialog-title" className="text-xl font-semibold">Create experiment</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Define a safe, non-production reliability scenario.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Experiment name
            <input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">Description
            <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium">Scenario
            <select value={scenario} onChange={(event) => setScenario(event.target.value as ChaosScenarioType)} className={inputClass}>
              {SCENARIOS.map((value) => <option key={value} value={value}>{value.toLowerCase().replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Target service
            <select required value={effectiveServiceId} onChange={(event) => setServiceId(event.target.value)} className={inputClass}>
              {services.length === 0 ? <option value="">No services available</option> : null}
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Environment
            <input required value={environment} onChange={(event) => setEnvironment(event.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium">Namespace
            <input required value={namespace} onChange={(event) => setNamespace(event.target.value)} className={inputClass} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">Failure configuration (JSON)
            <textarea required rows={5} value={failureConfig} onChange={(event) => setFailureConfig(event.target.value)} className={`${inputClass} font-mono`} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">Expected behavior (JSON)
            <textarea required rows={4} value={expectedBehavior} onChange={(event) => setExpectedBehavior(event.target.value)} className={`${inputClass} font-mono`} />
          </label>
        </div>

        {validationError || error ? (
          <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{validationError ?? error}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
          <button type="submit" disabled={busy || services.length === 0} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{busy ? "Creating…" : "Create experiment"}</button>
        </div>
      </form>
    </div>
  );
}
