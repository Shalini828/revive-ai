import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { LeakageChart } from "@/components/charts/LeakageChart";
import { getDashboard, getOpportunities, queryKeys } from "@/services/api";

const dashboardQuery = {
  queryKey: queryKeys.dashboard,
  queryFn: getDashboard,
};

const opportunitiesQuery = {
  queryKey: queryKeys.opportunities,
  queryFn: getOpportunities,
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Revenue Recovery Overview · REVIVE AI" },
      {
        name: "description",
        content:
          "Track revenue at risk, recoverable revenue and recovered revenue across your merchant account.",
      },
    ],
  }),

  component: DashboardPage,
});

function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchDashboard,
  } = useQuery(dashboardQuery);

  const {
    data: opportunities = [],
    isLoading: opportunitiesLoading,
    refetch: refetchOpportunities,
  } = useQuery(opportunitiesQuery);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([refetchDashboard(), refetchOpportunities()]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleExport() {
    if (!data) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      kpis: data.kpis,
      leakageSeries: data.leakageSeries,
      categories: data.categories,
      recommendedActions: data.recommendedActions,
      opportunities: opportunities.slice(0, 10),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `revive-ai-dashboard-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />

          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            Unable to load your dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {error instanceof Error
              ? error.message
              : "The backend did not return dashboard data."}
          </p>

          <button
            onClick={handleRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const topCategories = [...data.categories]
    .sort((a, b) => {
      const aValue = Number(a.recoverable ?? 0);
      const bValue = Number(b.recoverable ?? 0);

      return bValue - aValue;
    })
    .slice(0, 4);

  const topActions = data.recommendedActions?.slice(0, 4) ?? [];

  const topOpportunities = opportunities.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Revenue Recovery Overview"
        subtitle="A real-time view of revenue leakage and recovery opportunities."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            <Link
              to="/agent"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open AI Agent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      {/* KPI ROW */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      {/* MAIN CHART */}
      <Panel className="mt-6">
        <PanelHeader
          title="Revenue Leakage"
          subtitle="Revenue at risk, recoverable value and confirmed recoveries."
          actions={
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Last 30 days
            </span>
          }
        />

        <PanelBody className="pt-2">
          <div className="h-[340px]">
            <LeakageChart data={data.leakageSeries} />
          </div>
        </PanelBody>
      </Panel>

      {/* SECOND ROW */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* TOP OPPORTUNITIES */}
        <Panel>
          <PanelHeader
            title="Top Recovery Opportunities"
            subtitle="Where the largest recoverable revenue is concentrated."
            actions={
              <Link
                to="/opportunities"
                search={{ type: undefined }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <PanelBody className="p-0">
            {opportunitiesLoading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : topOpportunities.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

                <p className="mt-3 text-sm font-medium text-slate-800">
                  No recovery opportunities
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your account currently has no detected opportunities.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topOpportunities.map((opportunity: any) => (
                  <div
                    key={opportunity.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {opportunity.customerName ??
                          opportunity.customer ??
                          opportunity.title ??
                          "Recovery opportunity"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {opportunity.issue ??
                          opportunity.type ??
                          opportunity.category ??
                          "Revenue leakage"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(
                          opportunity.recoverable ??
                            opportunity.recoverableRevenue ??
                            opportunity.amount ??
                            0,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-emerald-600">
                        Recoverable
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelBody>
        </Panel>

        {/* AI AGENT */}
        <Panel>
          <PanelHeader
            title="AI Recovery Agent"
            subtitle="Your automated recovery intelligence."
          />

          <PanelBody>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Agent Active
                    </p>

                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    REVIVE AI continuously analyzes failed transactions and
                    prioritizes the highest-value recovery actions.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">Opportunities</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {opportunities.length}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">AI actions</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {data.recommendedActions?.length ?? 0}
                  </p>
                </div>
              </div>

              <Link
                to="/agent"
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open recovery agent
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </PanelBody>
        </Panel>
      </section>

      {/* RECOVERY SOURCES */}
      <section className="mt-6">
        <Panel>
          <PanelHeader
            title="Recovery Sources"
            subtitle="Revenue leakage grouped by source."
            actions={
              <Link
                to="/opportunities"
                search={{ type: undefined }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Explore opportunities →
              </Link>
            }
          />

          <PanelBody>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topCategories.map((category: any) => {
                const recoverable = Number(
                  category.recoverable ?? category.recoverableRevenue ?? 0,
                );

                const atRisk = Number(
                  category.atRisk ?? category.atRiskRevenue ?? 0,
                );

                const recoveryRate = Number(category.recoveryRate ?? 0);

                return (
                  <div
                    key={category.id ?? category.name}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {category.name ?? category.label ?? "Recovery source"}
                      </p>

                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          At risk
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(atRisk)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Recoverable
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600">
                          {formatCurrency(recoverable)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Recovery rate
                        </span>

                        <span className="font-medium">
                          {Number.isFinite(recoveryRate)
                            ? `${recoveryRate}%`
                            : "—"}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(recoveryRate, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelBody>
        </Panel>
      </section>

      {/* AI ACTIONS */}
      <Panel className="mt-6 mb-8">
        <PanelHeader
          title="Priority AI Actions"
          subtitle="Highest-value interventions currently recommended."
          actions={
            <Link
              to="/agent"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open AI Agent
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <PanelBody className="p-0">
          {topActions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No AI recovery actions available yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topActions.map((action: any, index: number) => (
                <div
                  key={action.id ?? index}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {action.action ??
                        action.title ??
                        action.recommendation ??
                        "Recovery action"}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {action.description ??
                        action.reason ??
                        action.target ??
                        "AI-generated recovery intervention"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    {action.priority ?? "Recommended"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>
    </>
  );
}

function formatCurrency(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-100" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>

      <div className="h-[390px] animate-pulse rounded-xl bg-slate-100" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
