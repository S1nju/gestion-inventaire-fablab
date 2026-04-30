"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import type { Stats } from "@/lib/inventory-api";
import { Package, PackageCheck, PackageX, AlertTriangle, FolderOpen, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899"];

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    return (
        <Card className={`border-l-4 ${color}`}>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace("border-", "bg-").replace("-500", "-100")}`}>
                    <Icon className={`size-6 ${color.replace("border-", "text-")}`} />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground font-medium">{label}</p>
                    <p className="text-3xl font-bold">{value.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function AnalyticsDashboard({ stats }: { stats: Stats }) {
    const pieData = [
        { name: "En Stock", value: stats.total_en_stock },
        { name: "En Projet", value: stats.total_en_projet },
        { name: "Perdus", value: stats.total_perdu },
        { name: "Endommagés", value: stats.total_endommage },
    ];

    const topItemsData = (stats.top_items || [])
        .filter(i => i.quantite_en_projet > 0 || i.quantite_en_stock > 0)
        .slice(0, 8)
        .map(i => ({
            name: i.nom.length > 20 ? i.nom.substring(0, 18) + "…" : i.nom,
            "En Stock": i.quantite_en_stock,
            "En Projet": i.quantite_en_projet,
            "Perdus": i.quantite_perdue,
            "Endommagés": i.quantite_endommagee,
        }));

    const laboData = (stats.by_labo || []).map(l => ({
        name: l.nom,
        "Articles": l.total_articles,
        "En Stock": l.total_stock,
    }));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard label="Total Articles" value={stats.total_articles} icon={Package} color="border-indigo-500" />
                <KpiCard label="En Stock" value={stats.total_en_stock} icon={PackageCheck} color="border-emerald-500" />
                <KpiCard label="En Projet" value={stats.total_en_projet} icon={FolderOpen} color="border-blue-500" />
                <KpiCard label="Perdus" value={stats.total_perdu} icon={PackageX} color="border-red-500" />
                <KpiCard label="Endommagés" value={stats.total_endommage} icon={AlertTriangle} color="border-amber-500" />
                <KpiCard label="Projets Actifs" value={stats.total_projets} icon={Users} color="border-pink-500" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition du Stock</CardTitle>
                        <CardDescription>Distribution globale de tous les articles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Items Bar Chart */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Articles les Plus Utilisés</CardTitle>
                        <CardDescription>Comparaison stock vs utilisation en projet</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topItemsData.length === 0 ? (
                            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                                Aucune donnée disponible — ajoutez des articles à des projets.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topItemsData} margin={{ bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="En Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="En Projet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Perdus" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Per Labo */}
            {laboData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Articles par Laboratoire</CardTitle>
                        <CardDescription>Nombre total d&apos;articles et articles disponibles en stock par labo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={laboData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Articles" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="En Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
