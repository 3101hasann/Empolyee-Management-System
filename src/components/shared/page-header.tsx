import type { ReactNode } from "react";

import { Bell } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {/* Decorative in v1 — notifications are a future module. */}
        <span className="flex size-10 items-center justify-center rounded-full bg-card">
          <Bell className="size-4 text-muted-foreground" />
        </span>
      </div>
    </header>
  );
}
