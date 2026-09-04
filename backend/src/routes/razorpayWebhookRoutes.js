import express from "express";
import {
  verifyRazorpayWebhookSignature,
  processPaymentEvent,
} from "../services/paymentEventService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay webhook secret is not configured",
      });
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body);

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Razorpay webhook signature",
      });
    }

    const payload = JSON.parse(rawBody.toString());

    const event = payload.event;

    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(400).json({
        success: false,
        message: "Payment data not found",
      });
    }

    const paymentId = paymentEntity.id;

    const amount = Number(paymentEntity.amount) / 100;

    const currency = paymentEntity.currency || "INR";

    const userId = Number(paymentEntity.notes?.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId not found in Razorpay payment notes",
      });
    }

    const result = await processPaymentEvent({
      event,
      paymentId,
      userId,
      amount,
      currency,
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Webhook processing failed",
    });
  }
});

export default router;
