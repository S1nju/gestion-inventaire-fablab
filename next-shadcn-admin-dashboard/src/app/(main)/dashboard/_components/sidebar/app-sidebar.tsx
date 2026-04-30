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

  return (
    <Sidebar
      {...props}
      variant={variant}
      collapsible={collapsible}
      className="border-r-0"
      style={{
        "--sidebar": "oklch(0.53 0.08 221)",
        "--sidebar-foreground": "oklch(1 0 0)",
        "--sidebar-accent": "oklch(0.4 0.08 221)",
        "--sidebar-accent-foreground": "oklch(1 0 0)",
        "--sidebar-border": "oklch(0.50 0.08 221)"
      } as React.CSSProperties}
    >
      <SidebarHeader>
        <SidebarMenu >
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-14 hover:bg-transparent hover:text-white data-[state=open]:bg-transparent">
              <Link prefetch={false} href="/dashboard/analytics" className="flex items-center justify-center">
                <img src="/dashboardlogo.png" alt="Dashboard Logo" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[#2E7D8C]">
        <NavMain items={sidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-[#2E7D8C]">
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
