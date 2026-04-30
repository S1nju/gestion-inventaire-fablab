"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Box, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createArmoir, deleteArmoir, createCasier, deleteCasier } from "@/lib/inventory-api.client";
import type { Labo, Armoir, Casier, Item } from "@/lib/inventory-api";
import { Printer } from "lucide-react";
import { Barcode } from "@/components/ui/barcode";

export function LaboProfilePanel({ labo, armoirs, casiers, items, isAdmin }: { labo: Labo, armoirs: Armoir[], casiers: Casier[], items: Item[], isAdmin: boolean }) {
    const router = useRouter();

    const [armoirOpen, setArmoirOpen] = useState(false);
    const [armoirForm, setArmoirForm] = useState({ nom: "", barcode: "" });

    const [casierOpen, setCasierOpen] = useState(false);
    const [selectedArmoirId, setSelectedArmoirId] = useState<number | null>(null);
    const [casierForm, setCasierForm] = useState({ nom: "", barcode: "" });

    async function onSaveArmoir() {
        try {
            await createArmoir({ ...armoirForm, labo_id: labo.id });
            toast.success("Armoir créé");
            setArmoirOpen(false);
            setArmoirForm({ nom: "", barcode: "" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onDeleteArmoir(id: number) {
        if (!confirm("Supprimer cet armoir ?")) return;
        try {
            await deleteArmoir(id);
            toast.success("Armoir supprimé");
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onSaveCasier() {
        if (!selectedArmoirId) return;
        try {
            await createCasier({ ...casierForm, armoir_id: selectedArmoirId });
            toast.success("Casier créé");
            setCasierOpen(false);
            setCasierForm({ nom: "", barcode: "" });
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    async function onDeleteCasier(id: number) {
        if (!confirm("Supprimer ce casier ?")) return;
        try {
            await deleteCasier(id);
            toast.success("Casier supprimé");
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erreur");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mr-4">
                    Gérez les armoires et casiers de ce laboratoire. Vous pouvez y ajouter des composants via le profil des projets.
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => window.print()}>
                        <Printer className="size-4 mr-2" /> Imprimer Codes-barres
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => setArmoirOpen(true)}>
                            <Plus className="size-4 mr-2" /> Ajouter Armoir
                        </Button>
                    )}
                </div>
            </div>

            {armoirs.length === 0 && <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">Aucun armoire dans ce labo.</div>}

            <div className="grid grid-cols-1 gap-6">
                {armoirs.map(armoir => {
                    const myCasiers = casiers.filter(c => c.armoir_id === armoir.id);

                    return (
                        <div key={armoir.id} className="border rounded-lg p-4 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="size-5 text-blue-500" />
                                    <h3 className="font-bold text-lg">{armoir.nom}</h3>
                                    <span className="text-sm text-gray-500 ml-2">[{armoir.barcode || "Sans code"}]</span>
                                </div>
                                <div className="flex gap-2">
                                    {isAdmin && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedArmoirId(armoir.id); setCasierOpen(true); }}>
                                                <Plus className="size-4 mr-1" /> Casier
                                            </Button>
                                            <Button variant="destructive" size="icon-sm" onClick={() => onDeleteArmoir(armoir.id)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {myCasiers.length === 0 ? <p className="text-xs text-muted-foreground">Aucun casier.</p> : null}
                                {myCasiers.map(casier => (
                                    <div key={casier.id} className="border bg-white rounded flex flex-col p-3 shadow-sm relative group">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Box className="size-4 text-emerald-500" />
                                            {casier.nom}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{casier.barcode || "-"}</div>

                                        {/* Display items in casier */}
                                        <div className="mt-2 space-y-1">
                                            {items.filter(i => i.casier_id === casier.id).map(item => (
                                                <div key={item.id} className="text-xs border-t pt-1 flex justify-between">
                                                    <span className="truncate" title={item.nom}>{item.nom}</span>
                                                    <span className="text-muted-foreground ml-1">({item.quantite_en_stock})</span>
                                                </div>
                                            ))}
                                        </div>

                                        {isAdmin && (
                                            <button onClick={() => onDeleteCasier(casier.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-red-500">
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={armoirOpen} onOpenChange={setArmoirOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer une Armoir</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom (Ex: Armoir A)" value={armoirForm.nom} onChange={e => setArmoirForm({ ...armoirForm, nom: e.target.value })} />
                        <Input placeholder="Code-barres / RFID" value={armoirForm.barcode} onChange={e => setArmoirForm({ ...armoirForm, barcode: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={onSaveArmoir} disabled={!armoirForm.nom.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={casierOpen} onOpenChange={setCasierOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer un Casier</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Input placeholder="Nom / Label (Ex: Tiroir 12, Case H)" value={casierForm.nom} onChange={e => setCasierForm({ ...casierForm, nom: e.target.value })} />
                        <Input placeholder="Code-barres / Scanner" value={casierForm.barcode} onChange={e => setCasierForm({ ...casierForm, barcode: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={onSaveCasier} disabled={!casierForm.nom.trim()}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Printable Barcodes Area (Hidden on screen, visible on print) */}
            <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-50 print:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Codes-barres - {labo.nom}</h1>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-bold border-b pb-2">Armoires</h2>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-12">
                    {armoirs.map(armoir => (
                        <div key={armoir.id} className="border-2 border-gray-800 p-4 flex flex-col items-center justify-center bg-white text-center rounded-lg break-inside-avoid">
                            <h3 className="font-bold text-lg mb-1">{armoir.nom}</h3>
                            {armoir.barcode ? (
                                <Barcode value={armoir.barcode} width={1.5} height={40} fontSize={14} />
                            ) : (
                                <p className="text-sm text-gray-400 italic">Aucun code-barres</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">{labo.nom}</p>
                        </div>
                    ))}
                    {armoirs.length === 0 && <p>Aucune armoire.</p>}
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-bold border-b pb-2">Casiers</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {armoirs.map(armoir => {
                        const myCasiers = casiers.filter(c => c.armoir_id === armoir.id);
                        return myCasiers.map(casier => (
                            <div key={casier.id} className="border border-gray-600 p-3 flex flex-col items-center justify-center bg-white text-center break-inside-avoid">
                                <h4 className="font-semibold text-sm mb-1">{casier.nom}</h4>
                                <p className="text-[10px] text-gray-500 mb-2 truncate max-w-full">{armoir.nom}</p>
                                {casier.barcode ? (
                                    <Barcode value={casier.barcode} width={1.2} height={30} fontSize={12} />
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Aucun code</p>
                                )}
                            </div>
                        ));
                    })}
                </div>
            </div>
        </div>
    );
}
