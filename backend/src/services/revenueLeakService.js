import { db } from "../prisma/db.ts";

/**
 * Calculate revenue leakage for an authenticated user.
 *
 * Revenue leakage = total value of failed transactions
 * that were not converted into successful revenue.
 */
export async function calculateRevenueLeak(userId) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  // Get all transactions belonging to this user
  const allTransactions = await db.orm.public.Transaction.all();

  const transactions = allTransactions.filter(
    (transaction) =>
      Number(transaction.userId) === Number(userId)
  );

  // Separate successful and failed transactions
  const successfulTransactions = transactions.filter((transaction) => {
    const status = String(transaction.status).toLowerCase();

    return [
      "success",
      "successful",
      "succeeded",
      "completed",
      "captured",
    ].includes(status);
  });

  const failedTransactions = transactions.filter((transaction) => {
    const status = String(transaction.status).toLowerCase();

    return [
      "failed",
      "failure",
    ].includes(status);
  });

  // Calculate successful revenue
  const successfulRevenue = successfulTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  // Calculate money potentially lost
  const leakedRevenue = failedTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  // Revenue that could have existed if failed transactions succeeded
  const potentialRevenue = successfulRevenue + leakedRevenue;

  const leakageRate =
    potentialRevenue > 0
      ? Number(
          ((leakedRevenue / potentialRevenue) * 100).toFixed(2)
        )
      : 0;

  return {
    userId: Number(userId),
    successfulRevenue,
    leakedRevenue,
    potentialRevenue,
    successfulPaymentCount: successfulTransactions.length,
    failedPaymentCount: failedTransactions.length,
    leakageRate,
  };
}