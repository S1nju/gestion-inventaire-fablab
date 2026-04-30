"use client";

import Link from "next/link";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: { id?: string; name: string; email: string; avatar: string; role?: string };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {

  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const filteredItems = user?.role === "student"
    ? sidebarItems
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.title === "Demandes (Composants)" || item.title === "Projets"
        ),
      }))
      .filter((group) => group.items.length > 0)
    : sidebarItems;

  return (
    <Sidebar
      {...props}
      variant={variant}
      collapsible={collapsible}
      style={{
        "--sidebar": "#2E7D8C",
        "--sidebar-foreground": "white",
        "--sidebar-accent": "#266b78",
        "--sidebar-accent-foreground": "white",
        "--sidebar-border": "#2E7D8C"
      } as React.CSSProperties}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard/inventory" className="flex items-center gap-2">
                <div className=" rounded-md px-2 py-1 items-center flex justify-center shadow-xs">
                  <img src="/dashboardlogo.png" alt="FabStock Logo" className="h-9 w-auto object-contain" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user ?? {
              name: "User",
              email: "",
              avatar: "",
            }
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
