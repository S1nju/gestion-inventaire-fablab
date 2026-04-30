"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserPlus, UserCheck, Save, PackageMinus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    updateProject,
    addProjectItems,
    removeProjectItem,
    updateProjectItemStatus,
    attachStudent,
    detachStudent,
    createStudentForProject,
} from "@/lib/inventory-api.client";
import type { Project, Armoir, Casier, Item, User } from "@/lib/inventory-api";

interface Props {
    project: Project;
    isAdmin: boolean;
    allArmoirs: Armoir[];
    allCasiers: Casier[];
    allItems: Item[];
    allStudents: User[];
}

export function ProjectProfilePanel({ project: initialProject, isAdmin, allArmoirs, allCasiers, allItems, allStudents }: Props) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);

    // ─── Status edit ────────────────────────────────────────────────
    const [statusForm, setStatusForm] = useState({ status: project.status });

    async function onSaveStatus() {
        try {
            const updated = await updateProject(project.id, statusForm) as Project;
            setProject(updated);
            toast.success("Statut mis à jour");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    // ─── Add Items ───────────────────────────────────────────────────
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [filterArmoirId, setFilterArmoirId] = useState("");
    const [filterCasierId, setFilterCasierId] = useState("");
    const [itemSearch, setItemSearch] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [addQte, setAddQte] = useState("1");

    const filteredCasiers = useMemo(() => {
        if (!filterArmoirId) return allCasiers;
        return allCasiers.filter(c => String(c.armoir_id) === filterArmoirId);
    }, [allCasiers, filterArmoirId]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            if (filterCasierId && String(item.casier_id) !== filterCasierId) return false;
            if (filterArmoirId && item.casier?.armoir_id && String(item.casier.armoir_id) !== filterArmoirId) return false;
            if (itemSearch && !item.nom.toLowerCase().includes(itemSearch.toLowerCase()) && !(item.barcode || "").toLowerCase().includes(itemSearch.toLowerCase())) return false;
            return true;
        });
    }, [allItems, filterArmoirId, filterCasierId, itemSearch]);

    async function onAddItem() {
        if (!selectedItemId) return;
        try {
            const updated = await addProjectItems(project.id, {
                items: [{ item_id: Number(selectedItemId), quantite: Number(addQte) || 1 }],
            }) as Project;
            setProject(updated);
            toast.success("Composant ajouté au projet");
            setAddItemOpen(false);
            setSelectedItemId("");
            setAddQte("1");
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onRemoveItem(itemId: number) {
        if (!confirm("Retirer ce composant du projet ? Le stock sera recrédité.")) return;
        try {
            await removeProjectItem(project.id, itemId);
            toast.success("Composant retiré");
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    // ─── Return/damage/lost ─────────────────────────────────────────
    const [returnOpen, setReturnOpen] = useState(false);
    const [returnItemId, setReturnItemId] = useState<number | null>(null);
    const [returnStatus, setReturnStatus] = useState<"rendu" | "endommagé" | "perdu">("rendu");
    const [returnQte, setReturnQte] = useState("1");

    function openReturn(itemId: number, maxQte: number) {
        setReturnItemId(itemId);
        setReturnStatus("rendu");
        setReturnQte(String(maxQte));
        setReturnOpen(true);
    }

    async function onConfirmReturn() {
        if (!returnItemId) return;
        try {
            await updateProjectItemStatus(project.id, returnItemId, {
                status: returnStatus,
                quantite: Number(returnQte) || 1,
            });
            toast.success(`Marqué comme "${returnStatus}" — stock mis à jour`);
            setReturnOpen(false);
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    // ─── Students ────────────────────────────────────────────────────
    const [studentOpen, setStudentOpen] = useState(false);
    const [attachStudentId, setAttachStudentId] = useState("");

    async function onAttachStudent() {
        if (!attachStudentId) return;
        try {
            const updated = await attachStudent(project.id, Number(attachStudentId)) as Project;
            setProject(updated);
            toast.success("Étudiant ajouté au projet");
            setStudentOpen(false);
            setAttachStudentId("");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onDetachStudent(userId: number) {
        if (!confirm("Retirer cet étudiant du projet ?")) return;
        try {
            await detachStudent(project.id, userId);
            const updated = { ...project, users: project.users?.filter(u => u.id !== userId) };
            setProject(updated);
            toast.success("Étudiant retiré");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    // ─── Create new student ─────────────────────────────────────────
    const [newStudentOpen, setNewStudentOpen] = useState(false);
    const [newStudentForm, setNewStudentForm] = useState({ name: "", email: "", password: "" });

    async function onCreateStudent() {
        try {
            await createStudentForProject(project.id, newStudentForm);
            toast.success("Compte étudiant créé et attaché au projet");
            setNewStudentOpen(false);
            setNewStudentForm({ name: "", email: "", password: "" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    const isTerminated = project.status === "terminé";
    const projectItems: Item[] = (project.items as Item[] | undefined) || [];
    const projectStudents: User[] = (project.users as User[] | undefined) || [];

    // Available students to attach (not already in project)
    const existingStudentIds = new Set(projectStudents.map(u => u.id));
    const attachableStudents = allStudents.filter(u => !existingStudentIds.has(u.id));

    return (
        <div className="space-y-8">
            {/* ── Status ── */}
            {isAdmin && (
                <section>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-2">Statut du projet</h3>
                    <div className="flex items-center gap-3">
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                            value={statusForm.status}
                            onChange={e => setStatusForm({ status: e.target.value })}
                        >
                            <option value="active">Actif</option>
                            <option value="terminé">Terminé</option>
                            <option value="archivé">Archivé</option>
                        </select>
                        <Button onClick={onSaveStatus} size="sm">
                            <Save className="size-4 mr-2" /> Enregistrer
                        </Button>
                    </div>
                </section>
            )}

            {/* ── Students ── */}
            <section>
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h3 className="text-lg font-semibold">Étudiants</h3>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setStudentOpen(true)}>
                                <UserCheck className="size-4 mr-2" /> Attacher Étudiant
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setNewStudentOpen(true)}>
                                <UserPlus className="size-4 mr-2" /> Nouveau Compte
                            </Button>
                        </div>
                    )}
                </div>

                {projectStudents.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun étudiant assigné.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {projectStudents.map(u => (
                            <div key={u.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
                                <div>
                                    <p className="font-semibold text-sm">{u.name}</p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                                {isAdmin && (
                                    <button onClick={() => onDetachStudent(u.id)} className="text-red-400 hover:text-red-600 ml-2">
                                        <Trash2 className="size-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Components ── */}
            <section>
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h3 className="text-lg font-semibold">Composants du Projet</h3>
                    {isAdmin && !isTerminated && (
                        <Button variant="outline" size="sm" onClick={() => setAddItemOpen(true)}>
                            <Plus className="size-4 mr-2" /> Ajouter Composant
                        </Button>
                    )}
                </div>

                {projectItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun composant associé.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Composant</TableHead>
                                <TableHead>Emplacement</TableHead>
                                <TableHead>Qté Projet</TableHead>
                                {isAdmin && <TableHead className="w-[220px]">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectItems.map(item => {
                                const pivotQte = (item as any).pivot?.quantite ?? 1;
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <p className="font-medium">{item.nom}</p>
                                            <p className="text-xs text-muted-foreground">{item.barcode || item.n_inventaire || "-"}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{item.casier?.nom ?? "-"}</p>
                                            <p className="text-xs text-muted-foreground">{item.casier?.armoir?.nom ?? "-"}</p>
                                        </TableCell>
                                        <TableCell className="font-semibold">{pivotQte}</TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <div className="flex gap-2 flex-wrap">
                                                    {isTerminated ? (
                                                        <Button size="sm" variant="outline" onClick={() => openReturn(item.id, pivotQte)}>
                                                            <PackageMinus className="size-4 mr-1" /> Clôturer
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => openReturn(item.id, pivotQte)}>
                                                                Retourner / Perdre
                                                            </Button>
                                                            <Button size="icon-sm" variant="ghost" onClick={() => onRemoveItem(item.id)}>
                                                                <Trash2 className="size-4 text-red-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </section>

            {/* ── Dialog: Add Component ── */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Ajouter un Composant au Projet</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {/* Filters */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Filtrer par Armoire</label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                    value={filterArmoirId}
                                    onChange={e => { setFilterArmoirId(e.target.value); setFilterCasierId(""); }}
                                >
                                    <option value="">Toutes les armoires</option>
                                    {allArmoirs.map(a => (
                                        <option key={a.id} value={String(a.id)}>{a.nom} ({a.labo?.nom})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Filtrer par Casier</label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                    value={filterCasierId}
                                    onChange={e => setFilterCasierId(e.target.value)}
                                >
                                    <option value="">Tous les casiers</option>
                                    {filteredCasiers.map(c => (
                                        <option key={c.id} value={String(c.id)}>{c.nom}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Input
                            placeholder="Rechercher par nom ou code-barres..."
                            value={itemSearch}
                            onChange={e => setItemSearch(e.target.value)}
                        />

                        <div className="max-h-52 overflow-y-auto border rounded-md">
                            {filteredItems.length === 0 ? (
                                <p className="p-4 text-sm text-center text-muted-foreground">Aucun article trouvé.</p>
                            ) : (
                                filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-accent flex justify-between ${selectedItemId === String(item.id) ? "bg-accent font-semibold" : ""}`}
                                        onClick={() => setSelectedItemId(String(item.id))}
                                    >
                                        <span>{item.nom} <span className="text-muted-foreground text-xs ml-1">{item.barcode || ""}</span></span>
                                        <span className="text-muted-foreground">stock: {item.quantite_en_stock}</span>
                                    </button>
                                ))
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Quantité à prélever du stock</label>
                            <Input
                                type="number"
                                min={1}
                                value={addQte}
                                onChange={e => setAddQte(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={onAddItem} disabled={!selectedItemId}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Return/Damage/Lost ── */}
            <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isTerminated ? "Clôturer le composant" : "Retourner / Marquer composant"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Action</label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                                value={returnStatus}
                                onChange={e => setReturnStatus(e.target.value as any)}
                            >
                                <option value="rendu">Rendu (→ retour stock)</option>
                                <option value="endommagé">Endommagé (→ quantite_endommagee)</option>
                                <option value="perdu">Perdu (→ quantite_perdue)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Quantité</label>
                            <Input type="number" min={1} value={returnQte} onChange={e => setReturnQte(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={onConfirmReturn}>Confirmer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Attach existing student ── */}
            <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Attacher un Étudiant Existant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <select
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                            value={attachStudentId}
                            onChange={e => setAttachStudentId(e.target.value)}
                        >
                            <option value="">Sélectionner un étudiant...</option>
                            {attachableStudents.map(u => (
                                <option key={u.id} value={String(u.id)}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button onClick={onAttachStudent} disabled={!attachStudentId}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Create new student account ── */}
            <Dialog open={newStudentOpen} onOpenChange={setNewStudentOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer un Nouveau Compte Étudiant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom complet" value={newStudentForm.name} onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })} />
                        <Input placeholder="Email" type="email" value={newStudentForm.email} onChange={e => setNewStudentForm({ ...newStudentForm, email: e.target.value })} />
                        <Input placeholder="Mot de passe (min. 6 chars)" type="password" value={newStudentForm.password} onChange={e => setNewStudentForm({ ...newStudentForm, password: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={onCreateStudent}
                            disabled={!newStudentForm.name.trim() || !newStudentForm.email.trim() || newStudentForm.password.length < 6}
                        >
                            Créer & Attacher
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
