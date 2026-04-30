import { getLabos, getArmoirs, getCasiers, getItems } from "@/lib/inventory-api";
import { LaboProfilePanel } from "./_components/labo-profile-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function LaboProfilePage({ params }: Props) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    const isAdmin = user?.role === "admin";

    const labos = await getLabos();
    const rawLabos = Array.isArray(labos) ? labos : (labos as any)?.data?.data || [];
    const labo = rawLabos.find((l: any) => String(l.id) === id);

    if (!labo) {
        return <div className="p-8">Laboratoire introuvable.</div>;
    }

    // Fetch all armoirs and casiers to filter out the ones belonging to this labo
    const armoirs = await getArmoirs({ per_page: "200" });
    const rawArmoirs = Array.isArray(armoirs) ? armoirs : (armoirs as any)?.data?.data || [];
    const laboArmoirs = rawArmoirs.filter((a: any) => String(a.labo_id) === id);

    const armoirIds = laboArmoirs.map((a: any) => a.id);
    const casiers = await getCasiers({ per_page: "500" });
    const rawCasiers = Array.isArray(casiers) ? casiers : (casiers as any)?.data?.data || [];
    const laboCasiers = rawCasiers.filter((c: any) => armoirIds.includes(c.armoir_id));

    const items = await getItems({ per_page: "1000" });
    const rawItems = Array.isArray(items) ? items : (items as any)?.data?.data || [];
    const casierIds = laboCasiers.map((c: any) => c.id);
    const laboItems = rawItems.filter((i: any) => casierIds.includes(i.casier_id));

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/dashboard/labos"><ArrowLeft className="size-4" /></Link>
                        </Button>
                        <div>
                            <CardTitle>Profil du {labo.nom}</CardTitle>
                            <CardDescription>{labo.description || "Gérez les armoirs et casiers de ce labo."}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <LaboProfilePanel labo={labo} armoirs={laboArmoirs} casiers={laboCasiers} items={laboItems} isAdmin={isAdmin} />
                </CardContent>
            </Card>
        </div>
    );
}
