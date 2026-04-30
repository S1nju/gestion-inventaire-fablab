"use client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/?$/, "/api") ?? "http://localhost:8000/api";

function getAuthToken() {
  if (typeof document === "undefined") return undefined;
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

// Items
export async function createItem(payload: Record<string, unknown>) { return apiRequest("items", "POST", payload); }
export async function updateItem(itemId: number, payload: Record<string, unknown>) { return apiRequest(`items/${itemId}`, "PUT", payload); }
export async function deleteItem(itemId: number) { return apiRequest(`items/${itemId}`, "DELETE"); }

// Labos
export async function createLabo(payload: Record<string, unknown>) { return apiRequest("labos", "POST", payload); }
export async function updateLabo(laboId: number, payload: Record<string, unknown>) { return apiRequest(`labos/${laboId}`, "PUT", payload); }
export async function deleteLabo(laboId: number) { return apiRequest(`labos/${laboId}`, "DELETE"); }

// Armoirs
export async function createArmoir(payload: Record<string, unknown>) { return apiRequest("armoirs", "POST", payload); }
export async function updateArmoir(armoirId: number, payload: Record<string, unknown>) { return apiRequest(`armoirs/${armoirId}`, "PUT", payload); }
export async function deleteArmoir(armoirId: number) { return apiRequest(`armoirs/${armoirId}`, "DELETE"); }

// Casiers
export async function createCasier(payload: Record<string, unknown>) { return apiRequest("casiers", "POST", payload); }
export async function updateCasier(casierId: number, payload: Record<string, unknown>) { return apiRequest(`casiers/${casierId}`, "PUT", payload); }
export async function deleteCasier(casierId: number) { return apiRequest(`casiers/${casierId}`, "DELETE"); }

// Encadrants
export async function createEncadrant(payload: Record<string, unknown>) { return apiRequest("encadrants", "POST", payload); }

// Projects
export async function createProject(payload: Record<string, unknown>) { return apiRequest("projects", "POST", payload); }
export async function updateProject(projectId: number, payload: Record<string, unknown>) { return apiRequest(`projects/${projectId}`, "PUT", payload); }
export async function addProjectItems(projectId: number, payload: Record<string, unknown>) { return apiRequest(`projects/${projectId}/add-items`, "POST", payload); }
export async function removeProjectItem(projectId: number, itemId: number) { return apiRequest(`projects/${projectId}/remove-item/${itemId}`, "DELETE"); }
export async function updateProjectItemStatus(projectId: number, itemId: number, payload: Record<string, unknown>) { return apiRequest(`projects/${projectId}/update-item-status/${itemId}`, "POST", payload); }
export async function attachStudent(projectId: number, userId: number) { return apiRequest(`projects/${projectId}/attach-student`, "POST", { user_id: userId }); }
export async function detachStudent(projectId: number, userId: number) { return apiRequest(`projects/${projectId}/detach-student/${userId}`, "DELETE"); }
export async function createStudentForProject(projectId: number, payload: Record<string, unknown>) { return apiRequest(`projects/${projectId}/create-student`, "POST", payload); }

// Component Requests
export async function createComponentRequest(payload: Record<string, unknown>) { return apiRequest("component-requests", "POST", payload); }
export async function updateComponentRequestStatus(requestId: number, payload: Record<string, unknown>) { return apiRequest(`component-requests/${requestId}/status`, "POST", payload); }
