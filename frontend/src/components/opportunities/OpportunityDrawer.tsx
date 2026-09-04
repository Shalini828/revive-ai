import { useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  ConfidenceMeter,
  GuardrailBadge,
  OpportunityStatusBadge,
  PriorityBadge,
  TypeBadge,
} from "@/components/common/Badges";
import { formatDateTime, formatINR } from "@/lib/format";
import { dismissOpportunity, executeRecovery } from "@/services/api";
import type { Opportunity } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function OpportunityDrawer({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [decision, setDecision] = useState<"approved" | "dismissed" | null>(null);

  if (!opportunity) return null;
  const o = opportunity;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setDecision(null);
        onOpenChange(v);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetTitle className="sr-only">Opportunity {o.transactionId}</SheetTitle>

        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="num text-xs text-muted-foreground">{o.transactionId}</span>
            <TypeBadge type={o.type} />
            <PriorityBadge priority={o.priority} />
          </div>
          <h2 className="num mt-3 text-2xl font-semibold text-foreground">{formatINR(o.amount)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {o.customer} · {o.email}
          </p>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="section-label">AI Diagnosis</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{o.diagnosis}</p>
          </div>

          <div className="rounded-xl border border-info/25 bg-info-soft p-4">
            <p className="section-label text-info">Recommended action</p>
            <p className="mt-2 text-sm font-medium text-foreground">{o.recommendation}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Confidence</span>
                <div className="mt-1">
                  <ConfidenceMeter value={o.confidence} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Expected recovery</span>
                <div className="num mt-1 text-sm font-semibold text-success">
                  {formatINR(o.expectedRecovery)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <p className="section-label">Guardrail check</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <GuardrailBadge result={o.guardrail} />
              <span className="text-xs text-muted-foreground">{o.guardrailNote}</span>
            </div>
          </div>

          <dl className="divide-y divide-border">
            <Row label="Leakage reason" value={o.reason} />
            <Row label="Recoverability" value={`${o.recoverability}%`} />
            <Row label="Attempts so far" value={o.attempts} />
            <Row label="Customer history" value={o.customerHistory} />
            <Row label="Detected at" value={formatDateTime(o.detectedAt)} />
            <Row
              label="Status"
              value={
                <OpportunityStatusBadge
                  status={decision === "approved" ? "approved" : decision === "dismissed" ? "dismissed" : o.status}
                />
              }
            />
          </dl>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface px-6 py-4">
          <button
            type="button"
            disabled={decision !== null || o.guardrail === "blocked"}
            onClick={() => {
              setDecision("approved");
              void executeRecovery(o.id);
              toast.success(`Recovery approved for ${o.customer}`, { description: o.recommendation });
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Check className="size-4" />
            {decision === "approved" ? "Approved" : "Approve recovery"}
          </button>
          <button
            type="button"
            disabled={decision !== null}
            onClick={() => {
              setDecision("dismissed");
              void dismissOpportunity(o.id);
              toast(`Opportunity ${o.transactionId} dismissed`);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <X className="size-4" /> Dismiss
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
