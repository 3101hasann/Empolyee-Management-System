"use client";

import {
  LayoutGrid,
  NotebookText,
  CirclePlus,
  Sparkles,
  Users,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Highlight only on exact match (so /batches/new lights "Create Batch"). */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/batches", label: "Batches", icon: NotebookText, exact: true },
  { href: "/batches/new", label: "Create Batch", icon: CirclePlus },
  { href: "/internees", label: "Internees", icon: Users, exact: true },
  { href: "/internees/new", label: "Create Internee", icon: UserRoundPlus },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
              isActive &&
                "border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
