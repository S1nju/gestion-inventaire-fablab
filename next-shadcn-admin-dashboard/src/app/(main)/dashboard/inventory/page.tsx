import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLabos,
  getArmoirs,
  getCasiers,
  getItems,
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
  const isAdmin = user?.role === "admin";
  const canEditDelete = isAdmin;

  const filters: InventoryFilters = {
    search: pickFirstParam(params.search),
    barcode: pickFirstParam(params.barcode),
    casier_id: pickFirstParam(params.casier_id),
    armoir_id: pickFirstParam(params.armoir_id),
    page: pickFirstParam(params.page),
    per_page: "20",
  };

  let error: string | null = null;
  let itemsResponse, labos, armoirs, casiers;

  try {
    [itemsResponse, labos, armoirs, casiers] = await Promise.all([
      getItems(filters),
      getLabos({ per_page: "100" }),
      getArmoirs({ per_page: "100" }),
      getCasiers({ per_page: "200" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load inventory.";
  }

  const items = itemsResponse?.data?.data ?? [];
  const total = itemsResponse?.data?.total ?? 0;
  const currentPage = itemsResponse?.data?.current_page ?? 1;
  const lastPage = itemsResponse?.data?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventaire & Stock</CardTitle>
          <CardDescription>Recherche par nom, code-barres ou emplacement physique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InventoryFiltersForm
            search={filters.search}
            barcode={filters.barcode}
            casierId={filters.casier_id}
            armoirId={filters.armoir_id}
            labos={labos || []}
            armoirs={armoirs || []}
            casiers={casiers || []}
          />

          <InventoryCrudPanel
            items={items}
            casiers={casiers || []}
            armoirs={armoirs || []}
            labos={labos || []}
            canEditDelete={canEditDelete}
            isAdmin={isAdmin}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex items-center justify-between">
            <Badge variant="outline">{total} articles</Badge>
          </div>

          <ServerPagination
            basePath="/dashboard/inventory"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{ search: filters.search, barcode: filters.barcode, casier_id: filters.casier_id, armoir_id: filters.armoir_id }}
          />

        </CardContent>
      </Card>
    </div>
  );
}
