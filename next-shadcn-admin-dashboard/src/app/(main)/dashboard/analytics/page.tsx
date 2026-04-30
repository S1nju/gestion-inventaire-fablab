import { getStats } from "@/lib/inventory-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsDashboard } from "./_components/analytics-dashboard";

export default async function AnalyticsPage() {
  let stats;
  try {
    stats = await getStats();
  } catch {
    return <div className="p-8 text-red-500">Impossible de charger les statistiques. Vérifiez la connexion au serveur.</div>;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de l&apos;inventaire du FabLab</p>
      </div>
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
