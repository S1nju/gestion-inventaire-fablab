import { getLabos } from "@/lib/inventory-api";
import { LabosCrudPanel } from "./_components/labos-crud-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";

export default async function LabosPage() {
    const user = await getAuthenticatedUser();
    const isAdmin = user?.role === "admin";

    let labos;
    let errorMsg = null;

    try {
        labos = await getLabos();
    } catch (e) {
        errorMsg = e instanceof Error ? e.message : "Erreur";
    }

    // If backend returns { data: ..., success } or an array directly, we normalize it.
    const data = Array.isArray(labos) ? labos : (labos as any)?.data?.data || (labos as any)?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laboratoires</CardTitle>
                    <CardDescription>Gérez les laboratoires (ajoutez, renommez ou supprimez).</CardDescription>
                </CardHeader>
                <CardContent>
                    {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
                    <LabosCrudPanel labos={data} isAdmin={isAdmin} />
                </CardContent>
            </Card>
        </div>
    );
}
