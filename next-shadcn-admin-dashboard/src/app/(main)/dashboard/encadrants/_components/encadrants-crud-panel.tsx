"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createEncadrant } from "@/lib/inventory-api.client";
import type { Encadrant } from "@/lib/inventory-api";

export function EncadrantsCrudPanel({ encadrants }: { encadrants: Encadrant[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ nom: "" });

    async function onSave() {
        try {
            await createEncadrant(form);
            toast.success("Encadrant ajouté !");
            setOpen(false);
            setForm({ nom: "" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" /> Nouvel Encadrant</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom Complet</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {encadrants.length === 0 ? <TableRow><TableCell className="text-center text-muted-foreground py-8">Aucun encadrant trouvé.</TableCell></TableRow> : null}
                    {encadrants.map(e => (
                        <TableRow key={e.id}>
                            <TableCell className="font-semibold">{e.nom}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer un Encadrant</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom du professeur ou encadrant" value={form.nom} onChange={e => setForm({ nom: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={onSave} disabled={!form.nom.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
