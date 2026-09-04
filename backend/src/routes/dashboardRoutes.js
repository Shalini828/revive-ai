import express from "express";
import { db } from "../prisma/db.ts";
import { analyzeRevenue } from "../services/revenueAnalysisService.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const SUCCESS_STATUSES = [
  "success",
  "successful",
  "succeeded",
  "completed",
  "captured",
];

const FAILED_STATUSES = ["failed", "failure"];

const COMPLETED_ACTION_STATUSES = [
  "completed",
  "executed",
  "recovered",
];

function getExpectedRecovery(action) {
  const target = String(action?.target ?? "");

  const match = target.match(/Expected recovery ₹([\d,]+)/i);

  if (!match) return 0;

  return Number((match[1] ?? "0").replace(/,/g, "")) || 0;
}

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this dashboard",
      });
    }

    const [allTransactions, allAlerts, allRecoveryActions] =
      await Promise.all([
        db.orm.public.Transaction.all(),
        db.orm.public.RevenueAlert.all(),
        db.orm.public.RecoveryAction.all(),
      ]);

    const transactions = allTransactions
      .filter((transaction) => Number(transaction.userId) === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );

    const alerts = allAlerts
      .filter((alert) => Number(alert.userId) === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );

    const recoveryActions = allRecoveryActions.filter(
      (action) => Number(action.userId) === userId,
    );

    const failedTransactions = transactions.filter((transaction) =>
      FAILED_STATUSES.includes(
        String(transaction.status).toLowerCase(),
      ),
    );

    const successfulTransactions = transactions.filter((transaction) =>
      SUCCESS_STATUSES.includes(
        String(transaction.status).toLowerCase(),
      ),
    );

    const completedActions = recoveryActions.filter((action) =>
      COMPLETED_ACTION_STATUSES.includes(
        String(action.status).toLowerCase(),
      ),
    );

    const pendingActions = recoveryActions.filter((action) =>
      ["pending", "in_progress"].includes(
        String(action.status).toLowerCase(),
      ),
    );

    const totalRevenue = successfulTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const recoverableRevenue = failedTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const recoveredRevenue = completedActions.reduce(
      (sum, action) => sum + getExpectedRecovery(action),
      0,
    );

    const historicalRecoveryOpportunity =
      recoverableRevenue + recoveredRevenue;

    const recoveryRate =
      historicalRecoveryOpportunity > 0
        ? (recoveredRevenue / historicalRecoveryOpportunity) * 100
        : 0;

    const transactionCount = transactions.length;

    const averageTransaction =
      transactionCount > 0
        ? transactions.reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0,
          ) / transactionCount
        : 0;

    const analysis = await analyzeRevenue(userId);

    res.json({
      success: true,
      userId,

      dashboard: {
        totalRevenue,
        transactionCount,
        averageTransaction,

        revenueAtRisk: recoverableRevenue,
        recoverableRevenue,
        recoveredRevenue,
        historicalRecoveryOpportunity,
        recoveryRate: Number(recoveryRate.toFixed(2)),

        failedTransactions: failedTransactions.length,
        successfulTransactions: successfulTransactions.length,
        completedRecoveryActions: completedActions.length,
        pendingRecoveryActions: pendingActions.length,

        trend: analysis.trend,
        trendPercentage: analysis.trendPercentage,
        healthScore: analysis.healthScore,
        healthStatus: analysis.healthStatus,
      },

      recentTransactions: transactions.slice(0, 5),
      alerts: alerts.slice(0, 5),
      recoveryActions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

export default router;