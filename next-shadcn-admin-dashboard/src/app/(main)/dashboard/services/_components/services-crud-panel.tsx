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
import type { Faculte, Service } from "@/lib/inventory-api";
import { createService, deleteService, updateService } from "@/lib/inventory-api.client";

interface Props {
  services: Service[];
  faculties: Faculte[];
  canEditDelete?: boolean;
}

interface ServiceForm {
  nom: string;
  description: string;
  responsable_principal: string;
  faculte_id: string;
}

const emptyForm: ServiceForm = {
  nom: "",
  description: "",
  responsable_principal: "",
  faculte_id: "",
};

export function ServicesCrudPanel({ services, faculties, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [createForm, setCreateForm] = useState<ServiceForm>(emptyForm);
  const [editForm, setEditForm] = useState<ServiceForm>(emptyForm);

  const sortedServices = useMemo(() => [...services].sort((a, b) => b.id - a.id), [services]);

  async function onCreate() {
    try {
      await createService({
        nom: createForm.nom,
        description: createForm.description || null,
        responsable_principal: createForm.responsable_principal || null,
        faculte_id: createForm.faculte_id ? Number(createForm.faculte_id) : null,
      });
      toast.success("Service cree");
      setCreateForm(emptyForm);
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de creation du service");
    }
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setEditForm({
      nom: service.nom,
      description: service.description ?? "",
      responsable_principal: service.responsable_principal ?? "",
      faculte_id: service.faculte_id ? String(service.faculte_id) : "",
    });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingService) return;

    try {
      await updateService(editingService.id, {
        nom: editForm.nom,
        description: editForm.description || null,
        responsable_principal: editForm.responsable_principal || null,
        faculte_id: editForm.faculte_id ? Number(editForm.faculte_id) : null,
      });
      toast.success("Service mis a jour");
      setEditOpen(false);
      setEditingService(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de mise a jour du service");
    }
  }

  function openDelete(service: Service) {
    setDeletingService(service);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingService) return;

    try {
      await deleteService(deletingService.id);
      toast.success("Service supprime");
      setDeleteOpen(false);
      setDeletingService(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de suppression du service");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter un service
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Faculte</TableHead>
            <TableHead>Responsable Principal</TableHead>
            <TableHead className="w-[110px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedServices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Aucun service trouve.
              </TableCell>
            </TableRow>
          ) : (
            sortedServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.nom}</TableCell>
                <TableCell>{service.description ?? "-"}</TableCell>
                <TableCell>{service.faculte?.nom ?? "-"}</TableCell>
                <TableCell>{service.responsable_principal ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEditDelete ? (
                      <>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(service)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(service)}>
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
            <DialogTitle>Ajouter un service</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={createForm.nom} onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
            <select className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm" value={createForm.faculte_id} onChange={(e) => setCreateForm((p) => ({ ...p, faculte_id: e.target.value }))}>
              <option value="">Faculte</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={String(faculty.id)}>
                  {faculty.nom}
                </option>
              ))}
            </select>
            <Input value={createForm.responsable_principal} onChange={(e) => setCreateForm((p) => ({ ...p, responsable_principal: e.target.value }))} placeholder="Responsable principal" />
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
            <DialogTitle>Modifier un service</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
            <Input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
            <select className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm" value={editForm.faculte_id} onChange={(e) => setEditForm((p) => ({ ...p, faculte_id: e.target.value }))}>
              <option value="">Faculte</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={String(faculty.id)}>
                  {faculty.nom}
                </option>
              ))}
            </select>
            <Input value={editForm.responsable_principal} onChange={(e) => setEditForm((p) => ({ ...p, responsable_principal: e.target.value }))} placeholder="Responsable principal" />
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
            <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action supprimera definitivement ${deletingService?.nom ?? "ce service"}.`}
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
