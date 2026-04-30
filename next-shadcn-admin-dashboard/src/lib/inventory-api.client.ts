"use client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/?$/, "/api") ?? "http://localhost:8000/api";

function getAuthToken() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie.match(/(?:^|; )inventory_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function apiRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const firstError = payload?.errors ? Object.values(payload.errors)[0] : undefined;
    const message =
      (Array.isArray(firstError) ? firstError[0] : undefined) ?? payload?.message ?? `Request failed: ${response.status}`;
    throw new Error(String(message));
  }

  return payload as T;
}

export async function createItem(payload: Record<string, unknown>) {
  return apiRequest("items", "POST", payload);
}

export async function updateItem(itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`items/${itemId}`, "PUT", payload);
}

export async function deleteItem(itemId: number) {
  return apiRequest(`items/${itemId}`, "DELETE");
}

export async function createFaculte(payload: Record<string, unknown>) {
  return apiRequest("facultes", "POST", payload);
}

export async function updateFaculte(faculteId: number, payload: Record<string, unknown>) {
  return apiRequest(`facultes/${faculteId}`, "PUT", payload);
}

export async function deleteFaculte(faculteId: number) {
  return apiRequest(`facultes/${faculteId}`, "DELETE");
}

export async function createResponsable(payload: Record<string, unknown>) {
  return apiRequest("responsables", "POST", payload);
}

export async function updateResponsable(responsableId: number, payload: Record<string, unknown>) {
  return apiRequest(`responsables/${responsableId}`, "PUT", payload);
}

export async function deleteResponsable(responsableId: number) {
  return apiRequest(`responsables/${responsableId}`, "DELETE");
}

export async function createService(payload: Record<string, unknown>) {
  return apiRequest("services", "POST", payload);
}

export async function updateService(serviceId: number, payload: Record<string, unknown>) {
  return apiRequest(`services/${serviceId}`, "PUT", payload);
}

export async function deleteService(serviceId: number) {
  return apiRequest(`services/${serviceId}`, "DELETE");
}

export async function createBureau(payload: Record<string, unknown>) {
  return apiRequest("bureaus", "POST", payload);
}

export async function updateBureau(bureauId: number, payload: Record<string, unknown>) {
  return apiRequest(`bureaus/${bureauId}`, "PUT", payload);
}

export async function deleteBureau(bureauId: number) {
  return apiRequest(`bureaus/${bureauId}`, "DELETE");
}

export async function assignItem(itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`items/${itemId}/assign-to`, "POST", payload);
}

export async function transferItem(itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`items/${itemId}/transfer`, "POST", payload);
}

export async function transferItemBetweenBureaus(itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`items/${itemId}/transfer-bureau`, "POST", payload);
}

export async function returnItem(itemId: number, payload: Record<string, unknown>) {
  return apiRequest(`items/${itemId}/return`, "POST", payload);
}

export async function getItemMovementHistory(itemId: number) {
  return apiRequest(`items/${itemId}/movement-history`, "GET");
}
