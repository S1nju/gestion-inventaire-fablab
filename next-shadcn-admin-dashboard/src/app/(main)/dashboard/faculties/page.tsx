import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFacultes } from "@/lib/inventory-api";
import { getAuthenticatedUser, hasPermissionOrAdmin } from "@/lib/laravel-auth";

import { ServerPagination } from "../_components/server-pagination";
import { FacultiesCrudPanel } from "./_components/faculties-crud-panel";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function FacultiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const canEditDelete = hasPermissionOrAdmin(user, "manage_bureaus");
  const search = pickFirstParam(params.search);

  let error: string | null = null;
  let response: Awaited<ReturnType<typeof getFacultes>> | undefined;

  try {
    response = await getFacultes({ search, per_page: "12", page: pickFirstParam(params.page) });
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les facultes.";
  }

  const faculties = response?.data?.data ?? [];
  const currentPage = response?.data?.current_page ?? 1;
  const lastPage = response?.data?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Facultes</CardTitle>
          <CardDescription>Structure universitaire utilisee pour classer services, bureaux et emplacements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="max-w-sm">
            <Input name="search" placeholder="Rechercher une faculte" defaultValue={search ?? ""} />
          </form>

          <FacultiesCrudPanel faculties={faculties} canEditDelete={canEditDelete} />

          <ServerPagination
            basePath="/dashboard/faculties"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{ search }}
          />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
