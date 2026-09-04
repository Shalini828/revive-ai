import crypto from "crypto";
import { db } from "../prisma/db.ts";

export function verifyRazorpayWebhookSignature(
  rawBody,
  signature,
  secret
) {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Prevent timingSafeEqual from throwing
  // when signatures have different lengths.
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf8"),
    Buffer.from(signature, "utf8")
  );
}

export async function processPaymentEvent({
  event,
  paymentId,
  userId,
  amount,
  currency = "INR",
}) {
  if (!event) {
    throw new Error("Payment event is required");
  }

  if (!paymentId) {
    throw new Error("Payment ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Valid payment amount is required");
  }

  // --------------------------------------------------
  // PAYMENT CREATED
  // --------------------------------------------------

  if (event === "payment.created") {
    const existingPayment =
      await db.orm.public.Payment
        .where({ paymentId })
        .first();

    if (existingPayment) {
      return {
        event,
        status: "already_exists",
        payment: existingPayment,
      };
    }

    const payment = await db.orm.public.Payment.create({
      userId: Number(userId),
      paymentId,
      amount: numericAmount,
      currency,
      status: "created",
      gateway: "razorpay",
    });

    return {
      event,
      status: "created",
      payment,
    };
  }

  // --------------------------------------------------
  // PAYMENT SUCCESS
  // --------------------------------------------------

  if (
    event === "payment.success" ||
    event === "payment.captured"
  ) {
    let payment =
      await db.orm.public.Payment
        .where({ paymentId })
        .first();

    if (!payment) {
      payment = await db.orm.public.Payment.create({
        userId: Number(userId),
        paymentId,
        amount: numericAmount,
        currency,
        status: "success",
        gateway: "razorpay",
      });
    } else if (payment.status !== "success") {
      payment =
        await db.orm.public.Payment
          .where({ id: payment.id })
          .update({
            status: "success",
          });
    }

    // Prevent duplicate revenue transactions
    const existingTransactions =
      await db.orm.public.Transaction
        .where({
          userId: Number(userId),
        })
        .all();

    const alreadyRecorded = existingTransactions.some(
      (transaction) =>
        transaction.description ===
        `Revenue from payment ${paymentId}`
    );

    if (!alreadyRecorded) {
      await db.orm.public.Transaction.create({
        userId: Number(userId),
        amount: numericAmount,
        currency,
        category: "Payment",
        description: `Revenue from payment ${paymentId}`,
        status: "completed",
      });
    }

    return {
      event,
      status: "success",
      revenueCreated: !alreadyRecorded,
      payment,
    };
  }

  // --------------------------------------------------
  // PAYMENT FAILED
  // --------------------------------------------------

  if (event === "payment.failed") {
    let payment =
      await db.orm.public.Payment
        .where({ paymentId })
        .first();

    if (!payment) {
      payment = await db.orm.public.Payment.create({
        userId: Number(userId),
        paymentId,
        amount: numericAmount,
        currency,
        status: "failed",
        gateway: "razorpay",
      });
    } else {
      payment =
        await db.orm.public.Payment
          .where({ id: payment.id })
          .update({
            status: "failed",
          });
    }

    await db.orm.public.RevenueAlert.create({
      userId: Number(userId),
      title: "Payment Failed",
      message: `Razorpay payment of ${numericAmount} ${currency} failed and was not counted as revenue.`,
      severity: "medium",
      type: "payment_failed",
      isRead: false,
    });

    return {
      event,
      status: "failed",
      revenueCreated: false,
      payment,
    };
  }

  // --------------------------------------------------
  // PAYMENT REFUNDED
  // --------------------------------------------------

  if (event === "payment.refunded") {
    const payment =
      await db.orm.public.Payment
        .where({ paymentId })
        .first();

    if (!payment) {
      throw new Error("Payment not found");
    }

    const updatedPayment =
      await db.orm.public.Payment
        .where({ id: payment.id })
        .update({
          status: "refunded",
        });

    await db.orm.public.RevenueAlert.create({
      userId: Number(userId),
      title: "Payment Refunded",
      message: `Payment of ${numericAmount} ${currency} was refunded.`,
      severity: "medium",
      type: "payment_refunded",
      isRead: false,
    });

    return {
      event,
      status: "refunded",
      revenueCreated: false,
      payment: updatedPayment,
    };
  }

  throw new Error(`Unsupported payment event: ${event}`);
}