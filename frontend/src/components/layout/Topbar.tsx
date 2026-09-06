import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, Search, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { SidebarContent } from "./Sidebar";
import { useAgent } from "./agent-context";
import { cn } from "@/lib/utils";
import { getAuditLogs } from "@/services/api";
import { apiRequest } from "@/services/api";

type Alert = {
  id: number;
  title: string;
  message: string;
  severity: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export function Topbar({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const { active } = useAgent();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Fetch real alerts from backend
  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        setLoadingAlerts(true);

        const response = await apiRequest<any>("/alerts");

        if (!cancelled) {
          setAlerts(Array.isArray(response?.alerts) ? response.alerts : []);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);

        if (!cancelled) {
          setAlerts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAlerts(false);
        }
      }
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  const getToneClass = (severity: string) => {
    const normalized = severity.toLowerCase();

    if (normalized === "high" || normalized === "danger") {
      return "bg-danger";
    }

    if (normalized === "low" || normalized === "success") {
      return "bg-success";
    }

    return "bg-warning";
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (alert: Alert) => {
    if (alert.isRead) {
      return;
    }

    try {
      await fetch(`http://localhost:5000/api/alerts/${alert.id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
        {/* Mobile Navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-72 border-sidebar-border bg-sidebar p-0"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>

            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb + Page Title */}
        <div className="min-w-0 flex-1">
          <nav className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Acme Commerce
            </Link>

            <ChevronRight className="size-3" />

            <span className="text-foreground">{breadcrumb}</span>
          </nav>

          <h1 className="truncate text-[0.95rem] font-semibold text-foreground">
            {title}
          </h1>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            placeholder="Search transactions, customers, IDs…"
            className="h-9 w-64 rounded-lg border border-border bg-surface-muted pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-surface xl:w-80"
          />
        </div>

        {/* Agent Status */}
        <div
          className={cn(
            "hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium xl:flex",
            active
              ? "border-success/20 bg-success/5 text-success"
              : "border-border text-muted-foreground",
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

        {/* Notifications */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger
            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="size-4" />

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>

              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {loadingAlerts ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading notifications…
              </div>
            ) : alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-5 text-muted-foreground" />

                <p className="mt-2 text-sm font-medium text-foreground">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  You're all caught up.
                </p>
              </div>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(alert)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !alert.isRead && "bg-muted/20",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          getToneClass(alert.severity),
                        )}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm text-foreground",
                              !alert.isRead && "font-semibold",
                              alert.isRead && "font-medium",
                            )}
                          >
                            {alert.title}
                          </p>

                          {!alert.isRead && (
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {alert.message}
                        </p>

                        <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                          {formatTime(alert.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        {/* Merchant / Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg border border-border py-1 pr-2 pl-1 transition-colors hover:bg-muted"
            aria-label="Merchant account menu"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              AC
            </span>

            <span className="hidden text-sm font-medium sm:block">
              Acme Commerce
            </span>

            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            {/* Account Header */}
            <DropdownMenuLabel className="px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  AC
                </span>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    Neha Kapoor
                  </div>

                  <div className="text-xs font-normal text-muted-foreground">
                    Finance Operations
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Merchant Settings */}
            <DropdownMenuItem asChild>
              <Link to="/merchant-settings" className="cursor-pointer">
                Merchant settings
              </Link>
            </DropdownMenuItem>

            {/* Recovery Policies */}
            <DropdownMenuItem asChild>
              <Link to="/recovery-policies" className="cursor-pointer">
                Recovery policies
              </Link>
            </DropdownMenuItem>

            {/* Team & Approvals */}
            <DropdownMenuItem asChild>
              <Link to="/team-approvals" className="cursor-pointer">
                Team & approvals
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              className="cursor-pointer text-danger focus:text-danger"
              onClick={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
