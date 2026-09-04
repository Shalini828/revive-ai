import type { DashboardData, LeakagePoint } from "@/types";

function buildSeries(): LeakagePoint[] {
  const base = [
    52000, 48500, 61000, 57500, 63200, 71000, 68400, 59800, 64300, 72500, 78200, 69900, 66100, 74800,
    81300, 76400, 70200, 68800, 75600, 82400, 79100, 73500, 71800, 84200, 88600, 81700, 77300, 85900,
    91200, 86500,
  ];
  const start = new Date("2026-07-30T00:00:00+05:30").getTime();
  return base.map((atRisk, i) => {
    const recoverable = Math.round(atRisk * (0.6 + ((i % 5) * 0.012)));
    const recovered = Math.round(recoverable * (0.58 + ((i % 7) * 0.014)));
    return {
      date: new Date(start + i * 86400000).toISOString(),
      atRisk,
      recoverable,
      recovered,
    };
  });
}

export const mockDashboard: DashboardData = {
  kpis: [
    {
      id: "at_risk",
      label: "Revenue at Risk",
      value: "₹18,42,600",
      sublabel: "Across 2,840 detected opportunities",
      trend: { direction: "up", value: "+12.4%", label: "this month" },
      tone: "risk",
      tooltip:
        "Total value of payments, checkouts, subscriptions and invoices that failed to convert in the selected period.",
    },
    {
      id: "recoverable",
      label: "Recoverable Revenue",
      value: "₹11,76,200",
      sublabel: "63.8% of revenue at risk",
      trend: { direction: "up", value: "+9.1%", label: "this month" },
      tone: "recoverable",
      tooltip:
        "Portion of revenue at risk that REVIVE AI estimates can be recovered given customer history, failure type and guardrails.",
    },
    {
      id: "recovered",
      label: "Revenue Recovered",
      value: "₹7,82,400",
      sublabel: "1,267 successful recoveries",
      trend: { direction: "up", value: "+18.6%", label: "this month" },
      tone: "recovered",
      tooltip: "Revenue confirmed settled after a REVIVE AI intervention.",
    },
    {
      id: "rate",
      label: "Recovery Rate",
      value: "66.5%",
      sublabel: "Recovered ÷ recoverable revenue",
      trend: { direction: "up", value: "+8.2%", label: "vs previous period" },
      tone: "rate",
      tooltip: "Share of recoverable revenue actually recovered. The primary efficiency metric for the agent.",
    },
  ],
  leakageSeries: buildSeries(),
  categories: [
    {
      id: "failed_payment",
      label: "Failed Payments",
      count: 1284,
      atRisk: 742800,
      recoverable: 512500,
      recoveryRate: 71.2,
    },
    {
      id: "abandoned_checkout",
      label: "Abandoned Checkouts",
      count: 906,
      atRisk: 586400,
      recoverable: 358900,
      recoveryRate: 58.4,
    },
    {
      id: "failed_subscription",
      label: "Failed Subscriptions",
      count: 418,
      atRisk: 268900,
      recoverable: 191300,
      recoveryRate: 74.9,
    },
    {
      id: "overdue_invoice",
      label: "Overdue Invoices",
      count: 232,
      atRisk: 244500,
      recoverable: 113500,
      recoveryRate: 52.1,
    },
  ],
  recommendedActions: [
    {
      id: "opp_1001",
      customer: "Rahul Sharma",
      amount: 4999,
      issue: "Bank timeout",
      recommendation: "Retry after 30 min",
      confidence: 94,
      expectedRecovery: 4999,
      status: "recommended",
    },
    {
      id: "opp_1002",
      customer: "Ananya Mehta",
      amount: 18000,
      issue: "Insufficient funds",
      recommendation: "Send payment link",
      confidence: 91,
      expectedRecovery: 16200,
      status: "recommended",
    },
    {
      id: "opp_1003",
      customer: "Arjun Singh",
      amount: 45000,
      issue: "Checkout abandoned",
      recommendation: "Payment link + reminder",
      confidence: 88,
      expectedRecovery: 40500,
      status: "pending",
    },
    {
      id: "opp_1009",
      customer: "Meera Joshi",
      amount: 62000,
      issue: "3DS abandoned",
      recommendation: "Secure link (approval)",
      confidence: 81,
      expectedRecovery: 42780,
      status: "pending",
    },
    {
      id: "opp_1006",
      customer: "Vikram Desai",
      amount: 7499,
      issue: "Card expired",
      recommendation: "Card update request",
      confidence: 84,
      expectedRecovery: 5699,
      status: "recommended",
    },
  ],
};
