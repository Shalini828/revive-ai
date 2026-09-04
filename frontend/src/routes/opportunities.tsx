import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelHeader } from "@/components/common/Panel";
import {
  ConfidenceMeter,
  OpportunityStatusBadge,
  PriorityBadge,
  TypeBadge,
} from "@/components/common/Badges";
import { OpportunityDrawer } from "@/components/opportunities/OpportunityDrawer";
import { formatINR } from "@/lib/format";
import { getOpportunities, queryKeys } from "@/services/api";
import type { LeakageType, Opportunity, OpportunityStatus } from "@/types";
import { cn } from "@/lib/utils";

const opportunitiesQuery = { queryKey: queryKeys.opportunities, queryFn: getOpportunities };

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "failed_payment", label: "Failed Payments" },
  { id: "abandoned_checkout", label: "Abandoned Checkout" },
  { id: "failed_subscription", label: "Subscriptions" },
  { id: "overdue_invoice", label: "Invoices" },
] as const;

const STATUS_OPTIONS: (OpportunityStatus | "all")[] = [
  "all",
  "recommended",
  "pending",
  "in_progress",
  "approved",
  "recovered",
  "dismissed",
];

type SortKey = "amount" | "confidence" | "recoverability" | "detectedAt";

export const Route = createFileRoute("/opportunities")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? (search.type as LeakageType) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Revenue Opportunities · REVIVE AI" },
      {
        name: "description",
        content: "Prioritized revenue recovery opportunities ranked by recoverable value and confidence.",
      },
      { property: "og:title", content: "Revenue Opportunities · REVIVE AI" },
      {
        property: "og:description",
        content: "Prioritized revenue recovery opportunities identified by REVIVE AI.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(opportunitiesQuery);
  },
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { data } = useSuspenseQuery(opportunitiesQuery);
  const { type: typeFromSearch } = Route.useSearch();

  const [typeFilter, setTypeFilter] = useState<string>(typeFromSearch ?? "all");
  const [status, setStatus] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("all");
  const [minConfidence, setMinConfidence] = useState<string>("all");
  const [range, setRange] = useState<string>("30d");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const amountFloor = minAmount === "all" ? 0 : Number(minAmount);
    const confidenceFloor = minConfidence === "all" ? 0 : Number(minConfidence);

    const filtered = data.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (status !== "all" && o.status !== status) return false;
      if (o.amount < amountFloor) return false;
      if (o.confidence < confidenceFloor) return false;
      if (!q) return true;
      return (
        o.customer.toLowerCase().includes(q) ||
        o.transactionId.toLowerCase().includes(q) ||
        o.reason.toLowerCase().includes(q) ||
        o.recommendation.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const av = sortKey === "detectedAt" ? new Date(a.detectedAt).getTime() : a[sortKey];
      const bv = sortKey === "detectedAt" ? new Date(b.detectedAt).getTime() : b[sortKey];
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [data, typeFilter, status, minAmount, minConfidence, query, sortKey, sortAsc]);

  const totals = useMemo(
    () => ({
      atRisk: rows.reduce((s, o) => s + o.amount, 0),
      recoverable: rows.reduce((s, o) => s + o.expectedRecovery, 0),
    }),
    [rows],
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        sortKey === k && "text-foreground",
      )}
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  );

  return (
    <>
      <PageHeader
        title="Revenue Opportunities"
        subtitle="Prioritized opportunities identified by REVIVE AI."
        actions={
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">At risk </span>
              <span className="num font-semibold">{formatINR(totals.atRisk)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-muted-foreground">Expected recovery </span>
              <span className="num font-semibold text-success">{formatINR(totals.recoverable)}</span>
            </div>
          </div>
        }
      />

      <Panel>
        <PanelHeader
          title={`${rows.length} opportunities`}
          subtitle="Click any row to open the full AI decision record."
          actions={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer, ID, reason…"
                className="h-9 w-64 rounded-lg border border-border bg-surface-muted pr-3 pl-9 text-sm outline-none focus:border-ring focus:bg-surface"
              />
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  typeFilter === f.id
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <Select value={status} onChange={setStatus} label="Status">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select value={minAmount} onChange={setMinAmount} label="Amount">
              <option value="all">Any amount</option>
              <option value="5000">₹5,000+</option>
              <option value="20000">₹20,000+</option>
              <option value="50000">₹50,000+</option>
            </Select>
            <Select value={minConfidence} onChange={setMinConfidence} label="Confidence">
              <option value="all">Any confidence</option>
              <option value="75">75%+</option>
              <option value="85">85%+</option>
              <option value="90">90%+</option>
            </Select>
            <Select value={range} onChange={setRange} label="Date">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                <th className="px-5 py-2.5">Transaction ID</th>
                <th className="px-5 py-2.5">Customer</th>
                <th className="px-5 py-2.5">Type</th>
                <th className="px-5 py-2.5">
                  <SortHeader label="Amount" k="amount" />
                </th>
                <th className="px-5 py-2.5">Leakage Reason</th>
                <th className="px-5 py-2.5">
                  <SortHeader label="Recoverability" k="recoverability" />
                </th>
                <th className="px-5 py-2.5">AI Recommendation</th>
                <th className="px-5 py-2.5">
                  <SortHeader label="Confidence" k="confidence" />
                </th>
                <th className="px-5 py-2.5">Priority</th>
                <th className="px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer transition-colors hover:bg-surface-muted"
                >
                  <td className="num px-5 py-3 text-xs text-muted-foreground">{o.transactionId}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{o.customer}</div>
                    <div className="text-xs text-muted-foreground">{o.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <TypeBadge type={o.type} />
                  </td>
                  <td className="num px-5 py-3 font-medium">{formatINR(o.amount)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{o.reason}</td>
                  <td className="num px-5 py-3">{o.recoverability}%</td>
                  <td className="px-5 py-3">{o.recommendation}</td>
                  <td className="px-5 py-3">
                    <ConfidenceMeter value={o.confidence} />
                  </td>
                  <td className="px-5 py-3">
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <OpportunityStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No opportunities match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <OpportunityDrawer
        opportunity={selected}
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </>
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground capitalize outline-none focus:border-ring"
    >
      {children}
    </select>
  );
}
