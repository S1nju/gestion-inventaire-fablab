import { getProjects, getEncadrants, getStudents } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/laravel-auth";
import { ProjectsCrudPanel } from "./_components/projects-crud-panel";

export default async function ProjectsPage() {
    const user = await getAuthenticatedUser();
    const isAdmin = user?.role === "admin";
    const currentUserId = user?.id;

    const projects = await getProjects({ per_page: "100" });
    const data = Array.isArray(projects) ? projects : (projects as any)?.data?.data || [];

    const encadrants = await getEncadrants().catch(() => []);
    const encadrantsData = Array.isArray(encadrants) ? encadrants : (encadrants as any)?.data || [];

    const students = await getStudents().catch(() => []);
    const studentsData = Array.isArray(students) ? students : (students as any)?.data || [];

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Projets</CardTitle>
                    <CardDescription>Les projets actifs et les composants assignés. Imprimez leurs fiches de décharge.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProjectsCrudPanel projects={data} students={studentsData} encadrants={encadrantsData} isAdmin={isAdmin} currentUserId={currentUserId} />
                </CardContent>
            </Card>
        </div>
    );
}
