"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createLabo, updateLabo, deleteLabo } from "@/lib/inventory-api.client";
import type { Labo } from "@/lib/inventory-api";

export function LabosCrudPanel({ labos, isAdmin }: { labos: Labo[], isAdmin: boolean }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<Labo | null>(null);
    const [form, setForm] = useState({ nom: "", description: "" });

    function openCreate() {
        setEditItem(null);
        setForm({ nom: "", description: "" });
        setOpen(true);
    }

    function openUpdate(labo: Labo) {
        setEditItem(labo);
        setForm({ nom: labo.nom, description: labo.description || "" });
        setOpen(true);
    }

    async function onSave() {
        try {
            if (editItem) {
                await updateLabo(editItem.id, form);
                toast.success("Laboratoire mis à jour");
            } else {
                await createLabo(form);
                toast.success("Laboratoire créé");
            }
            setOpen(false);
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onDelete(id: number) {
        if (!confirm("Voulez-vous vraiment supprimer ce laboratoire ?")) return;
        try {
            await deleteLabo(id);
            toast.success("Laboratoire supprimé");
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    return (
        <div className="space-y-4">
            {isAdmin && (
                <div className="flex justify-end">
                    <Button onClick={openCreate}><Plus className="size-4 mr-2" /> Ajouter Labo</Button>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom du Laboratoire</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {labos.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center">Aucun laboratoire</TableCell></TableRow>
                    ) : labos.map(l => (
                        <TableRow key={l.id}>
                            <TableCell className="font-bold">{l.nom}</TableCell>
                            <TableCell>{l.description || "-"}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href={`/dashboard/labos/${l.id}`}>
                                            Profil Labo <ArrowRight className="size-4 ml-1" />
                                        </Link>
                                    </Button>
                                    {isAdmin && (
                                        <>
                                            <Button variant="ghost" size="icon-sm" onClick={() => openUpdate(l)}><Pencil className="size-4" /></Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(l.id)}><Trash2 className="size-4 text-red-500" /></Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editItem ? "Modifier" : "Ajouter"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom du labo" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                        <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={onSave} disabled={!form.nom.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
