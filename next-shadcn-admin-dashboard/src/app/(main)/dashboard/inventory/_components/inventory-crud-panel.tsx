"use client";

import { ClipboardCheck, History, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Bureau, Item, ItemMovementHistoryEntry, Responsable } from "@/lib/inventory-api";
import { assignItem, createItem, deleteItem, getItemMovementHistory, updateItem } from "@/lib/inventory-api.client";

interface Props {
  items: Item[];
  bureaus: Bureau[];
  responsables: Responsable[];
  canEditDelete?: boolean;
}

interface ItemForm {
  nom: string;
  designation: string;
  n_inventaire: string;
  description: string;
  quantite: string;
  bureau_id: string;
}

const emptyForm: ItemForm = {
  nom: "",
  designation: "",
  n_inventaire: "",
  description: "",
  quantite: "1",
  bureau_id: "",
};

interface AssignForm {
  bureau_id: string;
  responsable_id: string;
  quantite_affectee: string;
  notes: string;
}

const emptyAssignForm: AssignForm = {
  bureau_id: "",
  responsable_id: "",
  quantite_affectee: "1",
  notes: "",
};

export function InventoryCrudPanel({ items, bureaus, responsables, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [assigningItem, setAssigningItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [historyRows, setHistoryRows] = useState<ItemMovementHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [createForm, setCreateForm] = useState<ItemForm>(emptyForm);
  const [editForm, setEditForm] = useState<ItemForm>(emptyForm);
  const [assignForm, setAssignForm] = useState<AssignForm>(emptyAssignForm);

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.id - a.id), [items]);

  async function onCreate() {
    try {
      await createItem({
        nom: createForm.nom,
        designation: createForm.designation || null,
        n_inventaire: createForm.n_inventaire || null,
        description: createForm.description || null,
        quantite: Number(createForm.quantite || "0"),
        bureau_id: createForm.bureau_id ? Number(createForm.bureau_id) : null,
      });
      toast.success("Article cree");
      setCreateForm(emptyForm);
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de creation de l'article");
    }
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setEditForm({
      nom: item.nom,
      designation: item.designation ?? "",
      n_inventaire: item.n_inventaire ?? "",
      description: item.description ?? "",
      quantite: String(item.quantite ?? 0),
      bureau_id: item.bureau_id ? String(item.bureau_id) : "",
    });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, {
        nom: editForm.nom,
        designation: editForm.designation || null,
        n_inventaire: editForm.n_inventaire || null,
        description: editForm.description || null,
        quantite: Number(editForm.quantite || "0"),
        bureau_id: editForm.bureau_id ? Number(editForm.bureau_id) : null,
      });
      toast.success("Article mis a jour");
      setEditOpen(false);
      setEditingItem(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de mise a jour de l'article");
    }
  }

  function openDelete(item: Item) {
    setDeletingItem(item);
    setDeleteOpen(true);
  }

  function openAssign(item: Item) {
    setAssigningItem(item);
    setAssignForm({
      bureau_id: item.bureau_id ? String(item.bureau_id) : "",
      responsable_id: "",
      quantite_affectee: "1",
      notes: "",
    });
    setAssignOpen(true);
  }

  async function openHistory(item: Item) {
    setHistoryItem(item);
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const payload = (await getItemMovementHistory(item.id)) as {
        data?: { data?: ItemMovementHistoryEntry[] };
      };
      setHistoryRows(payload?.data?.data ?? []);
    } catch (error) {
      setHistoryRows([]);
      toast.error(error instanceof Error ? error.message : "Impossible de charger l'historique");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function onAssign() {
    if (!assigningItem) return;

    if (!assignForm.bureau_id && !assignForm.responsable_id) {
      toast.error("Choisissez au moins un bureau ou un responsable.");
      return;
    }

    try {
      if (assignForm.bureau_id !== (assigningItem.bureau_id ? String(assigningItem.bureau_id) : "")) {
        await updateItem(assigningItem.id, {
          bureau_id: assignForm.bureau_id ? Number(assignForm.bureau_id) : null,
        });
      }

      if (assignForm.responsable_id) {
        await assignItem(assigningItem.id, {
          responsable_id: Number(assignForm.responsable_id),
          quantite_affectee: Number(assignForm.quantite_affectee || "1"),
          notes: assignForm.notes || null,
        });
      }

      toast.success("Affectation enregistree avec succes.");
      setAssignOpen(false);
      setAssigningItem(null);
      setAssignForm(emptyAssignForm);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de l'affectation");
    }
  }

  async function onConfirmDelete() {
    if (!deletingItem) return;

    try {
      await deleteItem(deletingItem.id);
      toast.success("Article supprime");
      setDeleteOpen(false);
      setDeletingItem(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de suppression de l'article");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter un article
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>N Inventaire</TableHead>
            <TableHead>Bureau / Service</TableHead>
            <TableHead>Responsable actuel</TableHead>
            <TableHead>Quantite</TableHead>
            <TableHead className="w-[220px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucun article disponible.
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nom}</TableCell>
                <TableCell>{item.designation ?? "-"}</TableCell>
                <TableCell>{item.n_inventaire ?? "-"}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p>{item.bureau?.nom ?? "-"}</p>
                    <p className="text-muted-foreground text-xs">{item.bureau?.service?.nom ?? "-"}</p>
                  </div>
                </TableCell>
                <TableCell>{item.current_responsible?.responsable?.nom ?? "-"}</TableCell>
                <TableCell>{item.quantite ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => openAssign(item)}>
                      <ClipboardCheck className="mr-1 size-4" />
                      Affecter
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => openHistory(item)}>
                      <History className="mr-1 size-4" />
                      Historique
                    </Button>
                    {canEditDelete ? (
                      <>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(item)}>
                          <Trash2 className="size-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input
              value={createForm.nom}
              onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Nom"
            />
            <Input
              value={createForm.designation}
              onChange={(e) => setCreateForm((p) => ({ ...p, designation: e.target.value }))}
              placeholder="Designation"
            />
            <Input
              value={createForm.n_inventaire}
              onChange={(e) => setCreateForm((p) => ({ ...p, n_inventaire: e.target.value }))}
              placeholder="N inventaire"
            />
            <Input
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Observation"
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={createForm.bureau_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, bureau_id: e.target.value }))}
            >
              <option value="">Aucun bureau</option>
              {bureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>
            <Input
              value={createForm.quantite}
              onChange={(e) => setCreateForm((p) => ({ ...p, quantite: e.target.value }))}
              placeholder="Quantite"
              type="number"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onCreate} disabled={!createForm.nom.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={canEditDelete && editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier un article</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input
              value={editForm.nom}
              onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Nom"
            />
            <Input
              value={editForm.designation}
              onChange={(e) => setEditForm((p) => ({ ...p, designation: e.target.value }))}
              placeholder="Designation"
            />
            <Input
              value={editForm.n_inventaire}
              onChange={(e) => setEditForm((p) => ({ ...p, n_inventaire: e.target.value }))}
              placeholder="N inventaire"
            />
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Observation"
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={editForm.bureau_id}
              onChange={(e) => setEditForm((p) => ({ ...p, bureau_id: e.target.value }))}
            >
              <option value="">Aucun bureau</option>
              {bureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>
            <Input
              value={editForm.quantite}
              onChange={(e) => setEditForm((p) => ({ ...p, quantite: e.target.value }))}
              placeholder="Quantite"
              type="number"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveEdit} disabled={!editForm.nom.trim()}>
              Mettre a jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            setAssigningItem(null);
            setAssignForm(emptyAssignForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Affecter: ${assigningItem?.nom ?? "article"}`}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={assignForm.bureau_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, bureau_id: e.target.value }))}
            >
              <option value="">Aucun bureau</option>
              {bureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={assignForm.responsable_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, responsable_id: e.target.value }))}
            >
              <option value="">Ne pas affecter a un responsable</option>
              {responsables.map((responsable) => (
                <option key={responsable.id} value={String(responsable.id)}>
                  {responsable.nom}
                </option>
              ))}
            </select>

            <Input
              value={assignForm.quantite_affectee}
              onChange={(e) => setAssignForm((p) => ({ ...p, quantite_affectee: e.target.value }))}
              placeholder="Quantite affectee"
              type="number"
              min={1}
              disabled={!assignForm.responsable_id}
            />

            <Input
              value={assignForm.notes}
              onChange={(e) => setAssignForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Note (optionnel)"
              disabled={!assignForm.responsable_id}
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              onClick={onAssign}
              disabled={!assignForm.bureau_id && !assignForm.responsable_id}
            >
              Enregistrer l'affectation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={canEditDelete && deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action supprimera definitivement ${deletingItem?.nom ?? "cet article"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) {
            setHistoryItem(null);
            setHistoryRows([]);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{`Historique: ${historyItem?.nom ?? "article"}`}</DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <p className="text-muted-foreground text-sm">Chargement...</p>
          ) : historyRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun mouvement pour cet article.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Quantite</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.map((entry) => {
                  const bureauMatch = entry.notes?.match(/^Transfer bureau:\s*(.*?)\s*->\s*(.*)$/i);
                  const fromLabel = entry.action_type === "bureau_transfer"
                    ? (bureauMatch?.[1] || "-")
                    : (entry.previous_responsible?.nom ?? "-");
                  const toLabel = entry.action_type === "bureau_transfer"
                    ? (bureauMatch?.[2] || "-")
                    : (entry.responsible?.nom ?? "-");

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.created_at?.slice(0, 10) ?? "-"}</TableCell>
                      <TableCell>{entry.action_type ?? "-"}</TableCell>
                      <TableCell>{fromLabel}</TableCell>
                      <TableCell>{toLabel}</TableCell>
                      <TableCell>{entry.quantity ?? "-"}</TableCell>
                      <TableCell>{entry.notes ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
