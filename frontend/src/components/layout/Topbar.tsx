import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarContent } from "./Sidebar";
import { useAgent } from "./agent-context";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "High-value intervention awaiting approval",
    detail: "Meera Joshi · ₹62,000 · 3DS abandoned",
    time: "2m ago",
    tone: "warning" as const,
  },
  {
    id: "n2",
    title: "₹26,400 recovered",
    detail: "Checkout #77425 · UPI collect re-issued",
    time: "34m ago",
    tone: "success" as const,
  },
  {
    id: "n3",
    title: "Fraud guardrail triggered",
    detail: "Payment #92866 · automation disabled",
    time: "1h ago",
    tone: "danger" as const,
  },
];

export function Topbar({ title, breadcrumb }: { title: string; breadcrumb: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { active } = useAgent();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <nav className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Acme Commerce
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{breadcrumb}</span>
          </nav>
          <h1 className="truncate text-[0.95rem] font-semibold text-foreground">{title}</h1>
        </div>

        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search transactions, customers, IDs…"
            className="h-9 w-64 rounded-lg border border-border bg-surface-muted pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-surface xl:w-80"
          />
        </div>

        <div
          className={cn(
            "hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium xl:flex",
            active ? "text-success" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              active ? "animate-pulse bg-success" : "bg-muted-foreground",
            )}
          />
          {active ? "Agent Active" : "Agent Paused"}
        </div>

        <Popover>
          <PopoverTrigger
            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
            <ul className="divide-y divide-border">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.tone === "success" && "bg-success",
                      n.tone === "warning" && "bg-warning",
                      n.tone === "danger" && "bg-danger",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
                    <p className="mt-1 text-[0.6875rem] text-muted-foreground">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border py-1 pr-2 pl-1 transition-colors hover:bg-muted">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              AC
            </span>
            <span className="hidden text-sm font-medium sm:block">Acme Commerce</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">Neha Kapoor</div>
              <div className="text-xs font-normal text-muted-foreground">Finance Operations</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Merchant settings</DropdownMenuItem>
            <DropdownMenuItem>Recovery policies</DropdownMenuItem>
            <DropdownMenuItem>Team & approvals</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
