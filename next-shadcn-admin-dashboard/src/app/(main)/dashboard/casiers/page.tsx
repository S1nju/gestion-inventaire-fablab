import { getCasiers } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CasiersPage() {
    const casiers = await getCasiers({ per_page: "500" });
    const data = Array.isArray(casiers) ? casiers : (casiers as any)?.data?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Casiers</CardTitle>
                    <CardDescription>Vue d'ensemble de tous les casiers/tiroirs du système.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom du Casier</TableHead>
                                <TableHead>Code Barres</TableHead>
                                <TableHead>Armoire parente</TableHead>
                                <TableHead>Laboratoire</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Aucun casier.</TableCell></TableRow>
                            ) : data.map((c: any) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-semibold">{c.nom}</TableCell>
                                    <TableCell>{c.barcode || "-"}</TableCell>
                                    <TableCell>{c.armoir?.nom || "-"}</TableCell>
                                    <TableCell>{c.armoir?.labo?.nom || "-"}</TableCell>
                                    <TableCell>
                                        {c.armoir?.labo_id && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/labos/${c.armoir.labo_id}`}>Voir Labo</Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
