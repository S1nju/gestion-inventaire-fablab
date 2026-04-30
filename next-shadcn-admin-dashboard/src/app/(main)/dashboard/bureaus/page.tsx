import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBureaus, getServices } from "@/lib/inventory-api";
import { getAuthenticatedUser, hasPermissionOrAdmin } from "@/lib/laravel-auth";

import { ServerPagination } from "../_components/server-pagination";
import { BureausCrudPanel } from "./_components/bureaus-crud-panel";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function BureausPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const canEditDelete = hasPermissionOrAdmin(user, "manage_bureaus");
  const search = pickFirstParam(params.search);

  let error: string | null = null;
  let bureausResponse: Awaited<ReturnType<typeof getBureaus>> | undefined;
  let servicesResponse: Awaited<ReturnType<typeof getServices>> | undefined;

  try {
    [bureausResponse, servicesResponse] = await Promise.all([
      getBureaus({ search, per_page: "12", page: pickFirstParam(params.page) }),
      getServices({ per_page: "100" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les bureaux.";
  }

  const bureaus = bureausResponse?.data?.data ?? [];
  const currentPage = bureausResponse?.data?.current_page ?? 1;
  const lastPage = bureausResponse?.data?.last_page ?? 1;
  const services = servicesResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Bureaux</CardTitle>
          <CardDescription>Emplacements ou les articles sont affectes et geres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="max-w-sm">
            <Input name="search" placeholder="Rechercher un bureau" defaultValue={search ?? ""} />
          </form>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <BureausCrudPanel bureaus={bureaus} services={services} canEditDelete={canEditDelete} />

          <ServerPagination
            basePath="/dashboard/bureaus"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{ search }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
