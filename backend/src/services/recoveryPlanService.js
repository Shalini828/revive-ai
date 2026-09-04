import { db } from "../prisma/db.ts";
import { analyzeRevenue } from "./revenueAnalysisService.js";

export async function generateRecoveryPlan(userId) {
  const analysis = await analyzeRevenue(userId);

  const transactions = await db.orm.public.Transaction.where({
    userId: Number(userId),
  }).all();

  const failedTransactions = transactions.filter((transaction) =>
    ["failed", "failure"].includes(String(transaction.status).toLowerCase()),
  );

  const recoverableRevenue = failedTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  // --------------------------------------------------
  // Recovery actions / recommendations
  // --------------------------------------------------

  const actions = [];

  if (analysis.trend === "decreasing") {
    actions.push({
      priority: "high",
      action: "Investigate the revenue decline",
      target: `Revenue decreased by ${Math.abs(
        analysis.trendPercentage,
      )}% compared to the previous period.`,
    });
  }

  if (recoverableRevenue > 0) {
    actions.push({
      priority: "high",
      action: "Recover failed payments",
      target: `₹${recoverableRevenue.toLocaleString(
        "en-IN",
      )} is currently at risk from failed payments.`,
    });
  }

  if (analysis.averageTransaction > 0) {
    actions.push({
      priority: "medium",
      action: "Increase average transaction value",
      target: `Current average transaction is ₹${analysis.averageTransaction.toLocaleString(
        "en-IN",
      )}.`,
    });
  }

  if (analysis.transactionCount < 5) {
    actions.push({
      priority: "medium",
      action: "Increase transaction frequency",
      target: "Generate more sales transactions to stabilize revenue.",
    });
  }

  if (analysis.healthScore !== null && analysis.healthScore <= 40) {
    actions.push({
      priority: "high",
      action: "Create an immediate recovery plan",
      target: "Focus on restoring revenue before expanding expenses.",
    });
  }

  // --------------------------------------------------
  // Recovery strategies based on real failed payments
  // --------------------------------------------------

  const strategies = [];

  if (recoverableRevenue > 0) {
    const retryRecovery = Math.round(recoverableRevenue * 0.75);

    const paymentLinkRecovery = Math.round(recoverableRevenue * 0.9);

    const alternativeRecovery = Math.round(recoverableRevenue * 0.65);

    strategies.push(
      {
        id: "retry_failed_payment",
        transactionId: failedTransactions[0]?.id ?? null,
        strategy: "Retry Failed Payment",
        expectedRecovery: retryRecovery,
        interventionCost: Math.round(recoverableRevenue * 0.01),
        friction: "Low",
        risk: "Low",
        recommended: false,
      },
      {
        id: "payment_link_reminder",
        transactionId: failedTransactions[0]?.id ?? null,
        strategy: "Payment Link + Reminder",
        expectedRecovery: paymentLinkRecovery,
        interventionCost: Math.round(recoverableRevenue * 0.02),
        friction: "Low",
        risk: "Low",
        recommended: false,
      },
      {
        id: "alternative_payment",
        transactionId: failedTransactions[0]?.id ?? null,
        strategy: "Alternative Payment Method",
        expectedRecovery: alternativeRecovery,
        interventionCost: Math.round(recoverableRevenue * 0.015),
        friction: "Medium",
        risk: "Medium",
        recommended: false,
      },
    );

    // Select strategy with the highest net recovery.
    let bestStrategy = strategies[0];

    for (const strategy of strategies) {
      const currentNet = strategy.expectedRecovery - strategy.interventionCost;

      const bestNet =
        bestStrategy.expectedRecovery - bestStrategy.interventionCost;

      if (currentNet > bestNet) {
        bestStrategy = strategy;
      }
    }

    bestStrategy.recommended = true;
  }

  // --------------------------------------------------
  // Real recovery-action state
  // --------------------------------------------------

  const recoveryActions = await db.orm.public.RecoveryAction.where({
    userId: Number(userId),
  }).all();

  const completedActions = recoveryActions.filter(
    (action) => String(action.status).toLowerCase() === "completed",
  );

  const pendingActions = recoveryActions.filter((action) =>
    ["pending", "in_progress"].includes(String(action.status).toLowerCase()),
  );

  // --------------------------------------------------
  // Recovery pipeline
  // --------------------------------------------------
  
  const pipeline = [
    {
      id: "detected",
      label: "Opportunity Detected",
      description:
        "Failed payment opportunities identified from transaction data.",
      throughput: `${failedTransactions.length} detected`,
    },
    {
      id: "analyzed",
      label: "AI Analysis",
      description:
        "Revenue and transaction signals analyzed for recovery potential.",
      throughput: `${transactions.length} analyzed`,
    },
    {
      id: "recommended",
      label: "Recovery Recommended",
      description:
        "Eligible failed-payment opportunities routed toward recovery.",
      throughput: `${failedTransactions.length} eligible`,
    },
    {
      id: "executed",
      label: "Recovery Executed",
      description: "Recovery actions completed successfully.",
      throughput: `${completedActions.length} completed`,
    },
  ];

  // --------------------------------------------------
  // Financial guardrails
  // --------------------------------------------------

  const guardrails = [
    {
      id: "maximum_discount",
      label: "Maximum recovery discount",
      value: "10%",
      description:
        "Recovery actions cannot apply more than a 10% customer discount.",
      status: "enforced",
    },
    {
      id: "maximum_contacts",
      label: "Maximum customer contacts",
      value: "2 contacts",
      description:
        "The recovery agent limits outreach to a maximum of two customer contacts.",
      status: "enforced",
    },
    {
      id: "high_value_review",
      label: "High-value transaction review",
      value: "₹10,000+",
      description:
        "High-value recovery opportunities require additional review before execution.",
      status: "active",
    },
    {
      id: "recovery_eligibility",
      label: "Recovery eligibility",
      value: "Failed payments only",
      description:
        "Only failed transactions that have not already been recovered are eligible for recovery actions.",
      status: "enforced",
    },
  ];

  // --------------------------------------------------
  // Return complete recovery plan
  // --------------------------------------------------

  return {
    healthScore: analysis.healthScore,
    healthStatus: analysis.healthStatus,
    trend: analysis.trend,
    trendPercentage: analysis.trendPercentage,
    transactionCount: analysis.transactionCount,

    recoverableRevenue,

    strategies,

    actions,

    pipeline,

    guardrails,

    recoveryStats: {
      totalActions: recoveryActions.length,
      pendingActions: pendingActions.length,
      completedActions: completedActions.length,
    },
  };
}
