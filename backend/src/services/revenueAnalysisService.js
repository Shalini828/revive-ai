import { db } from "../prisma/db.ts";

export async function analyzeRevenue(userId) {
  const transactions = await db.orm.public.Transaction.where({
    userId: Number(userId),
  }).all();

  if (transactions.length === 0) {
    return {
      totalRevenue: 0,
      transactionCount: 0,
      averageTransaction: 0,
      trend: "no_data",
      trendPercentage: 0,
    };
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );

  const totalRevenue = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const averageTransaction = totalRevenue / transactions.length;

  // Split transactions into two periods
  const midpoint = Math.floor(sortedTransactions.length / 2);

  const previousTransactions = sortedTransactions.slice(0, midpoint);
  const recentTransactions = sortedTransactions.slice(midpoint);

  const previousRevenue = previousTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  const recentRevenue = recentTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  let trend = "stable";
  let trendPercentage = 0;

  if (previousRevenue > 0) {
    trendPercentage =
      ((recentRevenue - previousRevenue) / previousRevenue) * 100;

    if (trendPercentage > 10) {
      trend = "increasing";
    } else if (trendPercentage < -10) {
      trend = "decreasing";
    }
  }

  return {
    totalRevenue,
    transactionCount: transactions.length,
    averageTransaction,
    trend,
    trendPercentage: Number(trendPercentage.toFixed(2)),
  }; 
}

export async function generateRevenueAlert(userId) {
  const analysis = await analyzeRevenue(userId);

  // No alert if there is not enough data
  if (analysis.transactionCount < 2) {
    return {
      alertCreated: false,
      reason: "Not enough transactions to detect a trend",
    };
  }

  // Create an alert when revenue drops by more than 10%
  if (analysis.trend === "decreasing") {
    const alert = await db.orm.public.RevenueAlert.create({
      userId: Number(userId),
      title: "Revenue Drop Detected",
      message: `Revenue has decreased by ${Math.abs(
        analysis.trendPercentage
      )}% compared to the previous period.`,
      severity:
        analysis.trendPercentage <= -25 ? "high" : "medium",
      type: "revenue_drop",
      isRead: false,
    });

    return {
      alertCreated: true,
      alert,
    };
  }

  return {
    alertCreated: false,
    reason: "No significant revenue drop detected",
  };
}