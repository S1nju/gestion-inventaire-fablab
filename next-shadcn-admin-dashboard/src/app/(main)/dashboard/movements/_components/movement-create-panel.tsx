"use client";

import { ArrowLeftRight, Building2, ClipboardCheck, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Bureau, Item, Responsable, Service } from "@/lib/inventory-api";
import { assignItem, createItem, returnItem, transferItem, transferItemBetweenBureaus, updateItem } from "@/lib/inventory-api.client";

interface Props {
  items: Item[];
  responsables: Responsable[];
  bureaus: Bureau[];
  services: Service[];
}

interface TransferPrintPayload {
  mode: string;
  date: string;
  sourceService: string;
  destinationService: string;
  fromLabel: string;
  toLabel: string;
  notes: string;
  items: Array<{
    id: number;
    nom: string;
    n_inventaire: string;
    quantite: string;
  }>;
}

function encodePrintPayload(payload: TransferPrintPayload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function MovementCreatePanel({ items, responsables, bureaus, services }: Props) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [assign, setAssign] = useState({
    itemIds: [] as string[],
    itemQuantities: {} as Record<string, string>,
    search: "",
    bureauId: "",
    responsableId: "",
    quantite: "1",
    notes: "",
  });
  const [transfer, setTransfer] = useState({
    mode: "responsable",
    sourceServiceId: "",
    destinationServiceId: "",
    itemIds: [] as string[],
    fromId: "",
    toId: "",
    fromBureauId: "",
    toBureauId: "",
    quantite: "1",
    notes: "",
  });
  const [ret, setRet] = useState({ itemId: "", responsableId: "" });

  const filteredSourceBureaus = useMemo(
    () =>
      bureaus.filter((bureau) => {
        if (!transfer.sourceServiceId) return false;
        const bureauServiceId = bureau.service_id ?? bureau.service?.id;
        return String(bureauServiceId ?? "") === transfer.sourceServiceId;
      }),
    [bureaus, transfer.sourceServiceId],
  );

  const filteredDestinationBureaus = useMemo(
    () =>
      bureaus.filter((bureau) => {
        if (!transfer.destinationServiceId) return false;
        const bureauServiceId = bureau.service_id ?? bureau.service?.id;
        return String(bureauServiceId ?? "") === transfer.destinationServiceId;
      }),
    [bureaus, transfer.destinationServiceId],
  );

  const filteredSourceResponsables = useMemo(
    () =>
      responsables.filter((responsable) => {
        if (!transfer.sourceServiceId) return false;
        const responsableServiceId = responsable.service_id ?? responsable.service?.id;
        return String(responsableServiceId ?? "") === transfer.sourceServiceId;
      }),
    [responsables, transfer.sourceServiceId],
  );

  const filteredDestinationResponsables = useMemo(
    () =>
      responsables.filter((responsable) => {
        if (!transfer.destinationServiceId) return false;
        const responsableServiceId = responsable.service_id ?? responsable.service?.id;
        return String(responsableServiceId ?? "") === transfer.destinationServiceId;
      }),
    [responsables, transfer.destinationServiceId],
  );

  const filteredTransferItems = useMemo(() => {
    if (transfer.mode === "bureau") {
      if (!transfer.fromBureauId) return [];

      return items.filter((item) => {
        const itemBureauId = item.bureau_id ?? item.bureau?.id;
        return String(itemBureauId ?? "") === transfer.fromBureauId;
      });
    }

    if (!transfer.sourceServiceId) return [];

    return items.filter((item) => {
      const itemServiceId = item.bureau?.service_id ?? item.bureau?.service?.id;
      return String(itemServiceId ?? "") === transfer.sourceServiceId;
    });
  }, [items, transfer.fromBureauId, transfer.mode, transfer.sourceServiceId]);

  const assignableItems = useMemo(() => {
    return items.filter((item) => {
      const itemBureauId = item.bureau_id ?? item.bureau?.id;
      return itemBureauId == null;
    });
  }, [items]);

  const filteredAssignableItems = useMemo(() => {
    const query = assign.search.trim().toLowerCase();
    if (!query) return assignableItems;

    return assignableItems.filter((item) => {
      const name = item.nom?.toLowerCase() ?? "";
      const nInventaire = item.n_inventaire?.toLowerCase() ?? "";
      return name.includes(query) || nInventaire.includes(query);
    });
  }, [assign.search, assignableItems]);

  function getServiceNameForBureau(bureau: Bureau) {
    const direct = bureau.service?.nom;
    if (direct) return direct;
    const byId = services.find((service) => service.id === (bureau.service_id ?? -1));
    return byId?.nom ?? "Sans service";
  }

  async function submitAssign() {
    if (assign.itemIds.length === 0) {
      toast.error("Selectionnez au moins un article");
      return;
    }

    if (!assign.bureauId && !assign.responsableId) {
      toast.error("Choisissez un bureau et/ou un responsable");
      return;
    }

    try {
      await Promise.all(
        assign.itemIds.map(async (itemId) => {
          const selectedItem = items.find((item) => String(item.id) === itemId);
          if (!selectedItem) {
            return;
          }

          const availableQty = Math.max(1, Number(selectedItem.quantite ?? 1));
          const requestedQty = Math.max(1, Number(assign.itemQuantities[itemId] ?? assign.quantite ?? "1"));

          if (requestedQty > availableQty) {
            throw new Error(`Quantite demandee superieure au stock pour ${selectedItem.nom}`);
          }

          if (assign.bureauId) {
            const hasInventoryNumber = Boolean(selectedItem.n_inventaire && selectedItem.n_inventaire.trim() !== "");

            if (!hasInventoryNumber && requestedQty < availableQty) {
              // For stock-like items without inventory number, allow partial bureau affectation.
              await updateItem(selectedItem.id, {
                quantite: availableQty - requestedQty,
              });

              await createItem({
                nom: selectedItem.nom,
                designation: selectedItem.designation ?? null,
                n_inventaire: null,
                n_decharge: selectedItem.n_decharge ?? null,
                description: selectedItem.description ?? null,
                quantite: requestedQty,
                bureau_id: Number(assign.bureauId),
              });
            } else {
              await updateItem(selectedItem.id, {
                bureau_id: Number(assign.bureauId),
              });
            }
          }

          if (assign.responsableId) {
            await assignItem(selectedItem.id, {
              responsable_id: Number(assign.responsableId),
              quantite_affectee: requestedQty,
              notes: assign.notes || null,
            });
          }
        }),
      );

      toast.success("Affectation enregistree");
      setAssignOpen(false);
      setAssign({ itemIds: [], itemQuantities: {}, search: "", bureauId: "", responsableId: "", quantite: "1", notes: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de l'affectation");
    }
  }

  async function submitTransfer() {
    try {
      if (transfer.itemIds.length === 0) {
        toast.error("Selectionnez au moins un article");
        return;
      }

      const sourceServiceLabel = services.find((s) => String(s.id) === transfer.sourceServiceId)?.nom ?? "-";
      const destinationServiceLabel = services.find((s) => String(s.id) === transfer.destinationServiceId)?.nom ?? "-";
      const fromLabel =
        transfer.mode === "bureau"
          ? (bureaus.find((b) => String(b.id) === transfer.fromBureauId)?.nom ?? "-")
          : (responsables.find((r) => String(r.id) === transfer.fromId)?.nom ?? "-");
      const toLabel =
        transfer.mode === "bureau"
          ? (bureaus.find((b) => String(b.id) === transfer.toBureauId)?.nom ?? "-")
          : (responsables.find((r) => String(r.id) === transfer.toId)?.nom ?? "-");

      const selectedItems = transfer.itemIds
        .map((itemId) => items.find((item) => String(item.id) === itemId))
        .filter((item): item is Item => Boolean(item))
        .map((item) => ({
          id: item.id,
          nom: item.nom,
          n_inventaire: item.n_inventaire || "/",
          quantite: transfer.mode === "responsable" ? transfer.quantite : String(item.quantite ?? 1),
        }));

      const printPayload: TransferPrintPayload = {
        mode: transfer.mode,
        date: new Date().toISOString(),
        sourceService: sourceServiceLabel,
        destinationService: destinationServiceLabel,
        fromLabel,
        toLabel,
        notes: transfer.notes || "",
        items: selectedItems,
      };

      if (transfer.mode === "bureau") {
        await Promise.all(
          transfer.itemIds.map((itemId) =>
            transferItemBetweenBureaus(Number(itemId), {
              from_bureau_id: Number(transfer.fromBureauId),
              to_bureau_id: Number(transfer.toBureauId),
              notes: transfer.notes || null,
            }),
          ),
        );
        toast.success("Transfert entre bureaux effectue");
      } else {
        await Promise.all(
          transfer.itemIds.map((itemId) =>
            transferItem(Number(itemId), {
              from_responsable_id: Number(transfer.fromId),
              to_responsable_id: Number(transfer.toId),
              quantite_affectee: Number(transfer.quantite),
              notes: transfer.notes || null,
            }),
          ),
        );
        toast.success("Transfert entre responsables effectue");
      }

      setTransferOpen(false);
      setTransfer({
        mode: "responsable",
        sourceServiceId: "",
        destinationServiceId: "",
        itemIds: [],
        fromId: "",
        toId: "",
        fromBureauId: "",
        toBureauId: "",
        quantite: "1",
        notes: "",
      });

      const encodedPayload = encodePrintPayload(printPayload);
      window.open(`/dashboard/print/bon-transfer?payload=${encodeURIComponent(encodedPayload)}&autoprint=1`, "_blank");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec du transfert");
    }
  }

  async function submitReturn() {
    try {
      await returnItem(Number(ret.itemId), {
        responsable_id: Number(ret.responsableId),
      });
      toast.success("Retour enregistre");
      setReturnOpen(false);
      setRet({ itemId: "", responsableId: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec du retour");
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-base">Nouveau mouvement</h3>
        <p className="text-muted-foreground text-xs">Affectation bureau/responsable, transfert et retour</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button type="button" className="justify-start" onClick={() => setAssignOpen(true)}>
          <ClipboardCheck className="mr-2 size-4" />
          Affecter
        </Button>
        <Button type="button" variant="outline" className="justify-start" onClick={() => setTransferOpen(true)}>
          <ArrowLeftRight className="mr-2 size-4" />
          Transferer
        </Button>
        <Button type="button" variant="secondary" className="justify-start" onClick={() => setReturnOpen(true)}>
          <Undo2 className="mr-2 size-4" />
          Retourner
        </Button>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affecter un article</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <Input
              value={assign.search}
              onChange={(e) => setAssign((p) => ({ ...p, search: e.target.value }))}
              placeholder="Rechercher par nom ou n inventaire"
            />
            <select
              className="min-h-28 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm"
              value={assign.itemIds}
              multiple
              size={8}
              onChange={(e) =>
                setAssign((p) => ({
                  ...p,
                  itemIds: Array.from(e.target.selectedOptions, (option) => option.value),
                  itemQuantities: Array.from(e.target.selectedOptions, (option) => option.value).reduce<Record<string, string>>((acc, id) => {
                    acc[id] = p.itemQuantities[id] ?? p.quantite ?? "1";
                    return acc;
                  }, {}),
                }))
              }
            >
              {filteredAssignableItems.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.nom} - N inventaire: {item.n_inventaire || "/"} - Qte: {item.quantite ?? 1}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">Maintenez Ctrl/Cmd pour selectionner plusieurs articles.</p>

            {assign.itemIds.length > 0 ? (
              <div className="space-y-2 rounded-md border border-dashed p-3">
                <div className="font-medium text-sm">Quantite a affecter par article</div>
                <div className="space-y-2">
                  {assign.itemIds.map((itemId) => {
                    const selectedItem = items.find((item) => String(item.id) === itemId);
                    if (!selectedItem) return null;

                    const hasInventoryNumber = Boolean(selectedItem.n_inventaire && selectedItem.n_inventaire.trim() !== "");
                    const maxQty = Math.max(1, Number(selectedItem.quantite ?? 1));

                    return (
                      <div key={itemId} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_120px]">
                        <p className="text-sm">
                          {selectedItem.nom}
                          <span className="ml-1 text-muted-foreground">(stock: {maxQty})</span>
                        </p>
                        <Input
                          type="number"
                          min={1}
                          max={maxQty}
                          value={assign.itemQuantities[itemId] ?? "1"}
                          onChange={(e) =>
                            setAssign((p) => ({
                              ...p,
                              itemQuantities: {
                                ...p.itemQuantities,
                                [itemId]: e.target.value,
                              },
                            }))
                          }
                          disabled={hasInventoryNumber}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  Pour les articles avec n inventaire, la quantite reste 1. Pour les articles sans n inventaire, vous pouvez choisir la qte.
                </p>
              </div>
            ) : null}

            <div className="rounded-md border border-dashed p-3">
              <div className="mb-2 flex items-center gap-2 font-medium text-sm">
                <Building2 className="size-4" />
                Affectation directe au bureau
              </div>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
                value={assign.bureauId}
                onChange={(e) => setAssign((p) => ({ ...p, bureauId: e.target.value }))}
              >
                <option value="">Aucun bureau</option>
                {bureaus.map((bureau) => (
                  <option key={bureau.id} value={String(bureau.id)}>
                    {getServiceNameForBureau(bureau)} - {bureau.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-md border border-dashed p-3">
              <div className="mb-2 font-medium text-sm">Affectation au responsable (optionnel)</div>
              <div className="grid grid-cols-1 gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                  value={assign.responsableId}
                  onChange={(e) => setAssign((p) => ({ ...p, responsableId: e.target.value }))}
                >
                  <option value="">Aucun responsable</option>
                  {responsables.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nom}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={assign.quantite}
                  onChange={(e) => setAssign((p) => ({ ...p, quantite: e.target.value }))}
                  placeholder="Quantite"
                  disabled={!assign.responsableId}
                />
                <Input
                  value={assign.notes}
                  onChange={(e) => setAssign((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes"
                  disabled={!assign.responsableId}
                />
              </div>
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="button" onClick={submitAssign}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferer un article</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={transfer.mode}
              onChange={(e) =>
                setTransfer((p) => ({
                  ...p,
                  mode: e.target.value,
                  sourceServiceId: "",
                  destinationServiceId: "",
                  itemIds: [],
                  fromId: "",
                  toId: "",
                  fromBureauId: "",
                  toBureauId: "",
                }))
              }
            >
              <option value="responsable">Entre responsables</option>
              <option value="bureau">Entre bureaux</option>
            </select>

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={transfer.sourceServiceId}
              onChange={(e) =>
                setTransfer((p) => ({
                  ...p,
                  sourceServiceId: e.target.value,
                  fromBureauId: "",
                  itemIds: [],
                  fromId: "",
                }))
              }
            >
              <option value="">Service source</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={transfer.destinationServiceId}
              onChange={(e) =>
                setTransfer((p) => ({
                  ...p,
                  destinationServiceId: e.target.value,
                  toBureauId: "",
                  toId: "",
                }))
              }
            >
              <option value="">Service destination</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={transfer.fromBureauId}
              disabled={!transfer.sourceServiceId}
              onChange={(e) =>
                setTransfer((p) => ({
                  ...p,
                  fromBureauId: e.target.value,
                  itemIds: [],
                }))
              }
            >
              <option value="">Bureau source</option>
              {filteredSourceBureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>

            <select
              className="min-h-28 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm"
              value={transfer.itemIds}
              multiple
              size={8}
              disabled={transfer.mode === "bureau" ? !transfer.fromBureauId : !transfer.sourceServiceId}
              onChange={(e) =>
                setTransfer((p) => ({
                  ...p,
                  itemIds: Array.from(e.target.selectedOptions, (option) => option.value),
                }))
              }
            >
              {filteredTransferItems.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.nom} - N inventaire: {item.n_inventaire || "/"}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground text-xs">Maintenez Ctrl/Cmd pour selectionner plusieurs articles.</p>
            {transfer.mode === "bureau" ? (
              <>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                  value={transfer.toBureauId}
                  disabled={!transfer.destinationServiceId}
                  onChange={(e) => setTransfer((p) => ({ ...p, toBureauId: e.target.value }))}
                >
                  <option value="">Bureau destination</option>
                  {filteredDestinationBureaus.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                  value={transfer.fromId}
                  disabled={!transfer.sourceServiceId}
                  onChange={(e) => setTransfer((p) => ({ ...p, fromId: e.target.value }))}
                >
                  <option value="">Responsable source</option>
                  {filteredSourceResponsables.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
                  value={transfer.toId}
                  disabled={!transfer.destinationServiceId}
                  onChange={(e) => setTransfer((p) => ({ ...p, toId: e.target.value }))}
                >
                  <option value="">Responsable destination</option>
                  {filteredDestinationResponsables
                    .filter((r) => String(r.id) !== transfer.fromId)
                    .map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.nom}
                    </option>
                    ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={transfer.quantite}
                  onChange={(e) => setTransfer((p) => ({ ...p, quantite: e.target.value }))}
                  placeholder="Quantite"
                />
              </>
            )}

            <Input
              value={transfer.notes}
              onChange={(e) => setTransfer((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Notes"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              onClick={submitTransfer}
              disabled={
                transfer.itemIds.length === 0 ||
                (transfer.mode === "bureau"
                  ? !transfer.sourceServiceId || !transfer.destinationServiceId || !transfer.fromBureauId || !transfer.toBureauId
                  : !transfer.sourceServiceId || !transfer.destinationServiceId || !transfer.fromId || !transfer.toId)
              }
            >
              Transferer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retourner un article</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={ret.itemId}
              onChange={(e) => setRet((p) => ({ ...p, itemId: e.target.value }))}
            >
              <option value="">Article</option>
              {items.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.nom}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={ret.responsableId}
              onChange={(e) => setRet((p) => ({ ...p, responsableId: e.target.value }))}
            >
              <option value="">Responsable</option>
              {responsables.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nom}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter showCloseButton>
            <Button type="button" onClick={submitReturn} disabled={!ret.itemId || !ret.responsableId}>
              Retourner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
