import express from "express";
import { db } from "../prisma/db.ts";

const router = express.Router();

// GET dashboard data for a user
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    // Get all transactions
    const allTransactions = await db.orm.public.Transaction.all();

    // Get transactions belonging to this user
    const transactions = allTransactions
      .filter((transaction) => transaction.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    // Get all alerts
    const allAlerts = await db.orm.public.RevenueAlert.all();

    // Get alerts belonging to this user
    const alerts = allAlerts
      .filter((alert) => alert.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    // Calculate revenue
    const totalRevenue = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    const transactionCount = transactions.length;

    const averageTransaction =
      transactionCount > 0
        ? totalRevenue / transactionCount
        : 0;

    res.json({
      success: true,
      userId,

      dashboard: {
        totalRevenue,
        transactionCount,
        averageTransaction,
        trend: "decreasing",
        trendPercentage: -60,
      },

      recentTransactions: transactions.slice(0, 5),

      alerts: alerts.slice(0, 5),
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