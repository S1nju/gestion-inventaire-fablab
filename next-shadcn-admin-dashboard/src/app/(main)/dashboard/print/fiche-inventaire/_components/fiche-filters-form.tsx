"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Labo, Armoir, Casier } from "@/lib/inventory-api";

interface Props {
  search?: string;
  printDate?: string;
  laboId?: string;
  armoirId?: string;
  casierId?: string;
  labos: Labo[];
  armoirs: Armoir[];
  casiers: Casier[];
}

export function FicheFiltersForm({
  search,
  printDate,
  laboId,
  armoirId,
  casierId,
  labos,
  armoirs,
  casiers,
}: Props) {
  const [selectedLaboId, setSelectedLaboId] = useState(laboId ?? "");
  const [selectedArmoirId, setSelectedArmoirId] = useState(armoirId ?? "");
  const [selectedCasierId, setSelectedCasierId] = useState(casierId ?? "");

  return (
    <form className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4 print:hidden" method="GET">
      <Input name="search" placeholder="Nom / designation" defaultValue={search ?? ""} className="col-span-2" />
      <Input name="date" placeholder="Date d'impression (ex: 20/05/2026)" defaultValue={printDate ?? ""} className="col-span-2" />

      <select
        name="labo_id"
        value={selectedLaboId}
        onChange={(e) => setSelectedLaboId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="">Tous les labos</option>
        {labos.map((labo) => (
          <option key={labo.id} value={String(labo.id)}>
            {labo.nom}
          </option>
        ))}
      </select>

      <select
        name="armoir_id"
        value={selectedArmoirId}
        onChange={(e) => setSelectedArmoirId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="">Toutes les armoirs</option>
        {armoirs.map((armoir) => (
          <option key={armoir.id} value={String(armoir.id)}>
            {armoir.nom}
          </option>
        ))}
      </select>

      <select
        name="casier_id"
        value={selectedCasierId}
        onChange={(e) => setSelectedCasierId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="">Tous les casiers</option>
        {casiers.map((casier) => (
          <option key={casier.id} value={String(casier.id)}>
            {casier.nom}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Button type="submit">Actualiser la fiche</Button>
      </div>
    </form>
  );
}
