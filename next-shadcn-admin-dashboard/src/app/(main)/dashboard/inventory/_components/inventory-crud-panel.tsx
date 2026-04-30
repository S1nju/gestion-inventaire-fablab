"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Casier, Armoir, Labo, Item } from "@/lib/inventory-api";
import { createItem, deleteItem, updateItem } from "@/lib/inventory-api.client";

interface Props {
  items: Item[];
  casiers: Casier[];
  armoirs: Armoir[];
  labos: Labo[];
  canEditDelete?: boolean;
}

interface ItemForm {
  nom: string;
  n_inventaire: string;
  barcode: string;
  description: string;
  quantite_en_stock: string;
  quantite_en_projet: string;
  quantite_endommagee: string;
  quantite_perdue: string;
  casier_id: string;
}

const emptyForm: ItemForm = {
  nom: "",
  n_inventaire: "",
  barcode: "",
  description: "",
  quantite_en_stock: "1",
  quantite_en_projet: "0",
  quantite_endommagee: "0",
  quantite_perdue: "0",
  casier_id: "",
};

export function InventoryCrudPanel({ items, casiers, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const [createForm, setCreateForm] = useState<ItemForm>(emptyForm);
  const [editForm, setEditForm] = useState<ItemForm>(emptyForm);

  const sortedItems = useMemo(() => [...items].sort((a, b) => b.id - a.id), [items]);

  async function onCreate() {
    try {
      await createItem({
        nom: createForm.nom,
        n_inventaire: createForm.n_inventaire || null,
        barcode: createForm.barcode || null,
        description: createForm.description || null,
        quantite_en_stock: Number(createForm.quantite_en_stock || "0"),
        quantite_en_projet: Number(createForm.quantite_en_projet || "0"),
        quantite_endommagee: Number(createForm.quantite_endommagee || "0"),
        quantite_perdue: Number(createForm.quantite_perdue || "0"),
        casier_id: createForm.casier_id ? Number(createForm.casier_id) : null,
      });
      toast.success("Article crée");
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
      n_inventaire: item.n_inventaire ?? "",
      barcode: item.barcode ?? "",
      description: item.description ?? "",
      quantite_en_stock: String(item.quantite_en_stock ?? 0),
      quantite_en_projet: String(item.quantite_en_projet ?? 0),
      quantite_endommagee: String(item.quantite_endommagee ?? 0),
      quantite_perdue: String(item.quantite_perdue ?? 0),
      casier_id: item.casier_id ? String(item.casier_id) : "",
    });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, {
        nom: editForm.nom,
        n_inventaire: editForm.n_inventaire || null,
        barcode: editForm.barcode || null,
        description: editForm.description || null,
        quantite_en_stock: Number(editForm.quantite_en_stock || "0"),
        quantite_en_projet: Number(editForm.quantite_en_projet || "0"),
        quantite_endommagee: Number(editForm.quantite_endommagee || "0"),
        quantite_perdue: Number(editForm.quantite_perdue || "0"),
        casier_id: editForm.casier_id ? Number(editForm.casier_id) : null,
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
      {canEditDelete && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Ajouter un Composant
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code Barres</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>Stock (Dispo)</TableHead>
            <TableHead>En Projet</TableHead>
            {canEditDelete && <TableHead className="w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun article disponible.
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nom}</TableCell>
                <TableCell>{item.barcode ?? "-"}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium">{item.casier?.nom ?? "-"}</p>
                    <p className="text-muted-foreground text-xs">{item.casier?.armoir?.nom ?? "-"} ({item.casier?.armoir?.labo?.nom ?? "-"})</p>
                  </div>
                </TableCell>
                <TableCell>{item.quantite_en_stock ?? 0}</TableCell>
                <TableCell>{item.quantite_en_projet ?? 0}</TableCell>
                {canEditDelete && (
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(item)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un composant</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" value={createForm.nom} onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={createForm.barcode} onChange={(e) => setCreateForm((p) => ({ ...p, barcode: e.target.value }))} placeholder="Code Barres/Scanner" />
            <Input value={createForm.prix} onChange={(e) => setCreateForm((p) => ({ ...p, prix: e.target.value }))} placeholder="N inventaire" />

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm col-span-2"
              value={createForm.casier_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, casier_id: e.target.value }))}
            >
              <option value="">Aucun Casier</option>
              {casiers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nom} — {c.armoir?.labo?.nom}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs text-muted-foreground ml-1">Qté Dispo</label>
              <Input value={createForm.quantite_en_stock} onChange={(e) => setCreateForm((p) => ({ ...p, quantite_en_stock: e.target.value }))} type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1">Qté Projet</label>
              <Input value={createForm.quantite_en_projet} onChange={(e) => setCreateForm((p) => ({ ...p, quantite_en_projet: e.target.value }))} type="number" />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onCreate} disabled={!createForm.nom.trim()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier un composant</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={editForm.barcode} onChange={(e) => setEditForm((p) => ({ ...p, barcode: e.target.value }))} placeholder="Code Barres/Scanner" />
            <Input value={editForm.n_inventaire} onChange={(e) => setEditForm((p) => ({ ...p, n_inventaire: e.target.value }))} placeholder="N inventaire" />

            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm col-span-2"
              value={editForm.casier_id}
              onChange={(e) => setEditForm((p) => ({ ...p, casier_id: e.target.value }))}
            >
              <option value="">Aucun Casier</option>
              {casiers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nom} — {c.armoir?.labo?.nom}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs text-muted-foreground ml-1">Qté Dispo</label>
              <Input value={editForm.quantite_en_stock} onChange={(e) => setEditForm((p) => ({ ...p, quantite_en_stock: e.target.value }))} type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1">Qté Projet</label>
              <Input value={editForm.quantite_en_projet} onChange={(e) => setEditForm((p) => ({ ...p, quantite_en_projet: e.target.value }))} type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1">Endommagé</label>
              <Input value={editForm.quantite_endommagee} onChange={(e) => setEditForm((p) => ({ ...p, quantite_endommagee: e.target.value }))} type="number" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1">Perdu</label>
              <Input value={editForm.quantite_perdue} onChange={(e) => setEditForm((p) => ({ ...p, quantite_perdue: e.target.value }))} type="number" />
            </div>

          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveEdit} disabled={!editForm.nom.trim()}>Mettre a jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>{`Cette action supprimera definitivement ${deletingItem?.nom ?? "cet article"}.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
