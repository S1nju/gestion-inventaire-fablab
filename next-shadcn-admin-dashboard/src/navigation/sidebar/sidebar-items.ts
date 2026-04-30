import {
  Building2,
  ClipboardList,
  GraduationCap,
  Landmark,
  MoveHorizontal,
  PackageSearch,
  type LucideIcon,
  UserRoundCog,
  Users,
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
    label: "Inventaire",
    items: [
      {
        title: "Inventaire",
        url: "/dashboard/inventory",
        icon: PackageSearch,
      },
      {
        title: "Responsables",
        url: "/dashboard/responsables",
        icon: Users,
      },
      {
        title: "Facultes",
        url: "/dashboard/faculties",
        icon: GraduationCap,
      },
      {
        title: "Services",
        url: "/dashboard/services",
        icon: Building2,
      },
      {
        title: "Bureaux",
        url: "/dashboard/bureaus",
        icon: Landmark,
      },
      {
        title: "Mouvements",
        url: "/dashboard/movements",
        icon: MoveHorizontal,
      },
      {
        title: "Fiche d'inventaire",
        url: "/dashboard/print/fiche-inventaire",
        icon: ClipboardList,
      },
      {
        title: "Profil",
        url: "/dashboard/profile",
        icon: UserRoundCog,
      },
    ],
  },
];
