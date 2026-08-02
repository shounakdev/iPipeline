export type UserRole =
  | "admin"
  | "developer"
  | "operator"
  | "viewer";

export type AuthUser = {
  id?: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  access_token: string;
  token_type?: string;
  user: AuthUser;
};

const TOKEN_KEY = "platformiq_access_token";
const USER_KEY = "platformiq_user";

const AUTH_CHANGE_EVENT =
  "platformiq-auth-change";

function emitAuthChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(AUTH_CHANGE_EVENT),
  );
}

export function saveAuthSession(
  session: AuthSession,
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    session.access_token,
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(session.user),
  );

  emitAuthChange();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function parseCurrentUser(
  rawUser: string,
): AuthUser | null {
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser =
    localStorage.getItem(USER_KEY) ?? "";

  return parseCurrentUser(rawUser);
}

export function getCurrentRole(): UserRole | null {
  const user = getCurrentUser();

  return user?.role ?? null;
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  emitAuthChange();
}

/**
 * Snapshot used by useSyncExternalStore.
 *
 * Returning the raw serialized user means React can detect
 * when login, logout, or role information changes.
 */
export function getAuthSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(USER_KEY) ?? "";
}

/**
 * Server-side snapshot used during hydration.
 */
export function getAuthServerSnapshot(): string {
  return "";
}

/**
 * Subscribe to authentication changes.
 *
 * The storage event handles changes made in another tab.
 * The custom event handles login/logout in the current tab.
 */
export function subscribeToAuth(
  callback: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleAuthChange = () => {
    callback();
  };

  window.addEventListener(
    "storage",
    handleAuthChange,
  );

  window.addEventListener(
    AUTH_CHANGE_EVENT,
    handleAuthChange,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleAuthChange,
    );

    window.removeEventListener(
      AUTH_CHANGE_EVENT,
      handleAuthChange,
    );
  };
}

export function canTriggerPipeline(
  role?: string | null,
): boolean {
  if (!role) {
    return false;
  }

  const normalizedRole = role.toLowerCase();

  return [
    "admin",
    "developer",
    "devops",
  ].includes(normalizedRole);
}

export function canManagePlatform(
  role?: string | null,
): boolean {
  return role?.toLowerCase() === "admin";
}

export function canManageIncidents(
  role?: string | null,
): boolean {
  if (!role) {
    return false;
  }

  return [
    "admin",
    "developer",
    "operator",
  ].includes(role.toLowerCase());
}

export function canManageRemediations(
  role?: string | null,
): boolean {
  if (!role) {
    return false;
  }

  return [
    "admin",
    "operator",
  ].includes(role.toLowerCase());
}