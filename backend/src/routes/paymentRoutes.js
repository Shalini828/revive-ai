import express from "express";

import {
  createMockPayment,
  processMockPayment,
  getUserPayments,
} from "../services/paymentService.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/payments/create
// Create a payment attempt
router.post("/create", requireAuth, async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const payment = await createMockPayment({
      userId: req.user.id,
      amount,
      currency,
    });

    res.status(201).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create payment",
    });
  }
});

// POST /api/payments/process
// Process a mock payment
router.post("/process", requireAuth, async (req, res) => {
  try {
    const {
      amount,
      currency,
      status,
    } = req.body;

    const paymentResult = await processMockPayment({
      userId: req.user.id,
      amount,
      currency,
      status: status || "success",
    });

    res.json({
      success: true,
      ...paymentResult,
    });
  } catch (error) {
    console.error("Payment processing error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
  }
});

// GET /api/payments
// Get payments for authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const payments = await getUserPayments(req.user.id);

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch payments",
    });
  }
});

export default router;