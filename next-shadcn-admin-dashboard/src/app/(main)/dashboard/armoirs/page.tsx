import { getArmoirs } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ArmoirsPage() {
    const armoirs = await getArmoirs({ per_page: "200" });
    const data = Array.isArray(armoirs) ? armoirs : (armoirs as any)?.data?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Armoirs</CardTitle>
                    <CardDescription>Consultez la liste globale des armoires (Gérées dans le profil de chaque Labo).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom de l'Armoire</TableHead>
                                <TableHead>Code Barres</TableHead>
                                <TableHead>Laboratoire Associé</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Aucune armoire.</TableCell></TableRow>
                            ) : data.map((a: any) => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-semibold">{a.nom}</TableCell>
                                    <TableCell>{a.barcode || "-"}</TableCell>
                                    <TableCell>{a.labo?.nom || "Inconnu"}</TableCell>
                                    <TableCell>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/labos/${a.labo_id}`}>Gérer via Labo</Link>
                                        </Button>
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
