import Link from "next/link";

import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBureaus, getFacultes, getItems, getServices } from "@/lib/inventory-api";

import { FicheFiltersForm } from "./_components/fiche-filters-form";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstParam(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

function padOrder(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function FicheInventairePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bureauId = pickFirstParam(params.bureau_id);
  const serviceId = pickFirstParam(params.service_id);
  const faculteId = pickFirstParam(params.faculte_id);
  const search = pickFirstParam(params.search);
  const printDate = pickFirstParam(params.date);

  let error: string | null = null;
  let bureausResponse: Awaited<ReturnType<typeof getBureaus>> | undefined;
  let servicesResponse: Awaited<ReturnType<typeof getServices>> | undefined;
  let facultesResponse: Awaited<ReturnType<typeof getFacultes>> | undefined;
  let response: Awaited<ReturnType<typeof getItems>> | undefined;

  try {
    [bureausResponse, servicesResponse, facultesResponse] = await Promise.all([
      getBureaus({ per_page: "200" }),
      getServices({ per_page: "200" }),
      getFacultes({ per_page: "200" }),
    ]);

    const bureaus = bureausResponse?.data?.data ?? [];
    const services = servicesResponse?.data?.data ?? [];

    const selectedBureau = bureauId ? bureaus.find((b) => String(b.id) === bureauId) : undefined;
    const effectiveServiceId =
      selectedBureau !== undefined
        ? String(selectedBureau.service_id ?? selectedBureau.service?.id ?? "") || undefined
        : serviceId;

    const selectedService = effectiveServiceId ? services.find((s) => String(s.id) === effectiveServiceId) : undefined;
    const effectiveFaculteId =
      selectedBureau !== undefined
        ? String(selectedService?.faculte_id ?? selectedService?.faculte?.id ?? "") || undefined
        : faculteId;

    response = await getItems({
      bureau_id: bureauId,
      service_id: effectiveServiceId,
      faculte_id: effectiveFaculteId,
      search,
      per_page: "200",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger la fiche d'inventaire.";
  }

  const items = response?.data?.data ?? [];
  const bureaus = bureausResponse?.data?.data ?? [];
  const services = servicesResponse?.data?.data ?? [];
  const facultes = facultesResponse?.data?.data ?? [];
  const selectedBureau = bureauId ? bureaus.find((b) => String(b.id) === bureauId) : undefined;
  const effectiveServiceId =
    selectedBureau !== undefined
      ? String(selectedBureau.service_id ?? selectedBureau.service?.id ?? "") || undefined
      : serviceId;
  const selectedService = effectiveServiceId ? services.find((s) => String(s.id) === effectiveServiceId) : undefined;
  const effectiveFaculteId =
    selectedBureau !== undefined
      ? String(selectedService?.faculte_id ?? selectedService?.faculte?.id ?? "") || undefined
      : faculteId;
  const bureauLabel = bureaus.find((b) => String(b.id) === bureauId)?.nom ?? "Tous";
  const serviceLabel = services.find((s) => String(s.id) === effectiveServiceId)?.nom ?? "Tous";
  const faculteLabel = facultes.find((f) => String(f.id) === effectiveFaculteId)?.nom ?? "Toutes";
  const dateLabel = printDate && printDate.trim() !== "" ? printDate : formatDate(new Date());

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 print:max-w-none print:gap-0">
      <Card className="print:rounded-none print:shadow-none print:ring-0">
        <CardHeader className="print:pb-2">
          <div className="flex items-center justify-between print:hidden">
            <CardTitle>Fiche Inventaire</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/inventory">Retour inventaire</Link>
              </Button>
              <PrintButton />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FicheFiltersForm
            search={search}
            printDate={dateLabel}
            bureauId={bureauId}
            serviceId={effectiveServiceId}
            faculteId={effectiveFaculteId}
            bureaus={bureaus}
            services={services}
            facultes={facultes}
          />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <div className="fiche-print border bg-white p-4 text-black print:border-0 print:p-0">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Universite Abou Bekr Belkaid Telemcen</p>
                <p>Service des moyens et maintenance</p>
                <p>{faculteLabel}</p>
              </div>

              <div className="flex items-center justify-center">
                <img src="/logo.jpg" alt="University logo" className="h-16 w-16 object-contain" />
              </div>

              <div className="space-y-1 text-right">
                <p className="font-medium">{`BUREAU N°: ${bureauLabel}`}</p>
                <p>{`SERVICE: ${serviceLabel}`}</p>
                <p>&nbsp;</p>
              </div>
            </div>

            <h1 className="my-4 text-center font-bold text-xl">FICHE D'INVENTAIRE</h1>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-sm table-auto print:table-fixed print:text-[12px] print:text-black">
                <thead>
                  <tr>
                    <th className="w-[11%] border border-black px-2 py-1 text-left print:px-1">N° D'ORDRE</th>
                    <th className="w-[34%] border border-black px-2 py-1 text-left print:px-1">Designation</th>
                    <th className="w-[12%] border border-black px-2 py-1 text-left print:px-1">Quantites</th>
                    <th className="w-[18%] border border-black px-2 py-1 text-left print:px-1">N° Inventaire</th>
                    <th className="w-[25%] border border-black px-2 py-1 text-left print:px-1">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td className="border border-black px-2 py-1 text-center" colSpan={5}>
                        Aucun article trouve pour cette fiche.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black px-2 py-1 align-top print:px-1">{padOrder(index + 1)}</td>
                        <td className="border border-black px-2 py-1 align-top break-words print:px-1">
                          {item.designation || item.nom || "/"}
                        </td>
                        <td className="border border-black px-2 py-1 align-top print:px-1">
                          {String(item.quantite ?? 1).padStart(2, "0")}
                        </td>
                        <td className="border border-black px-2 py-1 align-top break-words print:px-1">
                          {item.n_inventaire || "/"}
                        </td>
                        <td className="border border-black px-2 py-1 align-top break-words print:px-1">
                          {item.description || "/"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex items-end justify-between text-sm">
              <p className="font-medium uppercase">LE RESPONSABLE DU SERVICE</p>
              <p className="font-medium uppercase">{`TLEMCEN LE ${dateLabel}`}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
