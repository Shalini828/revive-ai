import { CalendarClock, CreditCard, RefreshCcw, ShoppingCart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { compactINR, formatINR } from "@/lib/format";
import type { LeakageCategory, LeakageType } from "@/types";

const icons: Record<LeakageType, typeof CreditCard> = {
  failed_payment: CreditCard,
  abandoned_checkout: ShoppingCart,
  failed_subscription: RefreshCcw,
  overdue_invoice: CalendarClock,
};

export function CategoryGrid({ categories }: { categories: LeakageCategory[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((c) => {
        const Icon = icons[c.id];
        return (
          <Link
            key={c.id}
            to="/opportunities"
            search={{ type: c.id }}
            className="panel group p-5 transition-shadow hover:shadow-raised"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-muted ring-1 ring-border">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <span className="num text-xs text-muted-foreground">{c.count} items</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{c.label}</h3>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">At risk</dt>
                <dd className="num font-medium text-foreground">{formatINR(c.atRisk)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Recoverable</dt>
                <dd className="num font-medium text-foreground">{compactINR(c.recoverable)}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Recovery rate</span>
                <span className="num font-semibold text-foreground">{c.recoveryRate}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${c.recoveryRate}%` }} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
