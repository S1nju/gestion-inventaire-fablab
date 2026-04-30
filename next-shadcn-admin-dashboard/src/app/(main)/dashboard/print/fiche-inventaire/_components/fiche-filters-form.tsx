"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Bureau, Faculte, Service } from "@/lib/inventory-api";

interface Props {
  search?: string;
  printDate: string;
  bureauId?: string;
  serviceId?: string;
  faculteId?: string;
  bureaus: Bureau[];
  services: Service[];
  facultes: Faculte[];
}

export function FicheFiltersForm({
  search,
  printDate,
  bureauId,
  serviceId,
  faculteId,
  bureaus,
  services,
  facultes,
}: Props) {
  const [selectedBureauId, setSelectedBureauId] = useState(bureauId ?? "");
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId ?? "");
  const [selectedFaculteId, setSelectedFaculteId] = useState(faculteId ?? "");

  const selectedBureau = useMemo(
    () => bureaus.find((bureau) => String(bureau.id) === selectedBureauId),
    [bureaus, selectedBureauId],
  );

  const autoServiceId = useMemo(() => {
    if (!selectedBureau) return "";
    const id = selectedBureau.service_id ?? selectedBureau.service?.id;
    return id ? String(id) : "";
  }, [selectedBureau]);

  const effectiveServiceId = selectedBureauId ? autoServiceId : selectedServiceId;

  const autoFaculteId = useMemo(() => {
    if (!effectiveServiceId) return "";

    const service = services.find((s) => String(s.id) === effectiveServiceId);
    const id = service?.faculte_id ?? service?.faculte?.id;
    return id ? String(id) : "";
  }, [effectiveServiceId, services]);

  const effectiveFaculteId = selectedBureauId ? autoFaculteId : selectedFaculteId;
  const lockHierarchy = selectedBureauId !== "";

  return (
    <form method="GET" className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6 print:hidden">
      <Input name="search" placeholder="Nom / designation" defaultValue={search ?? ""} />

      <input name="faculte_id" type="hidden" value={effectiveFaculteId} />
      <select
        value={effectiveFaculteId}
        disabled={lockHierarchy}
        onChange={(e) => setSelectedFaculteId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm disabled:opacity-100"
      >
        <option value="">Toutes les facultes</option>
        {facultes.map((faculte) => (
          <option key={faculte.id} value={String(faculte.id)}>
            {faculte.nom}
          </option>
        ))}
      </select>

      <input name="service_id" type="hidden" value={effectiveServiceId} />
      <select
        value={effectiveServiceId}
        disabled={lockHierarchy}
        onChange={(e) => setSelectedServiceId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm disabled:opacity-100"
      >
        <option value="">Tous les services</option>
        {services.map((service) => (
          <option key={service.id} value={String(service.id)}>
            {service.nom}
          </option>
        ))}
      </select>

      <select
        name="bureau_id"
        value={selectedBureauId}
        onChange={(e) => setSelectedBureauId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="">Tous les bureaux</option>
        {bureaus.map((bureau) => (
          <option key={bureau.id} value={String(bureau.id)}>
            {bureau.nom}
          </option>
        ))}
      </select>

      <Input name="date" placeholder="Date impression (jj/mm/aaaa)" defaultValue={printDate} />
      <Button type="submit">Appliquer</Button>
    </form>
  );
}
