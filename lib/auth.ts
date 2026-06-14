export type UserRole = "admin" | "developer" | "viewer";

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

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}


export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function getCurrentRole(): UserRole | null {
  const user = getCurrentUser();
  return user?.role ?? null;
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function canTriggerPipeline(role?: string | null): boolean {
  if (!role) return false;

  const normalizedRole = role.toLowerCase();

  return ["admin", "developer", "devops"].includes(normalizedRole);
}

export function canManagePlatform(role?: string | null) {
  return role === "admin";
}
