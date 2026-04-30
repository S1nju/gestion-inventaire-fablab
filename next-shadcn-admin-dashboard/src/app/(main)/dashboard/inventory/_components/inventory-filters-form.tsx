"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Casier, Armoir, Labo } from "@/lib/inventory-api";

interface Props {
  search?: string;
  barcode?: string;
  casierId?: string;
  armoirId?: string;
  labos: Labo[];
  armoirs: Armoir[];
  casiers: Casier[];
}

export function InventoryFiltersForm({
  search,
  barcode,
  casierId,
  armoirId,
  casiers,
  armoirs,
  labos,
}: Props) {
  const [selectedCasierId, setSelectedCasierId] = useState(casierId ?? "");
  const [selectedArmoirId, setSelectedArmoirId] = useState(armoirId ?? "");

  const selectedCasier = useMemo(
    () => casiers.find((c) => String(c.id) === selectedCasierId),
    [casiers, selectedCasierId],
  );

  const autoArmoirId = useMemo(() => {
    if (!selectedCasier) return "";
    const id = selectedCasier.armoir_id;
    return id ? String(id) : "";
  }, [selectedCasier]);

  const effectiveArmoirId = selectedCasierId ? autoArmoirId : selectedArmoirId;
  const lockHierarchy = selectedCasierId !== "";

  return (
    <form className="grid grid-cols-1 gap-3 md:grid-cols-6" method="GET">
      <Input name="search" placeholder="Nom / designation" defaultValue={search ?? ""} className="col-span-2" />
      <Input name="barcode" placeholder="Code-barres Scanné" defaultValue={barcode ?? ""} />

      <select
        name="casier_id"
        value={selectedCasierId}
        onChange={(e) => setSelectedCasierId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm flex-1"
      >
        <option value="">Tous les Casiers</option>
        {casiers.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.nom}
          </option>
        ))}
      </select>

      <input name="armoir_id" type="hidden" value={effectiveArmoirId} />
      <select
        value={effectiveArmoirId}
        disabled={lockHierarchy}
        onChange={(e) => setSelectedArmoirId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm disabled:opacity-100 flex-1"
      >
        <option value="">Toutes les Armoirs</option>
        {armoirs.map((a) => (
          <option key={a.id} value={String(a.id)}>
            {a.nom}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Button type="submit">Rechercher</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/dashboard/inventory">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
