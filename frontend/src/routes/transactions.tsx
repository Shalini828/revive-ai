import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import {
  Pill,
  RecoveryStatusBadge,
  TransactionStatusBadge,
} from "@/components/common/Badges";
import type { Opportunity, RecoveryStatus } from "@/types";
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { formatDateTime, formatINR } from "@/lib/format";
import { getTransactions, queryKeys } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

const transactionsQuery = {
  queryKey: queryKeys.transactions,
  queryFn: getTransactions,
};

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions · REVIVE AI" },
      {
        name: "description",
        content:
          "Every payment, failure reason and recovery attempt in one searchable ledger with explainable AI decisions.",
      },
      {
        property: "og:title",
        content: "Transactions · REVIVE AI",
      },
      {
        property: "og:description",
        content:
          "A searchable ledger of payments, failures and recovery attempts.",
      },
    ],
  }),

  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(transactionsQuery);
  },

  component: TransactionsPage,
});

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Th({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-2.5 text-left font-semibold", className)}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "inline-flex items-center gap-1 transition-colors hover:text-foreground",
            active && "text-foreground",
          )}
        >
          {children}
          <ArrowUpDown className="size-3" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

type SortKey = "date" | "amount" | "customer";

function normalizeText(value: unknown, fallback = "") {
  return String(value ?? fallback);
}

function getCustomer(transaction: Transaction) {
  return (
    normalizeText(
      (transaction as any).customer ??
        (transaction as any).customerName ??
        (transaction as any).title,
    ) || "Unknown customer"
  );
}

function getEmail(transaction: Transaction) {
  return normalizeText((transaction as any).email);
}

function getMethod(transaction: Transaction) {
  return (
    normalizeText(
      (transaction as any).method ??
        (transaction as any).paymentMethod ??
        (transaction as any).payment_method,
    ) || "—"
  );
}

function getFailureReason(transaction: Transaction) {
  return (
    normalizeText(
      (transaction as any).failureReason ??
        (transaction as any).failure_reason ??
        (transaction as any).description,
    ) || "—"
  );
}

function getTransactionDate(transaction: Transaction) {
  return (
    normalizeText(
      (transaction as any).date ??
        (transaction as any).createdAt ??
        (transaction as any).created_at,
    ) || new Date().toISOString()
  );
}

function getRecoveryStatus(transaction: Transaction) {
  const explicit = normalizeText(
    (transaction as any).recoveryStatus,
  ).toLowerCase();

  if (explicit) {
    return explicit;
  }

  const status = normalizeText(transaction.status).toLowerCase();

  if (status === "failed") {
    return "queued";
  }

  if (["recovered", "successful"].includes(status)) {
    return "recovered";
  }

  return "not_required";
}

function TransactionsPage() {
  const { data } = useSuspenseQuery(transactionsQuery);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [recovery, setRecovery] = useState("all");

  const [sort, setSort] = useState<SortKey>("date");
  const [desc, setDesc] = useState(true);

  const [selected, setSelected] = useState<Transaction | null>(null);

  const methods = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((transaction) => getMethod(transaction))
            .filter((method) => method !== "—"),
        ),
      ).sort(),
    [data],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = data.filter((transaction) => {
      const customer = getCustomer(transaction);
      const email = getEmail(transaction);
      const failureReason = getFailureReason(transaction);
      const transactionMethod = getMethod(transaction);
      const recoveryStatus = getRecoveryStatus(transaction);

      if (
        status !== "all" &&
        String(transaction.status).toLowerCase() !== status.toLowerCase()
      ) {
        return false;
      }

      if (method !== "all" && transactionMethod !== method) {
        return false;
      }

      if (recovery !== "all" && recoveryStatus !== recovery) {
        return false;
      }

      if (!q) return true;

      return (
        String(transaction.id).toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        failureReason.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const direction = desc ? -1 : 1;

      if (sort === "amount") {
        return (Number(a.amount) - Number(b.amount)) * direction;
      }

      if (sort === "customer") {
        return getCustomer(a).localeCompare(getCustomer(b)) * direction;
      }

      return (
        (new Date(getTransactionDate(a)).getTime() -
          new Date(getTransactionDate(b)).getTime()) *
        direction
      );
    });
  }, [data, query, status, method, recovery, sort, desc]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDesc((current) => !current);
      return;
    }

    setSort(key);
    setDesc(true);
  };

  const totalValue = rows.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every payment, failure and recovery attempt — fully auditable."
        actions={
          <button
            type="button"
            onClick={() =>
              toast.success("Export queued", {
                description: `${rows.length} transactions will be emailed as CSV.`,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" />
            Export CSV
          </button>
        }
      />

      <Panel>
        <PanelHeader
          title={`${rows.length} transactions`}
          subtitle={`Total value ${formatINR(totalValue)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ID, customer, reason"
                  className="h-9 w-56 rounded-lg border border-border bg-surface pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <Select
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  {
                    value: "all",
                    label: "All statuses",
                  },
                  {
                    value: "successful",
                    label: "Successful",
                  },
                  {
                    value: "failed",
                    label: "Failed",
                  },
                  {
                    value: "pending",
                    label: "Pending",
                  },
                  {
                    value: "recovered",
                    label: "Recovered",
                  },
                  {
                    value: "abandoned",
                    label: "Abandoned",
                  },
                ]}
              />

              <Select
                label="Method"
                value={method}
                onChange={setMethod}
                options={[
                  {
                    value: "all",
                    label: "All methods",
                  },
                  ...methods.map((item) => ({
                    value: item,
                    label: item,
                  })),
                ]}
              />

              <Select
                label="Recovery"
                value={recovery}
                onChange={setRecovery}
                options={[
                  {
                    value: "all",
                    label: "All recovery",
                  },
                  {
                    value: "not_required",
                    label: "Not required",
                  },
                  {
                    value: "queued",
                    label: "Queued",
                  },
                  {
                    value: "in_progress",
                    label: "In progress",
                  },
                  {
                    value: "recovered",
                    label: "Recovered",
                  },
                  {
                    value: "unrecoverable",
                    label: "Unrecoverable",
                  },
                ]}
              />
            </div>
          }
        />

        <PanelBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-[0.6875rem] tracking-[0.08em] text-muted-foreground uppercase">
                  <Th className="pl-5">Transaction ID</Th>

                  <Th
                    onClick={() => toggleSort("customer")}
                    active={sort === "customer"}
                  >
                    Customer
                  </Th>

                  <Th
                    onClick={() => toggleSort("amount")}
                    active={sort === "amount"}
                  >
                    Amount
                  </Th>

                  <Th>Method</Th>

                  <Th>Status</Th>

                  <Th>Failure reason</Th>

                  <Th
                    onClick={() => toggleSort("date")}
                    active={sort === "date"}
                  >
                    Date
                  </Th>

                  <Th className="pr-5">Recovery</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {rows.map((transaction) => {
                  const customer = getCustomer(transaction);

                  const email = getEmail(transaction);

                  const method = getMethod(transaction);

                  const failureReason = getFailureReason(transaction);

                  const date = getTransactionDate(transaction);

                  const recoveryStatus = getRecoveryStatus(transaction);

                  return (
                    <tr
                      key={String(transaction.id)}
                      onClick={() => setSelected(transaction)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted"
                    >
                      <td className="num py-3 pr-4 pl-5 font-medium text-foreground">
                        {String(transaction.id)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {customer}
                        </div>

                        {email ? (
                          <div className="text-xs text-muted-foreground">
                            {email}
                          </div>
                        ) : null}
                      </td>

                      <td className="num px-4 py-3 font-semibold text-foreground">
                        {formatINR(Number(transaction.amount || 0))}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {method}
                      </td>

                      <td className="px-4 py-3">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>

                      <td className="max-w-[220px] px-4 py-3 text-muted-foreground">
                        {failureReason}
                      </td>

                      <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(date)}
                      </td>

                      <td className="px-4 py-3 pr-5">
                        <RecoveryStatusBadge
                          status={recoveryStatus as RecoveryStatus}
                        />
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      No transactions match these filters.
                      <div className="mt-3">
                        <Pill tone="neutral">Try clearing the search</Pill>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </PanelBody>
      </Panel>

      <TransactionDrawer
        transaction={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      />
    </>
  );
}
