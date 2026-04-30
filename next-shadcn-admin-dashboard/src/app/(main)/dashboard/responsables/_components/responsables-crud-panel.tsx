"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Bureau, Responsable, Service } from "@/lib/inventory-api";
import { createResponsable, deleteResponsable, updateResponsable } from "@/lib/inventory-api.client";

interface Props {
  responsables: Responsable[];
  bureaus: Bureau[];
  services: Service[];
  canEditDelete?: boolean;
}

export function ResponsablesCrudPanel({ responsables, bureaus, services, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState<Responsable | null>(null);
  const [deletingResponsable, setDeletingResponsable] = useState<Responsable | null>(null);
  const [createForm, setCreateForm] = useState({ nom: "", email: "", telephone: "", bureau_id: "", service_id: "" });
  const [editForm, setEditForm] = useState({ nom: "", email: "", telephone: "", bureau_id: "", service_id: "" });

  const sortedResponsables = useMemo(() => [...responsables].sort((a, b) => b.id - a.id), [responsables]);

  async function onCreate() {
    try {
      await createResponsable({
        nom: createForm.nom,
        email: createForm.email || null,
        telephone: createForm.telephone || null,
        bureau_id: createForm.bureau_id ? Number(createForm.bureau_id) : null,
        service_id: createForm.service_id ? Number(createForm.service_id) : null,
      });
      toast.success("Responsable cree");
      setCreateForm({ nom: "", email: "", telephone: "", bureau_id: "", service_id: "" });
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de creation du responsable");
    }
  }

  function openEdit(responsable: Responsable) {
    setEditingResponsable(responsable);
    setEditForm({
      nom: responsable.nom,
      email: responsable.email ?? "",
      telephone: responsable.telephone ?? "",
      bureau_id: responsable.bureau_id ? String(responsable.bureau_id) : "",
      service_id: responsable.service_id ? String(responsable.service_id) : "",
    });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingResponsable) return;

    try {
      await updateResponsable(editingResponsable.id, {
        nom: editForm.nom,
        email: editForm.email || null,
        telephone: editForm.telephone || null,
        bureau_id: editForm.bureau_id ? Number(editForm.bureau_id) : null,
        service_id: editForm.service_id ? Number(editForm.service_id) : null,
      });
      toast.success("Responsable mis a jour");
      setEditOpen(false);
      setEditingResponsable(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de mise a jour du responsable");
    }
  }

  function openDelete(responsable: Responsable) {
    setDeletingResponsable(responsable);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingResponsable) return;

    try {
      await deleteResponsable(deletingResponsable.id);
      toast.success("Responsable supprime");
      setDeleteOpen(false);
      setDeletingResponsable(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de suppression du responsable");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter un responsable
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telephone</TableHead>
            <TableHead>Bureau</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="w-[110px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResponsables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun responsable trouve.
              </TableCell>
            </TableRow>
          ) : (
            sortedResponsables.map((responsable) => (
              <TableRow key={responsable.id}>
                <TableCell>{responsable.nom}</TableCell>
                <TableCell>{responsable.email ?? "-"}</TableCell>
                <TableCell>{responsable.telephone ?? "-"}</TableCell>
                <TableCell>{responsable.bureau?.nom ?? "-"}</TableCell>
                <TableCell>{responsable.service?.nom ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEditDelete ? (
                      <>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(responsable)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(responsable)}>
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
            <DialogTitle>Ajouter un responsable</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={createForm.nom} onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <Input value={createForm.telephone} onChange={(e) => setCreateForm((p) => ({ ...p, telephone: e.target.value }))} placeholder="Telephone" />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={createForm.bureau_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, bureau_id: e.target.value }))}
            >
              <option value="">Bureau</option>
              {bureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={createForm.service_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, service_id: e.target.value }))}
            >
              <option value="">Service</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>
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
            <DialogTitle>Modifier un responsable</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <Input value={editForm.telephone} onChange={(e) => setEditForm((p) => ({ ...p, telephone: e.target.value }))} placeholder="Telephone" />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={editForm.bureau_id}
              onChange={(e) => setEditForm((p) => ({ ...p, bureau_id: e.target.value }))}
            >
              <option value="">Bureau</option>
              {bureaus.map((bureau) => (
                <option key={bureau.id} value={String(bureau.id)}>
                  {bureau.nom}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm"
              value={editForm.service_id}
              onChange={(e) => setEditForm((p) => ({ ...p, service_id: e.target.value }))}
            >
              <option value="">Service</option>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>
                  {service.nom}
                </option>
              ))}
            </select>
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
            <AlertDialogTitle>Supprimer ce responsable ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action supprimera definitivement ${deletingResponsable?.nom ?? "ce responsable"}.`}
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
