"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Bureau } from "@/lib/inventory-api";

interface MovementFiltersProps {
  bureaus: Bureau[];
}

export function MovementFilters({ bureaus }: MovementFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [itemName, setItemName] = useState(searchParams.get("item_name") ?? "");
  const [nInventaire, setNInventaire] = useState(searchParams.get("n_inventaire") ?? "");
  const [actionType, setActionType] = useState(searchParams.get("action_type") ?? "");
  const [bureau, setBureau] = useState(searchParams.get("bureau_id") ?? "");
  const [fromDate, setFromDate] = useState(searchParams.get("from_date") ?? "");
  const [toDate, setToDate] = useState(searchParams.get("to_date") ?? "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (itemName) params.append("item_name", itemName);
    if (nInventaire) params.append("n_inventaire", nInventaire);
    if (actionType) params.append("action_type", actionType);
    if (bureau) params.append("bureau_id", bureau);
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setItemName("");
    setNInventaire("");
    setActionType("");
    setBureau("");
    setFromDate("");
    setToDate("");
    router.push("?");
  };

  const hasFilters = itemName || nInventaire || actionType || bureau || fromDate || toDate;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <span>🔍 {isOpen ? "Masquer" : "Afficher"} recherche avancée</span>
        {hasFilters && <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">Filtres actifs</span>}
      </button>

      {isOpen && (
        <Card className="p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item_name" className="text-xs font-medium">
                  Nom de l'équipement
                </Label>
                <Input
                  id="item_name"
                  placeholder="ex: Ordinateur, Bureau..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="n_inventaire" className="text-xs font-medium">
                  N° Inventaire
                </Label>
                <Input
                  id="n_inventaire"
                  placeholder="ex: INV-2024-001..."
                  value={nInventaire}
                  onChange={(e) => setNInventaire(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_type" className="text-xs font-medium">
                  Type d'action
                </Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger id="action_type" className="h-9 text-sm">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Affectation</SelectItem>
                    <SelectItem value="transfer">Transfert (Responsable)</SelectItem>
                    <SelectItem value="return">Retour</SelectItem>
                    <SelectItem value="bureau_transfer">Transfert de bureau</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bureau" className="text-xs font-medium">
                  Bureau
                </Label>
                <Select value={bureau} onValueChange={setBureau}>
                  <SelectTrigger id="bureau" className="h-9 text-sm">
                    <SelectValue placeholder="Tous les bureaux" />
                  </SelectTrigger>
                  <SelectContent>
                    {bureaus.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_date" className="text-xs font-medium">
                  Du
                </Label>
                <Input
                  id="from_date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_date" className="text-xs font-medium">
                  Au
                </Label>
                <Input
                  id="to_date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-9">
                Rechercher
              </Button>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleReset}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
