import type {
  OperatorSummary,
  ServiceSummary,
} from "@/types/incidents";

export function formatIncidentDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString();
}

export function formatOperatorName(
  operator: OperatorSummary | null | undefined,
): string {
  if (!operator) {
    return "System";
  }

  return (
    operator.full_name ??
    operator.name ??
    operator.email ??
    operator.user_id ??
    operator.id ??
    "Unknown operator"
  );
}

export function formatServiceName(
  service: ServiceSummary | null | undefined,
): string {
  if (!service) {
    return "Unknown service";
  }

  return (
    service.service_name ??
    service.name ??
    service.service_id ??
    service.id ??
    "Unknown service"
  );
}

export function formatIdentifier(
  value: string | null | undefined,
  visibleLength = 12,
): string {
  if (!value) {
    return "Not available";
  }

  if (value.length <= visibleLength) {
    return value;
  }

  return `${value.slice(0, visibleLength)}…`;
}

export function formatIncidentEventType(
  eventType: string,
): string {
  return eventType
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}
