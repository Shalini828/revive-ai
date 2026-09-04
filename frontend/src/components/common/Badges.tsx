import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  GuardrailResult,
  LeakageType,
  OpportunityStatus,
  Priority,
  RecoveryStatus,
  TransactionStatus,
} from "@/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
  primary: "bg-secondary text-secondary-foreground ring-border-strong",
};

export function Pill({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const priorityTone: Record<Priority, Tone> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Pill tone={priorityTone[priority]} dot>
      {priority[0]!.toUpperCase() + priority.slice(1)}
    </Pill>
  );
}

const opportunityStatusMeta: Record<OpportunityStatus, { label: string; tone: Tone }> = {
  recommended: { label: "Recommended", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  in_progress: { label: "In progress", tone: "primary" },
  recovered: { label: "Recovered", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const meta = opportunityStatusMeta[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

const txStatusMeta: Record<TransactionStatus, { label: string; tone: Tone }> = {
  successful: { label: "Successful", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  pending: { label: "Pending", tone: "warning" },
  recovered: { label: "Recovered", tone: "success" },
  abandoned: { label: "Abandoned", tone: "neutral" },
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const meta = txStatusMeta[status];
  return (
    <Pill tone={meta.tone} dot>
      {meta.label}
    </Pill>
  );
}

const recoveryStatusMeta: Record<RecoveryStatus, { label: string; tone: Tone }> = {
  not_required: { label: "Not required", tone: "neutral" },
  queued: { label: "Queued", tone: "info" },
  in_progress: { label: "In progress", tone: "warning" },
  recovered: { label: "Recovered", tone: "success" },
  unrecoverable: { label: "Unrecoverable", tone: "danger" },
};

export function RecoveryStatusBadge({ status }: { status: RecoveryStatus }) {
  const meta = recoveryStatusMeta[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

const guardrailMeta: Record<GuardrailResult, { label: string; tone: Tone }> = {
  passed: { label: "Guardrail passed", tone: "success" },
  review: { label: "Review required", tone: "warning" },
  blocked: { label: "Blocked", tone: "danger" },
};

export function GuardrailBadge({ result, compact }: { result: GuardrailResult; compact?: boolean }) {
  const meta = guardrailMeta[result];
  return (
    <Pill tone={meta.tone} dot>
      {compact ? meta.label.replace("Guardrail ", "") : meta.label}
    </Pill>
  );
}

export const leakageLabel: Record<LeakageType, string> = {
  failed_payment: "Failed Payment",
  abandoned_checkout: "Abandoned Checkout",
  failed_subscription: "Subscription",
  overdue_invoice: "Invoice",
};

export function TypeBadge({ type }: { type: LeakageType }) {
  return <Pill tone="primary">{leakageLabel[type]}</Pill>;
}

export function ConfidenceMeter({ value }: { value: number }) {
  const tone = value >= 90 ? "bg-success" : value >= 75 ? "bg-info" : "bg-warning";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="num text-xs font-medium text-foreground">{value}%</span>
    </div>
  );
}

export function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}
