import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Brain,
  CheckCircle2,
  CircleDollarSign,
  GitCompare,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { InfoHint } from "@/components/common/Badges";
import {
  getAnalytics,
  getSimulatorStrategies,
} from "@/services/api";

const analyticsQuery = {
  queryKey: ["recovery-lab-analytics"],
  queryFn: getAnalytics,
};

const strategiesQuery = {
  queryKey: ["recovery-lab-strategies"],
  queryFn: getSimulatorStrategies,
};

export const Route = createFileRoute("/recovery-lab")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(analyticsQuery),
      context.queryClient.ensureQueryData(strategiesQuery),
    ]);
  },
  component: RecoveryLabPage,
});

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function RecoveryLabPage() {
  const { data: analytics } = useSuspenseQuery(analyticsQuery);
  const { data: strategies } = useSuspenseQuery(strategiesQuery);

  const recoveredRevenue =
    analytics.kpis.find((kpi) => kpi.id === "recovered")
      ? Number(
          analytics.kpis
            .find((kpi) => kpi.id === "recovered")
            ?.value.replace(/[₹,%]/g, "") || 0,
        )
      : 0;

  const historicalOpportunity =
    analytics.funnel.find((stage) => stage.id === "recoverable")?.value ?? 0;

  const recommendedStrategy =
    strategies.find((strategy) => strategy.recommended) ??
    strategies[0];

  const modeledNetImpact = strategies.reduce(
    (best, strategy) => {
      const net =
        strategy.expectedRecovery - strategy.interventionCost;

      if (!best || net > best.net) {
        return {
          strategy,
          net,
        };
      }

      return best;
    },
    null as
      | {
          strategy: (typeof strategies)[number];
          net: number;
        }
      | null,
  );

  return (
    <>
      <PageHeader
        title="Recovery Intelligence Lab"
        subtitle="Understand why REVIVE made each recovery decision and quantify its financial impact."
      />

      <div className="space-y-6">

        {/* HERO IMPACT */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ImpactCard
            icon={<CircleDollarSign className="size-5" />}
            label="Historical Opportunity"
            value={formatINR(historicalOpportunity)}
            description="Revenue historically exposed to recovery."
          />

          <ImpactCard
            icon={<TrendingUp className="size-5" />}
            label="Revenue Recovered"
            value={formatINR(recoveredRevenue)}
            description="Confirmed through completed recovery actions."
          />

          <ImpactCard
            icon={<CheckCircle2 className="size-5" />}
            label="Recovery Rate"
            value={
              analytics.kpis.find((kpi) => kpi.id === "rate")?.value ?? "0%"
            }
            description="Recovered revenue vs historical opportunity."
          />

          <ImpactCard
            icon={<Brain className="size-5" />}
            label="AI Decisions"
            value={
              analytics.aiPerformance.find(
                (metric) => metric.id === "transactions",
              )?.value ?? "0"
            }
            description="Transactions evaluated by the recovery engine."
          />
        </div>

        {/* COUNTERFACTUAL */}
        <Panel>
          <PanelHeader
            title="Counterfactual Revenue Impact"
            subtitle="What changed because REVIVE intervened?"
            actions={
              <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                AI Decision Analysis
              </span>
            }
          />

          <PanelBody>
            <div className="grid gap-4 md:grid-cols-3">
              <ImpactStage
                number="01"
                title="Without REVIVE"
                value={formatINR(historicalOpportunity)}
                description="Revenue exposed after payment failures."
              />

              <ImpactStage
                number="02"
                title="REVIVE Intervention"
                value={`${analytics.aiPerformance.find(
                  (metric) => metric.id === "actions",
                )?.value ?? 0} actions`}
                description="Recovery actions executed against eligible opportunities."
                active
              />

              <ImpactStage
                number="03"
                title="Revenue Preserved"
                value={formatINR(recoveredRevenue)}
                description="Revenue confirmed as recovered after intervention."
                success
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-5 text-primary" />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    REVIVE impact
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    REVIVE converted{" "}
                    <span className="font-semibold text-foreground">
                      {formatINR(recoveredRevenue)}
                    </span>{" "}
                    of historical recovery opportunity into confirmed
                    recovered revenue.
                  </p>
                </div>
              </div>
            </div>
          </PanelBody>
        </Panel>

        {/* WHY THIS DECISION */}
        <Panel>
          <PanelHeader
            title="Why REVIVE Chose This Strategy"
            subtitle="Explainable AI decision record based on expected recovery, cost, risk and friction."
          />

          <PanelBody>
            {recommendedStrategy ? (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                      <Brain className="size-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recommended intervention
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-foreground">
                        {recommendedStrategy.strategy}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <DecisionMetric
                      label="Expected Recovery"
                      value={formatINR(
                        recommendedStrategy.expectedRecovery,
                      )}
                    />

                    <DecisionMetric
                      label="Intervention Cost"
                      value={formatINR(
                        recommendedStrategy.interventionCost,
                      )}
                    />

                    <DecisionMetric
                      label="Customer Friction"
                      value={recommendedStrategy.friction}
                    />

                    <DecisionMetric
                      label="Risk"
                      value={recommendedStrategy.risk}
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-primary" />

                      <span className="text-sm font-semibold text-foreground">
                        Decision logic
                      </span>

                      <InfoHint text="REVIVE compares available recovery strategies using expected recovery value, intervention cost, customer friction and risk." />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This strategy was selected because it provides the
                      strongest modeled recovery outcome while maintaining
                      {` `}
                      <span className="font-medium text-foreground">
                        {recommendedStrategy.risk.toLowerCase()} risk
                      </span>{" "}
                      and{" "}
                      <span className="font-medium text-foreground">
                        {recommendedStrategy.friction.toLowerCase()} customer
                        friction
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <GitCompare className="size-4 text-muted-foreground" />

                    <h3 className="text-sm font-semibold text-foreground">
                      Alternatives considered
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {strategies.map((strategy) => {
                      const net =
                        strategy.expectedRecovery -
                        strategy.interventionCost;

                      return (
                        <div
                          key={strategy.id}
                          className={
                            strategy.id === recommendedStrategy.id
                              ? "rounded-xl border border-primary/30 bg-primary/5 p-4"
                              : "rounded-xl border border-border p-4"
                          }
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {strategy.strategy}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {strategy.risk} risk · {strategy.friction}{" "}
                                friction
                              </p>
                            </div>

                            {strategy.recommended ? (
                              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                                Selected
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                            <MiniMetric
                              label="Recovery"
                              value={formatINR(
                                strategy.expectedRecovery,
                              )}
                            />

                            <MiniMetric
                              label="Cost"
                              value={formatINR(
                                strategy.interventionCost,
                              )}
                            />

                            <MiniMetric
                              label="Net"
                              value={formatINR(net)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="No recovery strategies are currently available." />
            )}
          </PanelBody>
        </Panel>

        {/* MODELED OUTCOME */}
        <Panel>
          <PanelHeader
            title="Strategy Economics"
            subtitle="Compare the modeled financial outcome of each available intervention."
          />

          <PanelBody>
            {strategies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-3 py-3 font-medium text-muted-foreground">
                        Strategy
                      </th>

                      <th className="px-3 py-3 font-medium text-muted-foreground">
                        Expected Recovery
                      </th>

                      <th className="px-3 py-3 font-medium text-muted-foreground">
                        Cost
                      </th>

                      <th className="px-3 py-3 font-medium text-muted-foreground">
                        Modeled Net Impact
                      </th>

                      <th className="px-3 py-3 font-medium text-muted-foreground">
                        Risk
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {strategies.map((strategy) => {
                      const net =
                        strategy.expectedRecovery -
                        strategy.interventionCost;

                      return (
                        <tr
                          key={strategy.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              {strategy.recommended ? (
                                <span className="size-2 rounded-full bg-primary" />
                              ) : null}

                              <span className="font-medium text-foreground">
                                {strategy.strategy}
                              </span>
                            </div>
                          </td>

                          <td className="num px-3 py-4 text-foreground">
                            {formatINR(strategy.expectedRecovery)}
                          </td>

                          <td className="num px-3 py-4 text-muted-foreground">
                            {formatINR(strategy.interventionCost)}
                          </td>

                          <td className="num px-3 py-4 font-semibold text-foreground">
                            {formatINR(net)}
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                              {strategy.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No strategy economics available." />
            )}

            {modeledNetImpact ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
                <TrendingUp className="mt-0.5 size-5 text-success" />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Highest modeled net outcome
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {modeledNetImpact.strategy.strategy} produces a modeled
                    net recovery of{" "}
                    <span className="font-semibold text-foreground">
                      {formatINR(modeledNetImpact.net)}
                    </span>{" "}
                    after intervention cost.
                  </p>
                </div>
              </div>
            ) : null}
          </PanelBody>
        </Panel>

        {/* DECISION PIPELINE */}
        <Panel>
          <PanelHeader
            title="Decision Lifecycle"
            subtitle="The auditable path from payment failure to recovered revenue."
          />

          <PanelBody>
            <div className="grid gap-3 md:grid-cols-5">
              <LifecycleStep
                number="01"
                title="Failure Detected"
                description="Transaction signal enters the recovery engine."
              />

              <LifecycleStep
                number="02"
                title="AI Analyzed"
                description="Revenue and transaction signals are evaluated."
              />

              <LifecycleStep
                number="03"
                title="Strategy Selected"
                description="The strongest eligible intervention is identified."
              />

              <LifecycleStep
                number="04"
                title="Guardrails Checked"
                description="Financial and customer-safety rules are applied."
              />

              <LifecycleStep
                number="05"
                title="Revenue Recovered"
                description="Completed recovery actions contribute to confirmed recovery."
                success
              />
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border p-4">
              <ShieldCheck className="size-5 text-success" />

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Built for auditable autonomous recovery
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Every stage connects back to the transaction, recovery
                  strategy, guardrails and completed action records already
                  stored by REVIVE AI.
                </p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}

function ImpactCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="section-label">{label}</span>
      </div>

      <p className="num mt-3 text-2xl font-semibold text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ImpactStage({
  number,
  title,
  value,
  description,
  active,
  success,
}: {
  number: string;
  title: string;
  value: string;
  description: string;
  active?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={
        success
          ? "rounded-2xl border border-success/30 bg-success/5 p-5"
          : active
            ? "rounded-2xl border border-primary/30 bg-primary/5 p-5"
            : "rounded-2xl border border-border p-5"
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {number}
        </span>

        {success ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : active ? (
          <Brain className="size-4 text-primary" />
        ) : null}
      </div>

      <p className="mt-5 text-sm font-semibold text-foreground">
        {title}
      </p>

      <p className="num mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function DecisionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="section-label">{label}</p>
      <p className="num mt-1.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="num mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function LifecycleStep({
  number,
  title,
  description,
  success,
}: {
  number: string;
  title: string;
  description: string;
  success?: boolean;
}) {
  return (
    <div
      className={
        success
          ? "rounded-xl border border-success/30 bg-success/5 p-4"
          : "rounded-xl border border-border p-4"
      }
    >
      <span className="text-xs font-semibold text-muted-foreground">
        {number}
      </span>

      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>

      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}