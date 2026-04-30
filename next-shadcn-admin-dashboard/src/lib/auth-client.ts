"use client";

function getBackendApiUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/?$/, "/api") ??
    "http://localhost:8000/api"
  );
}

function getTokenFromCookie() {
  const match = document.cookie.match(/(?:^|; )inventory_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function clearAuthCookies() {
  document.cookie = "inventory_token=; Path=/; Max-Age=0; SameSite=Lax";
}

export async function logoutClient() {
  const token = getTokenFromCookie();

  try {
    if (token) {
      await fetch(`${getBackendApiUrl().replace(/\/$/, "")}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // Always clear local cookie even if backend is unreachable.
  } finally {
    clearAuthCookies();
  }
}
