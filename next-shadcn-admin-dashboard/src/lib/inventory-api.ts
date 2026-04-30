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

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface Labo {
  id: number;
  nom: string;
  description?: string | null;
  armoirs?: Armoir[];
}

export interface Armoir {
  id: number;
  nom: string;
  barcode: string;
  labo_id: number;
  labo?: Labo;
  casiers?: Casier[];
}

export interface CasierType {
  id: number;
  nom: string;
}

export interface Casier {
  id: number;
  nom: string;
  barcode: string;
  armoir_id: number;
  casier_type_id?: number | null;
  armoir?: Armoir;
  type?: CasierType;
  items?: Item[];
}

export interface Item {
  id: number;
  n_inventaire?: string;
  barcode?: string;
  nom: string;
  description?: string;
  unite?: string;
  casier_id?: number | null;
  casier?: Casier;
  quantite_en_stock: number;
  quantite_en_projet: number;
  quantite_perdue: number;
  quantite_endommagee: number;
  fournisseur_id?: number;
  prix?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Encadrant {
  id: number;
  nom: string;
}

export interface Stats {
  total_articles: number;
  total_en_stock: number;
  total_en_projet: number;
  total_perdu: number;
  total_endommage: number;
  total_projets: number;
  total_encadrants: number;
  top_items: { nom: string; quantite_en_stock: number; quantite_en_projet: number; quantite_perdue: number; quantite_endommagee: number }[];
  by_labo: { nom: string; total_articles: number; total_stock: number }[];
}

export interface Project {
  id: number;
  titre: string;
  type: string;
  annee_enseignement?: string | null;
  encadrant_id?: number | null;
  encadrant?: Encadrant;
  status: string;
  users?: User[];
  items?: Item[];
}

export interface ComponentRequest {
  id: number;
  user_id: number;
  nom_composant: string;
  quantite: number;
  status: string;
  student?: User;
}

export interface InventoryFilters {
  [key: string]: string | undefined;
  search?: string;
  barcode?: string;
  casier_id?: string;
  armoir_id?: string;
  page?: string;
  per_page?: string;
}

const apiBaseUrl =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://172.20.10.5:8000/api";

const bearerToken = process.env.BACKEND_BEARER_TOKEN ?? process.env.NEXT_PUBLIC_BACKEND_BEARER_TOKEN;

function withQuery(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(path, apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value && value.trim() !== "") {
        url.searchParams.set(key, value);
      }
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

// Data Fetchers
export async function getItems(filters: InventoryFilters) {
  return request<ApiResponse<PaginatedResponse<Item>>>("items", filters);
}

export async function getItem(itemId: string) {
  return request<ApiResponse<Item>>(`items/${itemId}`);
}

export async function getLabos(params?: Record<string, string | undefined>) {
  return request<Labo[]>("labos", params);
}

export async function getArmoirs(params?: Record<string, string | undefined>) {
  return request<Armoir[]>("armoirs", params);
}

export async function getCasiers(params?: Record<string, string | undefined>) {
  return request<Casier[]>("casiers", params);
}

export async function getProjects(params?: Record<string, string | undefined>) {
  return request<Project[]>("projects", params);
}

export async function getProject(projectId: string) {
  return request<Project>(`projects/${projectId}`);
}

export async function getComponentRequests(params?: Record<string, string | undefined>) {
  return request<ComponentRequest[]>("component-requests", params);
}

export async function getStudents() {
  return request<User[]>("users/students");
}

export async function getEncadrants() {
  return request<Encadrant[]>("encadrants");
}

export async function getStats() {
  return request<Stats>("stats");
}
