import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFacultes, getServices } from "@/lib/inventory-api";
import { getAuthenticatedUser, hasPermissionOrAdmin } from "@/lib/laravel-auth";

import { ServerPagination } from "../_components/server-pagination";
import { ServicesCrudPanel } from "./_components/services-crud-panel";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const canEditDelete = hasPermissionOrAdmin(user, "manage_bureaus");
  const search = pickFirstParam(params.search);

  let error: string | null = null;
  let response: Awaited<ReturnType<typeof getServices>> | undefined;
  let facultiesResponse: Awaited<ReturnType<typeof getFacultes>> | undefined;

  try {
    [response, facultiesResponse] = await Promise.all([
      getServices({ search, per_page: "12", page: pickFirstParam(params.page) }),
      getFacultes({ per_page: "100" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les services.";
  }

  const services = response?.data?.data ?? [];
  const currentPage = response?.data?.current_page ?? 1;
  const lastPage = response?.data?.last_page ?? 1;
  const faculties = facultiesResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Unites de service qui possedent ou utilisent les articles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="max-w-sm">
            <Input name="search" placeholder="Rechercher un service" defaultValue={search ?? ""} />
          </form>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <ServicesCrudPanel services={services} faculties={faculties} canEditDelete={canEditDelete} />

          <ServerPagination
            basePath="/dashboard/services"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{ search }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
