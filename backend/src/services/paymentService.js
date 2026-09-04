import { db } from "../prisma/db.ts";

function validatePaymentInput({ amount }) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be a valid positive number");
  }

  return numericAmount;
}

// Create a payment record
export async function createMockPayment({
  userId,
  amount,
  currency = "INR",
}) {
  const numericAmount = validatePaymentInput({ amount });

  if (!userId) {
    throw new Error("Valid userId is required");
  }

  // Generate payment ID on the backend
  const paymentId = `mock_pay_${Date.now()}`;

  const payment = await db.orm.public.Payment.create({
    userId: Number(userId),
    paymentId,
    amount: numericAmount,
    currency,
    status: "created",
    gateway: "mock",
  });

  return payment;
}

// Process a mock payment
export async function processMockPayment({
  userId,
  amount,
  currency = "INR",
  status = "success",
}) {
  const numericAmount = validatePaymentInput({ amount });

  if (!userId) {
    throw new Error("Valid userId is required");
  }

  const normalizedStatus = String(status).toLowerCase();

  if (!["success", "failed"].includes(normalizedStatus)) {
    throw new Error("Payment status must be either success or failed");
  }

  // Backend generates the payment ID.
  // Client does NOT need to send paymentId.
  const paymentId = `mock_pay_${Date.now()}`;

  // 1. Always save the payment attempt
  const payment = await db.orm.public.Payment.create({
    userId: Number(userId),
    paymentId,
    amount: numericAmount,
    currency,
    status: normalizedStatus,
    gateway: "mock",
  });

  // 2. SUCCESS PAYMENT
  if (normalizedStatus === "success") {
    const transaction = await db.orm.public.Transaction.create({
      userId: Number(userId),
      amount: numericAmount,
      currency,
      category: "Payment",
      description: "Revenue from successful payment",
      status: "completed",
    });

    return {
      payment,
      transaction,
      revenueCreated: true,
      message: "Payment successful and revenue recorded",
    };
  }

  // 3. FAILED PAYMENT
  // Failed payments are NOT counted as revenue.
  const alert = await db.orm.public.RevenueAlert.create({
    userId: Number(userId),
    title: "Payment Failed",
    message: `A payment of ${numericAmount} ${currency} failed and was not counted as revenue.`,
    severity: "medium",
    type: "payment_failed",
    isRead: false,
  });

  return {
    payment,
    transaction: null,
    revenueCreated: false,
    alert,
    message: "Payment failed and was not recorded as revenue",
  };
}

// Get payments belonging to authenticated user
export async function getUserPayments(userId) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  return await db.orm.public.Payment
    .where({ userId: Number(userId) })
    .all();
}