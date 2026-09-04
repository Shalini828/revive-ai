import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NAV_ITEMS } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = NAV_ITEMS.find((n) => pathname.startsWith(n.to)) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>
      <div className="lg:pl-64">
        <Topbar title={item.title} breadcrumb={item.label} />
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
