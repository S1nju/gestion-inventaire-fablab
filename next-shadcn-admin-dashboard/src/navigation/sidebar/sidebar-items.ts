import {
  Building2,
  PackageSearch,
  Box,
  LayoutGrid,
  FileCode2,
  FileDown,
  UserRoundCog,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 0,
    label: "Vue d'ensemble",
    items: [
      {
        title: "Tableau de Bord",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: 1,
    label: "Inventaire & Stock",
    items: [
      {
        title: "Inventaire",
        url: "/dashboard/inventory",
        icon: PackageSearch,
      },
      {
        title: "Demandes (Composants)",
        url: "/dashboard/component-requests",
        icon: FileDown,
      },
    ],
  },
  {
    id: 2,
    label: "Gestion des Projets",
    items: [
      {
        title: "Projets",
        url: "/dashboard/projects",
        icon: FileCode2,
      },
      {
        title: "Encadrants",
        url: "/dashboard/encadrants",
        icon: UserRoundCog,
      }
    ],
  },
  {
    id: 3,
    label: "Structure Physique",
    items: [
      {
        title: "Labos",
        url: "/dashboard/labos",
        icon: Building2,
      }
    ],
  },
  {
    id: 4,
    label: "Paramètres",
    items: [
      {
        title: "Profil",
        url: "/dashboard/profile",
        icon: UserRoundCog,
      },
    ],
  },
];
