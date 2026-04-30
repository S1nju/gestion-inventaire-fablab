import { PrintButton } from "@/components/print-button";
import { getProject } from "@/lib/inventory-api";

export default async function FicheDechargePage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
    const { projectId } = await searchParams;

    if (!projectId) {
        return <div className="p-10 text-center">Veuillez spécifier un ID de projet (?projectId=...).</div>;
    }

    let project;
    try {
        project = await getProject(projectId);
    } catch (error) {
        return <div className="p-10 text-center text-red-500">Erreur lors de la récupération du projet.</div>;
    }

    if (!project) {
        return <div className="p-10 text-center">Projet introuvable.</div>;
    }

    const students = project.users?.filter(u => u.role === 'student').map(u => u.name).join(", ") || "_____________________";
    const encadreur = project.encadreur_nom || "_____________________";

    // items table formatting
    const items = project.items || [];
    const maxRows = 20;

    // Create rows splitting the table left to right
    const half = Math.ceil(maxRows / 2); // 10 rows per side

    return (
        <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white flex flex-col items-center">
            <div className="mb-4 print:hidden self-end">
                <PrintButton />
            </div>

            <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 shadow-lg print:shadow-none text-[13px] leading-tight font-serif print:p-0">

                {/* HEADER SECTION */}
                <div className="text-center font-bold mb-4 whitespace-pre-wrap">
                    REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE {"\n"}
                    الجمهورية الجزائرية الديمقراطية الشعبية
                </div>

                <div className="flex justify-between items-start text-xs font-bold leading-tight uppercase relative">
                    <div className="text-left w-1/3">
                        MINISTERE DE L'ENSEIGNEMENT SUPERIEUR {"\n"}
                        ET DE LA RECHERCHE SCIENTIFIQUE {"\n"}
                        ECOLE SUPERIEURE EN SCIENCES APPLIQUEES {"\n"}
                        --T L E M C E N--
                    </div>

                    <div className="w-16 h-16 border rounded-full flex items-center justify-center font-black absolute left-1/2 -translate-x-1/2 top-0">
                        ESSA
                    </div>

                    <div className="text-right w-1/3 font-arabic">
                        وزارة التعليم العالي والبحث العلمي {"\n"}
                        المدرسة العليا في العلوم التطبيقية {"\n"}
                        -تلمسان-
                    </div>
                </div>

                <div className="mt-6 font-bold text-sm">
                    Département de second cycle
                </div>

                {/* TITLE */}
                <div className="text-center font-bold text-xl my-6 leading-tight">
                    DECHARGE <br />
                    FICHE D'ETAT DE BESOIN
                </div>

                {/* BODY */}
                <div className="mb-4">
                    Je soussigne (nom et prénom de l'encadreur) : <span className="font-semibold underline decoration-dotted underline-offset-4">{encadreur}</span> m'engage
                </div>

                <div className="mb-2">
                    1/ à prendre en charge le matériel, les composants électronique.les produit chimique,...etc.
                </div>

                <div className="mb-4 pl-4 space-y-1">
                    <div>Pour :</div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                            {project.type === "Activités scientifiques" && "X"}
                        </div>
                        <span>Les activités scientifiques ;</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                            {project.type === "Mini projet" && "X"}
                        </div>
                        <span>Le mini projet ;</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                            {project.type === "PFE" && "X"}
                        </div>
                        <span>Le projet de fin d'études (PFE) ;</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                            {(!["Activités scientifiques", "Mini projet", "PFE"].includes(project.type)) && "X"}
                        </div>
                        <span>Autre (à préciser).....................................................................</span>
                    </div>
                </div>

                <div className="mb-6">
                    2/ et les remettre au département du second cycle une fois le travail terminé pour vérification de l'état du
                    matériel (lourd et petits composants) et pour alimenter les laboratoires et/ou pour leurs réutilisations
                    dans l'encadrement d'autre projets.
                </div>

                <div className="mb-4">
                    <span className="font-bold">Nom et prénoms des étudiants :</span> <span className="underline decoration-dotted underline-offset-4">{students}</span>
                </div>

                <div className="mb-4">
                    <span className="font-bold">Intitulé (du PFE, mini-projet) :</span> <span className="underline decoration-dotted underline-offset-4">{project.titre}</span>
                </div>

                <div className="mb-6">
                    <span className="font-bold">Année d'enseignement :</span> <span className="underline decoration-dotted underline-offset-4">{project.annee_enseignement || "_________________"}</span>
                </div>

                {/* TABLE */}
                <table className="w-full border-collapse border border-black text-xs text-center mb-10">
                    <thead>
                        <tr className="border border-black bg-gray-50">
                            <th className="border border-black p-1 w-8">N°</th>
                            <th className="border border-black p-1">Désignation</th>
                            <th className="border border-black p-1 w-16">Quantité</th>

                            <th className="border border-black p-1 w-8">N°</th>
                            <th className="border border-black p-1">Désignation</th>
                            <th className="border border-black p-1 w-16">Quantité</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: half }).map((_, i) => {
                            const leftItem = items[i];
                            const rightItem = items[i + half];

                            return (
                                <tr key={i} className="border border-black h-6">
                                    <td className="border border-black p-1">{i + 1}</td>
                                    <td className="border border-black p-1 text-left px-2">{leftItem?.nom || ""}</td>
                                    <td className="border border-black p-1">{leftItem?.pivot?.quantite || ""}</td>

                                    <td className="border border-black p-1">{i + 1 + half}</td>
                                    <td className="border border-black p-1 text-left px-2">{rightItem?.nom || ""}</td>
                                    <td className="border border-black p-1">{rightItem?.pivot?.quantite || ""}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* SIGNATURES */}
                <div className="flex justify-between mt-auto mb-10 font-bold text-sm">
                    <div>Date : .................</div>
                    <div>Encadreur</div>
                    <div>Avis du chef de département</div>
                    <div>Avis du directeur des études</div>
                </div>

            </div>
        </div>
    );
}
