import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBureaus, getResponsables, getServices } from "@/lib/inventory-api";
import { getAuthenticatedUser, hasPermissionOrAdmin } from "@/lib/laravel-auth";

import { ServerPagination } from "../_components/server-pagination";
import { ResponsablesCrudPanel } from "./_components/responsables-crud-panel";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function ResponsablesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const canEditDelete = hasPermissionOrAdmin(user, "manage_bureaus");
  const search = pickFirstParam(params.search);

  let error: string | null = null;
  let response: Awaited<ReturnType<typeof getResponsables>> | undefined;
  let bureausResponse: Awaited<ReturnType<typeof getBureaus>> | undefined;
  let servicesResponse: Awaited<ReturnType<typeof getServices>> | undefined;

  try {
    [response, bureausResponse, servicesResponse] = await Promise.all([
      getResponsables({ search, per_page: "12", page: pickFirstParam(params.page) }),
      getBureaus({ per_page: "100" }),
      getServices({ per_page: "100" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les responsables.";
  }

  const responsables = response?.data?.data ?? [];
  const currentPage = response?.data?.current_page ?? 1;
  const lastPage = response?.data?.last_page ?? 1;
  const bureaus = bureausResponse?.data?.data ?? [];
  const services = servicesResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Responsables</CardTitle>
          <CardDescription>Personnes responsables des articles affectes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input name="search" placeholder="Rechercher par nom/email" defaultValue={search ?? ""} />
            <div className="md:col-span-3" />
          </form>

          <ResponsablesCrudPanel responsables={responsables} bureaus={bureaus} services={services} canEditDelete={canEditDelete} />

          <ServerPagination
            basePath="/dashboard/responsables"
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
