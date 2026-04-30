"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Printer, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createProject, createEncadrant } from "@/lib/inventory-api.client";
import type { Project, Encadrant } from "@/lib/inventory-api";

export function ProjectsCrudPanel({ projects, encadrants, isAdmin, currentUserId }: { projects: Project[], encadrants: Encadrant[], isAdmin: boolean, currentUserId?: number }) {
    const router = useRouter();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ titre: "", type: "PFE", annee_enseignement: "", encadrant_id: "", status: "active" });

    const [encadrantOpen, setEncadrantOpen] = useState(false);
    const [newEncadrant, setNewEncadrant] = useState("");

    async function onSave() {
        try {
            await createProject(form);
            toast.success("Projet créé !");
            toast.success("Projet créé !");
            setOpen(false);
            setForm({ titre: "", type: "PFE", annee_enseignement: "", encadrant_id: "", status: "active" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onAddEncadrant() {
        if (!newEncadrant.trim()) return;
        try {
            const added = await createEncadrant({ nom: newEncadrant }) as Encadrant;
            toast.success("Encadrant ajouté");
            setEncadrantOpen(false);
            setNewEncadrant("");
            setForm({ ...form, encadrant_id: String(added.id) });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    const displayProjects = isAdmin ? projects : projects.filter(p => p.users?.some(u => u.id === currentUserId));

    return (
        <div className="space-y-4">
            {isAdmin && (
                <div className="flex justify-end">
                    <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" /> Nouveau Projet</Button>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Encadreur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Étudiants</TableHead>
                        <TableHead className="w-[220px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayProjects.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun projet trouvé.</TableCell></TableRow> : null}
                    {displayProjects.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-semibold">{p.titre}</TableCell>
                            <TableCell>{p.type}</TableCell>
                            <TableCell>{(p as any).encadrant?.nom || "-"}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'terminé' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {p.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm">
                                {p.users?.map(u => u.name).join(", ") || <span className="text-muted-foreground">Aucun</span>}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href={`/dashboard/projects/${p.id}`}>
                                            Profil <ArrowRight className="size-4 ml-1" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/print/fiche-decharge?projectId=${p.id}`}>
                                            <Printer className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer un Projet</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Titre du projet" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="Activités scientifiques">Activités scientifiques</option>
                            <option value="Mini projet">Mini projet</option>
                            <option value="PFE">PFE</option>
                            <option value="Autre">Autre</option>
                        </select>
                        <Input placeholder="Année d'enseignement (ex: 2025/2026)" value={form.annee_enseignement} onChange={e => setForm({ ...form, annee_enseignement: e.target.value })} />

                        <div className="flex gap-2 items-center">
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.encadrant_id} onChange={e => setForm({ ...form, encadrant_id: e.target.value })}>
                                <option value="">Sélectionner un encadrant...</option>
                                {encadrants.map(en => (
                                    <option key={en.id} value={String(en.id)}>{en.nom}</option>
                                ))}
                            </select>
                            <Button variant="outline" size="icon" onClick={() => setEncadrantOpen(true)} type="button">
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={onSave} disabled={!form.titre.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={encadrantOpen} onOpenChange={setEncadrantOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer un Encadrant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom du nouvel encadrant" value={newEncadrant} onChange={e => setNewEncadrant(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEncadrantOpen(false)}>Annuler</Button>
                        <Button onClick={onAddEncadrant} disabled={!newEncadrant.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
