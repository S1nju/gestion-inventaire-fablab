export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Faculte {
  id: number;
  nom: string;
  description?: string | null;
  doyen?: string | null;
  email?: string | null;
}

export interface Service {
  id: number;
  nom: string;
  description?: string | null;
  responsable_principal?: string | null;
  faculte_id?: number | null;
  faculte?: Faculte | null;
}

export interface Bureau {
  id: number;
  nom: string;
  description?: string | null;
  localisation?: string | null;
  service_id?: number | null;
  service?: Service | null;
}

export interface Responsable {
  id: number;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  titre?: string | null;
  bureau_id?: number | null;
  service_id?: number | null;
  bureau?: Bureau | null;
  service?: Service | null;
}

export interface Assignment {
  id: number;
  article_id: number;
  responsable_id: number;
  date_affectation?: string | null;
  date_retrait?: string | null;
  quantite_affectee?: number | null;
  notes?: string | null;
  responsable?: Responsable | null;
  transferred_from?: Responsable | null;
  item?: Item | null;
}

export interface ItemMovementHistoryEntry {
  id: number;
  item_id: number;
  responsible_id?: number | null;
  previous_responsible_id?: number | null;
  action_type: string;
  quantity?: number | null;
  notes?: string | null;
  created_at?: string;
  item?: Item | null;
  responsible?: Responsable | null;
  previous_responsible?: Responsable | null;
}

export interface Item {
  id: number;
  nom: string;
  designation?: string | null;
  n_inventaire?: string | null;
  n_decharge?: string | null;
  description?: string | null;
  quantite?: number;
  bureau_id?: number | null;
  bureau?: Bureau | null;
  assignments?: Assignment[];
  current_responsible?: Assignment | null;
}

export interface InventoryFilters {
  [key: string]: string | undefined;
  search?: string;
  n_inventaire?: string;
  bureau_id?: string;
  service_id?: string;
  faculte_id?: string;
  page?: string;
  per_page?: string;
}

const apiBaseUrl =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000/api";

const bearerToken = process.env.BACKEND_BEARER_TOKEN ?? process.env.NEXT_PUBLIC_BACKEND_BEARER_TOKEN;

function withQuery(path: string, params?: Record<string, string | undefined>) {
  if (!params) return path;

  const url = new URL(path, apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() !== "") {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function getServerCookieHeader() {
  if (typeof window !== "undefined") {
    return undefined;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    if (allCookies.length === 0) {
      return undefined;
    }

    return allCookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  } catch {
    return undefined;
  }
}


async function getServerAuthToken() {
  if (typeof window !== "undefined") {
    return undefined;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("inventory_token")?.value;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const serverCookieHeader = await getServerCookieHeader();
  if (serverCookieHeader) {
    headers.Cookie = serverCookieHeader;
  }

  const resolvedToken = bearerToken ?? (await getServerAuthToken());
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(withQuery(path, params), {
    headers,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`API ${response.status}: ${payload}`);
  }

  return response.json() as Promise<T>;
}

export async function getItems(filters: InventoryFilters) {
  return request<ApiResponse<PaginatedResponse<Item>>>("items", filters);
}

export async function getResponsables(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<Responsable>>>("responsables", params);
}

export async function getBureaus(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<Bureau>>>("bureaus", params);
}

export async function getFacultes(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<Faculte>>>("facultes", params);
}

export async function getServices(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<Service>>>("services", params);
}

export async function getAssignments(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<Assignment>>>("article-responsables", params);
}

export async function getItemMovements(params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<ItemMovementHistoryEntry>>>("item-movements", params);
}

export async function getItemMovementHistory(itemId: string, params?: Record<string, string | undefined>) {
  return request<ApiResponse<PaginatedResponse<ItemMovementHistoryEntry>>>(`items/${itemId}/movement-history`, params);
}

export async function getItem(itemId: string) {
  return request<ApiResponse<Item>>(`items/${itemId}`);
}

export async function getResponsable(responsableId: string) {
  return request<ApiResponse<Responsable>>(`responsables/${responsableId}`);
}
