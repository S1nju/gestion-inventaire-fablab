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
import type { Faculte } from "@/lib/inventory-api";
import { createFaculte, deleteFaculte, updateFaculte } from "@/lib/inventory-api.client";

interface Props {
  faculties: Faculte[];
  canEditDelete?: boolean;
}

interface FacultyForm {
  nom: string;
  description: string;
}

const emptyForm: FacultyForm = {
  nom: "",
  description: "",
};

export function FacultiesCrudPanel({ faculties, canEditDelete = true }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculte | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculte | null>(null);
  const [createForm, setCreateForm] = useState<FacultyForm>(emptyForm);
  const [editForm, setEditForm] = useState<FacultyForm>(emptyForm);

  const sortedFaculties = useMemo(() => [...faculties].sort((a, b) => b.id - a.id), [faculties]);

  async function onCreate() {
    try {
      await createFaculte({ nom: createForm.nom, description: createForm.description || null });
      toast.success("Faculte creee");
      setCreateForm(emptyForm);
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de creation de la faculte");
    }
  }

  function openEdit(faculty: Faculte) {
    setEditingFaculty(faculty);
    setEditForm({ nom: faculty.nom, description: faculty.description ?? "" });
    setEditOpen(true);
  }

  async function onSaveEdit() {
    if (!editingFaculty) return;

    try {
      await updateFaculte(editingFaculty.id, { nom: editForm.nom, description: editForm.description || null });
      toast.success("Faculte mise a jour");
      setEditOpen(false);
      setEditingFaculty(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de mise a jour de la faculte");
    }
  }

  function openDelete(faculty: Faculte) {
    setDeletingFaculty(faculty);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    if (!deletingFaculty) return;

    try {
      await deleteFaculte(deletingFaculty.id);
      toast.success("Faculte supprimee");
      setDeleteOpen(false);
      setDeletingFaculty(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Echec de suppression de la faculte");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Ajouter une faculte
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[110px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFaculties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Aucune faculte trouvee.
              </TableCell>
            </TableRow>
          ) : (
            sortedFaculties.map((faculty) => (
              <TableRow key={faculty.id}>
                <TableCell>{faculty.nom}</TableCell>
                <TableCell>{faculty.description ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEditDelete ? (
                      <>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(faculty)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openDelete(faculty)}>
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
            <DialogTitle>Ajouter une faculte</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={createForm.nom} onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
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
            <DialogTitle>Modifier une faculte</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Input value={editForm.nom} onChange={(e) => setEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
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
            <AlertDialogTitle>Supprimer cette faculte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action supprimera definitivement ${deletingFaculty?.nom ?? "cette faculte"}.`}
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
