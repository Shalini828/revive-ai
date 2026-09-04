import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { InfoHint } from "@/components/common/Badges";
import {
  RateByFailureTypeChart,
  RecoveryByInterventionChart,
  RecoveryBySegmentChart,
  RecoveryTrendChart,
} from "@/components/charts/AnalyticsCharts";
import { getAnalytics, queryKeys } from "@/services/api";

const analyticsQuery = { queryKey: queryKeys.analytics, queryFn: getAnalytics };

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Recovery Analytics · REVIVE AI" },
      {
        name: "description",
        content:
          "Recovery rate by failure type, intervention performance, customer segments and the full revenue recovery funnel.",
      },
      { property: "og:title", content: "Recovery Analytics · REVIVE AI" },
      {
        property: "og:description",
        content:
          "Measured outcomes across every intervention the recovery agent runs.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(analyticsQuery);
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useSuspenseQuery(analyticsQuery);
  const maxFunnel = data.funnel[0]?.value ?? 1;

  return (
    <>
      <PageHeader
        title="Recovery Analytics"
        subtitle="Measured outcomes across every intervention the agent runs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Revenue Recovery Trend"
            subtitle="Recoverable vs recovered revenue, last 6 months."
          />
          <PanelBody>
            <RecoveryTrendChart data={data.trend} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recovery Rate by Failure Type"
            subtitle="Where the agent performs best — and where it does not."
          />
          <PanelBody>
            <RateByFailureTypeChart data={data.byFailureType} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recovery by Intervention"
            subtitle="Revenue recovered per intervention channel."
          />
          <PanelBody>
            <RecoveryByInterventionChart data={data.byIntervention} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Revenue Recovered by Customer Segment"
            subtitle="Which cohorts contribute the recovered revenue."
          />
          <PanelBody>
            <RecoveryBySegmentChart data={data.bySegment} />
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Panel>
          <PanelHeader
            title="Recovery Funnel"
            subtitle="From detected leakage to settled revenue."
          />
          <PanelBody className="space-y-3">
            {data.funnel.map((stage, i) => {
              const width = (stage.value / maxFunnel) * 100;
              const prev = data.funnel[i - 1];
              const conversion =
                prev && prev.value > 0
                  ? (stage.value / prev.value) * 100
                  : null;
              return (
                <div key={stage.id}>
                  {i > 0 ? (
                    <div className="mb-2 flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                      <ArrowDown className="size-3.5" />
                      {conversion !== null
                        ? `${conversion.toFixed(1)}% conversion`
                        : "Not applicable"}
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {stage.label}
                      </span>
                      <span className="num font-semibold text-foreground">
                        {stage.valueLabel}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={
                          i === data.funnel.length - 1
                            ? "h-full rounded-full bg-success"
                            : "h-full rounded-full bg-info"
                        }
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="AI Performance"
            subtitle="How reliable the agent's judgement has been."
          />
          <PanelBody className="grid gap-4 sm:grid-cols-2">
            {data.aiPerformance.map((m) => (
              <div key={m.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5">
                  <span className="section-label">{m.label}</span>
                  <InfoHint text={m.tooltip} />
                </div>
                <p className="num mt-2 text-2xl font-semibold text-foreground">
                  {m.value}
                </p>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
