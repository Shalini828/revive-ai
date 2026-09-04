import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Check,
  CircleCheck,
  Eye,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import {
  ConfidenceMeter,
  GuardrailBadge,
  InfoHint,
  Pill,
  TypeBadge,
} from "@/components/common/Badges";
import { compactINR, formatDateTime, formatINR } from "@/lib/format";
import {
  executeRecovery,
  queryKeys,
  updateRecoveryActionStatus,
} from "@/services/api";
import { cn } from "@/lib/utils";
import type {
  AgentStats,
  Guardrail,
  Opportunity,
  PipelineStage,
  SimulatorStrategy,
} from "@/types";
import { createRecoveryAction } from "@/services/api";

export function AgentStatusCard({
  stats,
  active,
  onToggle,
}: {
  stats: AgentStats;
  active: boolean;
  onToggle: () => void;
}) {
  const items = [
    {
      label: "Opportunities analyzed",
      value: stats.analyzed.toLocaleString("en-IN"),
    },
    {
      label: "Interventions",
      value: stats.interventions.toLocaleString("en-IN"),
    },
    {
      label: "Successful recoveries",
      value: stats.recoveries.toLocaleString("en-IN"),
    },
    { label: "Revenue recovered", value: formatINR(stats.recoveredAmount) },
  ];

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                REVIVE Agent
              </h2>
              <Pill tone={active ? "success" : "neutral"} dot>
                {active ? "Active" : "Paused"}
              </Pill>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              recovery-agent v4.2 · uptime {stats.uptime} · last decision{" "}
              {formatDateTime(stats.lastDecisionAt)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "border border-border text-foreground hover:bg-muted"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          <Activity className="size-4" />
          {active ? "Pause agent" : "Activate agent"}
        </button>
      </div>
      <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
        {items.map((i) => (
          <div key={i.label} className="px-5 py-4">
            <p className="section-label">{i.label}</p>
            <p className="num mt-2 text-xl font-semibold text-foreground">
              {i.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Today</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RecoveryStrategyPipeline({
  stages,
}: {
  stages: PipelineStage[];
}) {
  console.log("PIPELINE STAGES:", stages);
  const [activeStage, setActiveStage] = useState(stages[0]?.id ?? "");
  const current = stages.find((s) => s.id === activeStage) ?? stages[0];

  return (
    <Panel>
      <PanelHeader
        title="Recovery Strategy"
        subtitle="Every opportunity travels through the same auditable decision pipeline."
      />
      <PanelBody>
        <div className="flex flex-wrap items-center gap-1.5">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStage(s.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  activeStage === s.id
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.label}
              </button>
              {i < stages.length - 1 ? (
                <ArrowRight className="size-3.5 text-muted-foreground" />
              ) : null}
            </div>
          ))}
        </div>
        {current ? (
          <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {current.label}
              </p>
              <span className="num text-xs text-muted-foreground">
                {current.throughput}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

export function RecoveryQueue({
  queue,
  onReview,
}: {
  queue: Opportunity[];
  onReview: (o: Opportunity) => void;
}) {
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  return (
    <Panel>
      <PanelHeader
        title="Current Recovery Queue"
        subtitle="Live decisions awaiting execution or approval."
        actions={<Pill tone="info">{queue.length} in queue</Pill>}
      />
      <PanelBody className="space-y-4">
        {queue.map((o) => (
          <article
            key={o.id}
            className="rounded-xl border border-border p-4 md:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-sm font-semibold text-foreground">
                    {o.transactionId}
                  </span>
                  <TypeBadge type={o.type} />
                  <GuardrailBadge result={o.guardrail} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.customer} · {o.reason}
                </p>
              </div>
              <div className="text-right">
                <div className="num text-lg font-semibold text-foreground">
                  {formatINR(o.amount)}
                </div>
                <div className="num text-xs text-success">
                  expected {formatINR(o.expectedRecovery)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg bg-surface-muted p-3">
                <p className="section-label">AI Diagnosis</p>
                <p className="mt-1.5 text-sm text-foreground">{o.diagnosis}</p>
              </div>
              <div className="rounded-lg border border-info/25 bg-info-soft p-3">
                <p className="section-label text-info">Recommended action</p>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {o.recommendation}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.guardrailNote}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Confidence
                </span>
                <ConfidenceMeter value={o.confidence} />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onReview(o)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Eye className="size-3.5" /> Review
                </button>
                <button
                  type="button"
                  disabled={
                    approved[o.id] ||
                    approving[o.id] ||
                    o.guardrail === "blocked"
                  }
                  onClick={async () => {
                    if (approved[o.id] || approving[o.id]) return;

                    try {
                      setApproving((p) => ({ ...p, [o.id]: true }));

                      await updateRecoveryActionStatus({
                        actionId: Number(o.id),
                        status: "completed",
                      });

                      setApproved((p) => ({ ...p, [o.id]: true }));

                      toast.success(`Approved · ${o.transactionId}`, {
                        description: "Recovery action marked as completed.",
                      });
                    } catch (error: any) {
                      toast.error("Approval failed", {
                        description:
                          error?.message ||
                          "Could not update the recovery action.",
                      });
                    } finally {
                      setApproving((p) => ({ ...p, [o.id]: false }));
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Check className="size-3.5" />{" "}
                  {approving[o.id]
                    ? "Approving..."
                    : approved[o.id]
                      ? "Approved"
                      : "Approve"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </PanelBody>
    </Panel>
  );
}

export function RecoverySimulator({
  strategies,
}: {
  strategies: SimulatorStrategy[];
}) {
  const [selected, setSelected] = useState<string>(
    strategies.find((s) => s.recommended)?.id ?? strategies[0]?.id ?? "",
  );
  const active = strategies.find((s) => s.id === selected);

  const queryClient = useQueryClient();
  const [applying, setApplying] = useState(false);
  const max = Math.max(...strategies.map((s) => s.expectedRecovery));

  const frictionTone = (v: string) =>
    v === "Low" ? "success" : v === "Medium" ? "warning" : "danger";

  return (
    <Panel>
      <PanelHeader
        title="Recovery Strategy Simulator"
        subtitle="If we intervene differently, what could we recover?"
        actions={
          <InfoHint text="Expected recovery is modelled on the last 90 days of comparable opportunities, net of guardrail suppressions." />
        }
      />
      <PanelBody className="space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                <th className="py-2.5 pr-4">Strategy</th>
                <th className="px-4 py-2.5">Expected Recovery</th>
                <th className="px-4 py-2.5">Intervention Cost</th>
                <th className="px-4 py-2.5">Customer Friction</th>
                <th className="px-4 py-2.5">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {strategies.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-surface-muted",
                    selected === s.id && "bg-surface-muted",
                  )}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {s.strategy}
                      </span>
                      {s.recommended ? (
                        <Pill tone="success">AI pick</Pill>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            s.recommended ? "bg-success" : "bg-info",
                          )}
                          style={{
                            width: `${(s.expectedRecovery / max) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="num font-semibold text-foreground">
                        {s.expectedRecoveryLabel}
                      </span>
                    </div>
                  </td>
                  <td className="num px-4 py-3 text-muted-foreground">
                    {s.interventionCostLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={frictionTone(s.friction)}>{s.friction}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={frictionTone(s.risk)}>{s.risk}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {active ? (
          <div className="rounded-xl border border-success/25 bg-success-soft p-4">
            <div className="flex items-start gap-3">
              <CircleCheck className="mt-0.5 size-5 text-success" />

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Recommended strategy: {active.strategy}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="section-label">Expected recovery</p>
                    <p className="num mt-1 text-lg font-semibold text-foreground">
                      {active.expectedRecoveryLabel}
                    </p>
                  </div>

                  <div>
                    <p className="section-label">Confidence</p>
                    <p className="num mt-1 text-lg font-semibold text-foreground">
                      {Math.round(
                        (active.expectedRecovery /
                          Math.max(
                            ...strategies.map((s) => s.expectedRecovery),
                          )) *
                          100,
                      )}
                      %
                    </p>
                  </div>

                  <div>
                    <p className="section-label">Net of cost</p>
                    <p className="num mt-1 text-lg font-semibold text-foreground">
                      {formatINR(
                        Math.max(
                          0,
                          active.expectedRecovery - active.interventionCost,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  Reason: highest expected recovery with{" "}
                  {active.friction.toLowerCase()} customer friction and{" "}
                  {active.risk.toLowerCase()} risk.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {active ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm">
            <Gauge className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Simulating</span>
            <span className="font-medium text-foreground">
              {active.strategy}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="num text-foreground">
              {active.expectedRecoveryLabel} recovered
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="num text-foreground">
              {active.interventionCostLabel} cost
            </span>
            <button
              type="button"
              disabled={applying}
              onClick={async () => {
                if (!active || applying) return;

                try {
                  setApplying(true);

                  await createRecoveryAction({
                    priority:
                      active.risk === "Low"
                        ? "medium"
                        : active.risk === "Medium"
                          ? "high"
                          : "critical",

                    action: active.strategy,
                    target: `Transaction ${active.transactionId} · Expected recovery ₹${active.expectedRecovery}. Intervention cost ₹${active.interventionCost}.`,
                  });

                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.recoveryQueue,
                    }),
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.agentStatus,
                    }),
                  ]);

                  toast.success(`Strategy applied: ${active.strategy}`, {
                    description:
                      "Recovery action has been added to the live recovery queue.",
                  });
                } catch (error: any) {
                  toast.error("Failed to apply strategy", {
                    description:
                      error?.message || "Could not create the recovery action.",
                  });
                } finally {
                  setApplying(false);
                }
              }}
              className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? "Applying..." : "Apply strategy"}
            </button>
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

export function GuardrailsCard({ guardrails }: { guardrails: Guardrail[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Recovery Guardrails"
        subtitle="Financial safety limits enforced before any action is executed."
        actions={
          <Pill tone="success" dot>
            {guardrails.every((g) => g.status === "enforced")
              ? "All enforced"
              : `${guardrails.filter((g) => g.status === "enforced").length}/${guardrails.length} enforced`}
          </Pill>
        }
      />
      <PanelBody className="grid gap-3 md:grid-cols-2">
        {guardrails.map((g) => (
          <div key={g.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {g.status === "monitoring" ? (
                  <ShieldAlert className="mt-0.5 size-4 text-warning" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 text-success" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {g.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.description}
                  </p>
                </div>
              </div>
              <span className="num shrink-0 text-sm font-semibold text-foreground">
                {g.value}
              </span>
            </div>
            <div className="mt-3">
              <Pill
                tone={g.status === "monitoring" ? "warning" : "success"}
                dot
              >
                {g.status === "monitoring"
                  ? "Monitoring"
                  : g.status === "active"
                    ? "Active"
                    : "Enforced"}
              </Pill>
            </div>
          </div>
        ))}
      </PanelBody>
    </Panel>
  );
}
