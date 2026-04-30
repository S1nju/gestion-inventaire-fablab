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
import type { Bureau, Service } from "@/lib/inventory-api";
import { createBureau, deleteBureau, updateBureau } from "@/lib/inventory-api.client";

interface Props {
  bureaus: Bureau[];
  services: Service[];
  canEditDelete?: boolean;
}

interface BureauForm {
  nom: string;
  description: string;
  localisation: string;
  service_id: string;
}

const emptyForm: BureauForm = {
  nom: "",
  description: "",
  localisation: "",
  service_id: "",
};

export function BureausCrudPanel({ bureaus, services, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBureau, setEditingBureau] = useState<Bureau | null>(null);
  const [deletingBureau, setDeletingBureau] = useState<Bureau | null>(null);
  const [createForm, setCreateForm] = useState<BureauForm>(emptyForm);
  const [editForm, setEditForm] = useState<BureauForm>(emptyForm);

  const sortedBureaus = useMemo(() => [...bureaus].sort((a, b) => b.id - a.id), [bureaus]);

  async function onCreate() {
    try {
      await createBureau({
        nom: createForm.nom,
        description: createForm.description || null,
        localisation: createForm.localisation || null,
        service_id: createForm.service_id ? Number(createForm.service_id) : null,
      });
      toast.success("Bureau cree");
      setCreateForm(emptyForm);
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de creation du bureau");
    }
  }

  function openEdit(bureau: Bureau) {
    setEditingBureau(bureau);
    setEditForm({
      nom: bureau.nom,
      description: bureau.description ?? "",
      localisation: bureau.localisation ?? "",
      service_id: bureau.service_id ? String(bureau.service_id) : "",
    });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingBureau) return;

    try {
      await updateBureau(editingBureau.id, {
        nom: editForm.nom,
        description: editForm.description || null,
        localisation: editForm.localisation || null,
        service_id: editForm.service_id ? Number(editForm.service_id) : null,
      });
      toast.success("Bureau mis a jour");
      setEditOpen(false);
      setEditingBureau(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de mise a jour du bureau");
    }
  }

  function openDelete(bureau: Bureau) {
    setDeletingBureau(bureau);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingBureau) return;

    try {
      await deleteBureau(deletingBureau.id);
      toast.success("Bureau supprime");
      setDeleteOpen(false);
      setDeletingBureau(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de suppression du bureau");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter un bureau
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Faculte</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[110px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBureaus.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun bureau trouve.
              </TableCell>
            </TableRow>
          ) : (
            sortedBureaus.map((bureau) => (
              <TableRow key={bureau.id}>
                <TableCell>{bureau.nom}</TableCell>
                <TableCell>{bureau.localisation ?? "-"}</TableCell>
                <TableCell>{bureau.service?.nom ?? "-"}</TableCell>
                <TableCell>{bureau.service?.faculte?.nom ?? "-"}</TableCell>
                <TableCell>{bureau.description ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEditDelete ? (
                      <>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(bureau)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(bureau)}>
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
            <DialogTitle>Ajouter un bureau</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={createForm.nom} onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={createForm.localisation} onChange={(e) => setCreateForm((p) => ({ ...p, localisation: e.target.value }))} placeholder="Localisation" />
            <select className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm" value={createForm.service_id} onChange={(e) => setCreateForm((p) => ({ ...p, service_id: e.target.value }))}>
              <option value="">Service</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>
            <Input value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
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
            <DialogTitle>Modifier un bureau</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={editForm.localisation} onChange={(e) => setEditForm((p) => ({ ...p, localisation: e.target.value }))} placeholder="Localisation" />
            <select className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm" value={editForm.service_id} onChange={(e) => setEditForm((p) => ({ ...p, service_id: e.target.value }))}>
              <option value="">Service</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>
            <Input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveEdit} disabled={!editForm.nom.trim()}>
              Mettre a jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={canEditDelete && deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce bureau ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action supprimera definitivement ${deletingBureau?.nom ?? "ce bureau"}.`}
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
    </div>
  );
}
