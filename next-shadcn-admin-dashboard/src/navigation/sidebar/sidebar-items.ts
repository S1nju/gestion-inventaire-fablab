import {
  Building2,
  PackageSearch,
  Box,
  LayoutGrid,
  FileCode2,
  FileDown,
  UserRoundCog,
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
        title: "Fiche de Décharge",
        url: "/dashboard/print/fiche-decharge",
        icon: FileDown,
      },
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
      },
      {
        title: "Armoirs",
        url: "/dashboard/armoirs",
        icon: LayoutGrid,
      },
      {
        title: "Casiers",
        url: "/dashboard/casiers",
        icon: Box,
      },
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
