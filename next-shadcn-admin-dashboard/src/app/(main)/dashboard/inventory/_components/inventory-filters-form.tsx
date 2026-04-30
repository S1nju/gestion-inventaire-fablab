"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Bureau, Faculte, Service } from "@/lib/inventory-api";

interface Props {
  search?: string;
  nInventaire?: string;
  bureauId?: string;
  serviceId?: string;
  faculteId?: string;
  bureaus: Bureau[];
  services: Service[];
  facultes: Faculte[];
}

export function InventoryFiltersForm({
  search,
  nInventaire,
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
    <form className="grid grid-cols-1 gap-3 md:grid-cols-6" method="GET">
      <Input name="search" placeholder="Nom / designation" defaultValue={search ?? ""} />
      <Input name="n_inventaire" placeholder="N inventaire" defaultValue={nInventaire ?? ""} />

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

      <div className="flex gap-2">
        <Button type="submit">Rechercher</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/dashboard/inventory">Reinitialiser</Link>
        </Button>
      </div>
    </form>
  );
}
