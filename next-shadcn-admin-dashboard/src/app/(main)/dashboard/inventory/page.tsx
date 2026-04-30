import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBureaus,
  getFacultes,
  getItems,
  getResponsables,
  getServices,
  type InventoryFilters,
} from "@/lib/inventory-api";
import { getAuthenticatedUser } from "@/lib/laravel-auth";

import { ServerPagination } from "../_components/server-pagination";
import { InventoryCrudPanel } from "./_components/inventory-crud-panel";
import { InventoryFiltersForm } from "./_components/inventory-filters-form";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const permissions = user?.permissions ?? [];
  const canEditDelete = permissions.includes("edit_item") || permissions.includes("delete_item");
  const filters: InventoryFilters = {
    search: pickFirstParam(params.search),
    n_inventaire: pickFirstParam(params.n_inventaire),
    bureau_id: pickFirstParam(params.bureau_id),
    service_id: pickFirstParam(params.service_id),
    faculte_id: pickFirstParam(params.faculte_id),
    page: pickFirstParam(params.page),
    per_page: "20",
  };

  let error: string | null = null;
  let itemsResponse: Awaited<ReturnType<typeof getItems>> | undefined;
  let bureausResponse: Awaited<ReturnType<typeof getBureaus>> | undefined;
  let servicesResponse: Awaited<ReturnType<typeof getServices>> | undefined;
  let facultesResponse: Awaited<ReturnType<typeof getFacultes>> | undefined;
  let responsablesResponse: Awaited<ReturnType<typeof getResponsables>> | undefined;

  try {
    [itemsResponse, bureausResponse, servicesResponse, facultesResponse, responsablesResponse] = await Promise.all([
      getItems(filters),
      getBureaus({ per_page: "100" }),
      getServices({ per_page: "100" }),
      getFacultes({ per_page: "100" }),
      getResponsables({ per_page: "200" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load inventory.";
  }

  const items = itemsResponse?.data?.data ?? [];
  const total = itemsResponse?.data?.total ?? 0;
  const currentPage = itemsResponse?.data?.current_page ?? 1;
  const lastPage = itemsResponse?.data?.last_page ?? 1;
  const bureaus = bureausResponse?.data?.data ?? [];
  const services = servicesResponse?.data?.data ?? [];
  const facultes = facultesResponse?.data?.data ?? [];
  const responsables = responsablesResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventaire</CardTitle>
          <CardDescription>Recherche par nom, numero inventaire, bureau, service ou faculte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InventoryFiltersForm
            search={filters.search}
            nInventaire={filters.n_inventaire}
            bureauId={filters.bureau_id}
            serviceId={filters.service_id}
            faculteId={filters.faculte_id}
            bureaus={bureaus}
            services={services}
            facultes={facultes}
          />

          <InventoryCrudPanel items={items} bureaus={bureaus} responsables={responsables} canEditDelete={canEditDelete} />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <div className="flex items-center justify-between">
            <Badge variant="outline">{total} articles</Badge>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/dashboard/print/fiche-inventaire?bureau_id=${filters.bureau_id ?? ""}&service_id=${filters.service_id ?? ""}&faculte_id=${filters.faculte_id ?? ""}`}
                >
                  Fiche d'inventaire
                </Link>
              </Button>
            </div>
          </div>

          <ServerPagination
            basePath="/dashboard/inventory"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{
              search: filters.search,
              n_inventaire: filters.n_inventaire,
              bureau_id: filters.bureau_id,
              service_id: filters.service_id,
              faculte_id: filters.faculte_id,
            }}
          />

        </CardContent>
      </Card>
    </div>
  );
}
