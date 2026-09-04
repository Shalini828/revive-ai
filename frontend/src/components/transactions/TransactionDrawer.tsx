import { CircleAlert, CircleCheck, CircleDot, Clock, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ConfidenceMeter,
  GuardrailBadge,
  RecoveryStatusBadge,
  TransactionStatusBadge,
} from "@/components/common/Badges";
import { formatDateTime, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

const stateIcon = {
  done: CircleCheck,
  active: CircleDot,
  pending: Clock,
  failed: CircleAlert,
} as const;

const stateColor = {
  done: "text-success",
  active: "text-info",
  pending: "text-muted-foreground",
  failed: "text-danger",
} as const;

export function TransactionDrawer({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!transaction) return null;
  const t = transaction;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-1">
          <SheetTitle className="num text-base">{t.id}</SheetTitle>
          <SheetDescription>
            {t.customer} · {t.email}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <TransactionStatusBadge status={t.status} />
            <RecoveryStatusBadge status={t.recoveryStatus} />
            {t.guardrail ? <GuardrailBadge result={t.guardrail} /> : null}
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="section-label">Transaction amount</p>
            <p className="num mt-1 text-2xl font-semibold text-foreground">{formatINR(t.amount)}</p>
            {t.expectedRecovery ? (
              <p className="num mt-1 text-xs text-success">
                Expected recovery {formatINR(t.expectedRecovery)}
              </p>
            ) : null}
          </div>

          <section className="rounded-xl border border-info/25 bg-info-soft p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-info" />
              <p className="section-label text-info">Why the AI decided this</p>
            </div>
            <p className="mt-2 text-sm text-foreground">{t.explanation}</p>
            {t.action ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Action taken: <span className="font-medium text-foreground">{t.action}</span>
              </p>
            ) : null}
            {t.confidence !== null ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <ConfidenceMeter value={t.confidence} />
              </div>
            ) : null}
          </section>

          <section>
            <p className="section-label">Recovery timeline</p>
            <ol className="mt-3 space-y-4">
              {t.timeline.map((e) => {
                const Icon = stateIcon[e.state];
                return (
                  <li key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Icon className={cn("size-4", stateColor[e.state])} />
                      <span className="mt-1 w-px flex-1 bg-border" />
                    </div>
                    <div className="-mt-0.5 pb-1">
                      <p className="text-sm font-medium text-foreground">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.detail}</p>
                      <p className="num mt-0.5 text-[0.6875rem] text-muted-foreground">
                        {formatDateTime(e.timestamp)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <p className="section-label">Details</p>
            <dl className="mt-2">
              <Row label="Payment method" value={t.method} />
              <Row label="Failure reason" value={t.failureReason ?? "—"} />
              <Row label="Date" value={formatDateTime(t.date)} />
              <Row label="Customer email" value={t.email} />
            </dl>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
