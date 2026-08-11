import type { ReactNode } from "react";

import { LogOut } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { AssistantWidget } from "@/features/assistant/components/assistant-widget";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/guards";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div
      className="flex min-h-svh"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 45% 55% at 0% 100%, oklch(0.62 0.16 130 / 30%), transparent 70%), radial-gradient(ellipse 45% 55% at 100% 0%, oklch(0.55 0.11 240 / 30%), transparent 70%)",
      }}
    >
      <aside className="sticky top-0 h-svh w-64 shrink-0 p-4 pr-0">
        <div className="flex h-full flex-col rounded-2xl border border-sidebar-border bg-sidebar p-4">
          <div className="px-2 py-4">
            <BrandLogo />
          </div>
          <div className="mt-4 flex-1">
            <SidebarNav />
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      <AssistantWidget />
      <Toaster position="top-right" richColors />
    </div>
  );
}
