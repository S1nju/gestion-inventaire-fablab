import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBureaus, getItemMovements, getItems, getResponsables, getServices } from "@/lib/inventory-api";

import { ServerPagination } from "../_components/server-pagination";
import { MovementCreatePanel } from "./_components/movement-create-panel";
import { MovementFilters } from "./_components/movement-filters";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = pickFirstParam(params.page) ?? "1";
  const perPage = pickFirstParam(params.per_page) ?? "15";
  const itemName = pickFirstParam(params.item_name);
  const nInventaire = pickFirstParam(params.n_inventaire);
  const actionType = pickFirstParam(params.action_type);
  const bureauId = pickFirstParam(params.bureau_id);
  const fromDate = pickFirstParam(params.from_date);
  const toDate = pickFirstParam(params.to_date);

  let error: string | null = null;
  let response: Awaited<ReturnType<typeof getItemMovements>> | undefined;
  let itemsResponse: Awaited<ReturnType<typeof getItems>> | undefined;
  let responsablesResponse: Awaited<ReturnType<typeof getResponsables>> | undefined;
  let bureausResponse: Awaited<ReturnType<typeof getBureaus>> | undefined;
  let servicesResponse: Awaited<ReturnType<typeof getServices>> | undefined;

  try {
    const filter: Record<string, string> = { page, per_page: perPage };
    if (itemName) filter.item_name = itemName;
    if (nInventaire) filter.n_inventaire = nInventaire;
    if (actionType) filter.action_type = actionType;
    if (bureauId) filter.bureau_id = bureauId;
    if (fromDate) filter.from_date = fromDate;
    if (toDate) filter.to_date = toDate;

    [response, itemsResponse, responsablesResponse, bureausResponse, servicesResponse] = await Promise.all([
      getItemMovements(filter),
      getItems({ per_page: "5000" }),
      getResponsables({ per_page: "100" }),
      getBureaus({ per_page: "200" }),
      getServices({ per_page: "200" }),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les mouvements.";
  }

  const movements = response?.data?.data ?? [];
  const currentPage = response?.data?.current_page ?? 1;
  const lastPage = response?.data?.last_page ?? 1;
  const items = itemsResponse?.data?.data ?? [];
  const responsables = responsablesResponse?.data?.data ?? [];
  const bureaus = bureausResponse?.data?.data ?? [];
  const services = servicesResponse?.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mouvements</CardTitle>
          <CardDescription>Historique complet des mouvements (affectation, transfert, retour, transfert de bureau).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MovementFilters bureaus={bureaus} />

          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="item_name" value={itemName ?? ""} />
            <input type="hidden" name="n_inventaire" value={nInventaire ?? ""} />
            <input type="hidden" name="action_type" value={actionType ?? ""} />
            <input type="hidden" name="bureau_id" value={bureauId ?? ""} />
            <input type="hidden" name="from_date" value={fromDate ?? ""} />
            <input type="hidden" name="to_date" value={toDate ?? ""} />
            <input type="hidden" name="page" value="1" />
            <label htmlFor="per_page" className="text-sm text-muted-foreground">Lignes par page</label>
            <select
              id="per_page"
              name="per_page"
              defaultValue={perPage}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <Button type="submit" size="sm" variant="outline">
              Appliquer
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{response?.data?.total ?? 0} lignes</Badge>
          </div>

          <MovementCreatePanel items={items} responsables={responsables} bureaus={bureaus} services={services} />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>N° Inventaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantite</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucun mouvement trouve.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => {
                  const bureauMatch = movement.notes?.match(/^Transfer bureau:\s*(.*?)\s*->\s*(.*)$/i);
                  const fromLabel = movement.action_type === "bureau_transfer"
                    ? (bureauMatch?.[1] || "-")
                    : (movement.previous_responsible?.nom ?? "-");
                  const toLabel = movement.action_type === "bureau_transfer"
                    ? (bureauMatch?.[2] || "-")
                    : (movement.responsible?.nom ?? "-");

                  return (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.item?.nom ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{movement.item?.n_inventaire ?? "-"}</TableCell>
                      <TableCell>{movement.action_type ?? "-"}</TableCell>
                      <TableCell>{fromLabel}</TableCell>
                      <TableCell>{toLabel}</TableCell>
                      <TableCell>{movement.created_at?.slice(0, 10) ?? "-"}</TableCell>
                      <TableCell>{movement.quantity ?? "-"}</TableCell>
                      <TableCell>{movement.notes ?? "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <ServerPagination
            basePath="/dashboard/movements"
            currentPage={currentPage}
            lastPage={lastPage}
            query={{
              ...(perPage && { per_page: perPage }),
              ...(itemName && { item_name: itemName }),
              ...(nInventaire && { n_inventaire: nInventaire }),
              ...(actionType && { action_type: actionType }),
              ...(bureauId && { bureau_id: bureauId }),
              ...(fromDate && { from_date: fromDate }),
              ...(toDate && { to_date: toDate }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
