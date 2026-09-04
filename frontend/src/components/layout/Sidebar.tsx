import { Link } from "@tanstack/react-router";
import { CircleDot, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";
import { useAgent } from "@/components/layout/agent-context";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { active } = useAgent();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-accent ring-1 ring-sidebar-border">
          <Sparkles className="size-4.5 text-sidebar-accent-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            REVIVE AI
          </div>
          <div className="text-[0.6875rem] text-sidebar-muted">Revenue Recovery Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <p className="px-2 pb-2 text-[0.625rem] font-semibold tracking-[0.12em] text-sidebar-muted uppercase">
          Control Tower
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
            }}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-3 ring-1 ring-sidebar-border">
          <div className="text-[0.625rem] tracking-[0.1em] text-sidebar-muted uppercase">Merchant</div>
          <div className="mt-0.5 text-sm font-medium text-sidebar-accent-foreground">Acme Commerce</div>
          <div className="mt-3 flex items-center gap-2">
            <CircleDot
              className={cn("size-3.5", active ? "text-success" : "text-sidebar-muted")}
            />
            <span className="text-xs text-sidebar-muted">
              {active ? "AI Agent Active" : "AI Agent Paused"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
