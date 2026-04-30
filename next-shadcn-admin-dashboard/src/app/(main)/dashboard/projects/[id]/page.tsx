import { getProject, getArmoirs, getCasiers, getItems, getStudents, getEncadrants } from "@/lib/inventory-api";
import { getAuthenticatedUser } from "@/lib/laravel-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { ProjectProfilePanel } from "./_components/project-profile-panel";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectProfilePage({ params }: Props) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    const isAdmin = user?.role === "admin";

    let project;
    try {
        project = await getProject(id);
    } catch {
        return <div className="p-8 text-red-500">Projet introuvable ou erreur de chargement.</div>;
    }

    // For item-search: load all armoirs, casiers, and items
    const [armoirs, casiers, items, students, encadrants] = await Promise.allSettled([
        getArmoirs({ per_page: "200" }),
        getCasiers({ per_page: "500" }),
        getItems({ per_page: "500" }),
        getStudents(),
        getEncadrants(),
    ]);

    const armoirsData = armoirs.status === "fulfilled" ? (Array.isArray(armoirs.value) ? armoirs.value : []) : [];
    const casiersData = casiers.status === "fulfilled" ? (Array.isArray(casiers.value) ? casiers.value : []) : [];
    const rawItems = items.status === "fulfilled"
        ? (items.value as any)?.data?.data ?? (items.value as any)?.data ?? (Array.isArray(items.value) ? items.value : [])
        : [];
    const studentsData = students.status === "fulfilled" ? (Array.isArray(students.value) ? students.value : []) : [];
    const encadrantsData = encadrants.status === "fulfilled" ? (Array.isArray(encadrants.value) ? encadrants.value : (encadrants.value as any)?.data || []) : [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/dashboard/projects"><ArrowLeft className="size-4" /></Link>
                        </Button>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="truncate">{project.titre}</CardTitle>
                            <CardDescription>
                                {project.type} • {project.annee_enseignement || "—"} • Encadrant: {(project as any).encadrant?.nom || "—"}
                            </CardDescription>
                        </div>
                        <Button asChild variant="secondary">
                            <Link href={`/dashboard/print/fiche-decharge?projectId=${id}`}>
                                <Printer className="size-4 mr-2" /> Fiche de Décharge
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProjectProfilePanel
                        project={project}
                        isAdmin={isAdmin}
                        allArmoirs={armoirsData}
                        allCasiers={casiersData}
                        allItems={rawItems}
                        allStudents={studentsData}
                        encadrants={encadrantsData}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
