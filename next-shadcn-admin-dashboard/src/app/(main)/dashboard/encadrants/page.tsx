import { getEncadrants } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";
import { EncadrantsCrudPanel } from "./_components/encadrants-crud-panel";
import { redirect } from "next/navigation";

export default async function EncadrantsPage() {
    const user = await getAuthenticatedUser();
    if (user?.role !== "admin") {
        return redirect("/dashboard");
    }

    const encadrants = await getEncadrants().catch(() => []);
    const data = Array.isArray(encadrants) ? encadrants : (encadrants as any)?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Encadrants</CardTitle>
                    <CardDescription>Gérez la liste des enseignants et superviseurs qui encadrent les projets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EncadrantsCrudPanel encadrants={data} />
                </CardContent>
            </Card>
        </div>
    );
}
