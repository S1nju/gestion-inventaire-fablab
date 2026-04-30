import "server-only";

import { cookies } from "next/headers";

export interface AuthenticatedUser {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

const ADMIN_ROLE_NAMES = new Set([
  "admin",
  "administrator",
  "super_admin",
  "superadmin",
  // In this project seed data, local admin-like users are assigned the editor role.
  "editor",
]);

function normalizeRole(value: string) {
  return value.trim().toLowerCase();
}

export function hasPermissionOrAdmin(user: AuthenticatedUser | null, permission: string) {
  if (!user) return false;

  const permissions = user.permissions ?? [];
  if (permissions.includes(permission)) {
    return true;
  }

  const roleCandidates = [
    ...(user.roles ?? []),
    ...(user.role ? [user.role] : []),
  ];

  return roleCandidates.some((roleName) => ADMIN_ROLE_NAMES.has(normalizeRole(roleName)));
}

function hasSessionCookieName(name: string) {
  return name === "inventory_token";
}

function getBackendApiUrl() {
  return (
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_URL?.replace(/\/?$/, "/api") ??
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/?$/, "/api") ??
    "http://localhost:8000/api"
  );
}

function apiToBaseUrl(apiUrl: string) {
  return apiUrl.replace(/\/?api\/?$/, "");
}

async function getRequestCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  if (allCookies.length === 0) {
    return undefined;
  }

  return allCookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}

export async function hasLaravelSessionCookie() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.some((cookie) => hasSessionCookieName(cookie.name));
}

export async function getAuthenticatedUser() {
  const backendApiUrl = getBackendApiUrl();
  const backendBaseUrl = apiToBaseUrl(backendApiUrl);
  const cookieHeader = await getRequestCookieHeader();
  const cookieStore = await cookies();
  const token = cookieStore.get("inventory_token")?.value;

  if (!cookieHeader || !token) {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${backendBaseUrl}/api/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // If backend is unreachable, treat as unauthenticated instead of crashing SSR.
    return null;
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Auth check failed with status ${response.status}.`);
  }

  return (await response.json()) as AuthenticatedUser;
}

export async function isAuthenticated() {
  const user = await getAuthenticatedUser();
  return user !== null;
}
