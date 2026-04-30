import type { ReactNode } from "react";

import { Command } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh  justify-center p-2 lg:grid-cols-2">
        <div className="relative  order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute  bg-[#2E7D8C]  rounded-3xl h-full flex flex-col items-center justify-center space-y-1 px-10 text-primary-foreground">
            <img src="/loginpanel.png" alt="FabStock Logo" className="h-full w-auto object-contain" />

          </div>


        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
