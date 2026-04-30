import { getComponentRequests } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";
import { ComponentRequestsCrudPanel } from "./_components/component-requests-crud-panel";

export default async function ComponentRequestsPage() {
    const user = await getAuthenticatedUser();
    const isAdmin = user?.role === "admin";
    const currentUserId = user?.id;

    const reqs = await getComponentRequests({ per_page: "100" });
    const data = Array.isArray(reqs) ? reqs : (reqs as any)?.data?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Demandes de Composants</CardTitle>
                    <CardDescription>
                        {isAdmin
                            ? "Gérez les demandes de composants émises par les étudiants. Validez ou refusez-les."
                            : "Demandez de nouveaux composants pour vos projets."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ComponentRequestsCrudPanel requests={data} isAdmin={isAdmin} currentUserId={currentUserId} />
                </CardContent>
            </Card>
        </div>
    );
}
