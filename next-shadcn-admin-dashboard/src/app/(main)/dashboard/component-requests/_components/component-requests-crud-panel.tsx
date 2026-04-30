"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createComponentRequest, updateComponentRequestStatus } from "@/lib/inventory-api.client";
import type { ComponentRequest } from "@/lib/inventory-api";

export function ComponentRequestsCrudPanel({ requests, isAdmin, currentUserId }: { requests: ComponentRequest[], isAdmin: boolean, currentUserId?: number }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ nom_composant: "", quantite: "1" });

    async function onSave() {
        try {
            await createComponentRequest({ nom_composant: form.nom_composant, quantite: Number(form.quantite) || 1, user_id: currentUserId });
            toast.success("Demande envoyée !");
            setOpen(false);
            setForm({ nom_composant: "", quantite: "1" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onUpdateStatus(id: number, status: string) {
        try {
            await updateComponentRequestStatus(id, { status });
            toast.success(`Statut mis à jour (${status})`);
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    const displayRequests = isAdmin ? requests : requests.filter(r => r.user_id === currentUserId);

    return (
        <div className="space-y-4">
            {!isAdmin && (
                <div className="flex justify-end">
                    <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" /> Nouvelle Demande</Button>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Composant Demandé</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Statut</TableHead>
                        {isAdmin && <TableHead className="w-[180px]">Validation</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayRequests.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center">Aucune demande.</TableCell></TableRow> : null}
                    {displayRequests.map(r => (
                        <TableRow key={r.id}>
                            <TableCell className="font-semibold">{r.nom_composant}</TableCell>
                            <TableCell>{r.quantite}</TableCell>
                            <TableCell>{r.student?.name || "Inconnu"}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {r.status === 'approved' ? 'approuvé' : r.status === 'rejected' ? 'refusé' : 'en attente'}
                                </span>
                            </TableCell>
                            {isAdmin && (
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon-sm" onClick={() => onUpdateStatus(r.id, 'approved')} disabled={r.status !== 'pending'}>
                                            <Check className="size-4 text-green-600" />
                                        </Button>
                                        <Button variant="outline" size="icon-sm" onClick={() => onUpdateStatus(r.id, 'rejected')} disabled={r.status !== 'pending'}>
                                            <X className="size-4 text-red-600" />
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Demander un Composant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom exact ou référence du composant" value={form.nom_composant} onChange={e => setForm({ ...form, nom_composant: e.target.value })} />
                        <Input type="number" placeholder="Quantité souhaitée" value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={onSave} disabled={!form.nom_composant.trim()}>Soumettre la demande</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
