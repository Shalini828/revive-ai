import express from "express";

import { db } from "../prisma/db.ts";
import { generateRevenueAlert } from "../services/revenueAnalysisService.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();


// GET /api/transactions
// Get transactions for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const allTransactions =
      await db.orm.public.Transaction.all();

    const transactions = allTransactions
      .filter(
        (transaction) =>
          Number(transaction.userId) === req.user.id
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});


// GET /api/transactions/user/:userId
// Get transactions for a specific user
router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only access their own transactions
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access these transactions",
      });
    }

    const transactions =
      await db.orm.public.Transaction.where({
        userId,
      }).all();

    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Fetch user transactions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user transactions",
    });
  }
});


// POST /api/transactions
// Create a transaction for the authenticated user
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      amount,
      currency,
      category,
      description,
      status,
    } = req.body;

    const numericAmount = Number(amount);

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "amount must be a valid positive number",
      });
    }

    const transaction =
      await db.orm.public.Transaction.create({
        // IMPORTANT:
        // userId comes from JWT, not request body
        userId: req.user.id,

        amount: numericAmount,

        currency: currency || "INR",

        category: category || null,

        description: description || null,

        status: status || "completed",
      });

    // Alert generation should not make
    // a successful transaction look like a failure.
    try {
      await generateRevenueAlert(req.user.id);
    } catch (alertError) {
      console.error(
        "Revenue alert generation failed:",
        alertError
      );
    }

    res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Transaction creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
});


// DELETE /api/transactions/:id
// Delete only the authenticated user's transaction
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction id is required",
      });
    }

    const transaction =
      await db.orm.public.Transaction
        .where({ id })
        .first();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Ownership check
    if (Number(transaction.userId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this transaction",
      });
    }

    await db.orm.public.Transaction
      .where({ id })
      .delete();

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Transaction deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
});


// PUT /api/transactions/:id
// Update only the authenticated user's transaction
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction id is required",
      });
    }

    const {
      amount,
      currency,
      category,
      description,
      status,
    } = req.body;

    const existingTransaction =
      await db.orm.public.Transaction
        .where({ id })
        .first();

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Ownership check
    if (
      Number(existingTransaction.userId) !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this transaction",
      });
    }

    let updatedAmount = existingTransaction.amount;

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "amount must be a valid positive number",
        });
      }

      updatedAmount = numericAmount;
    }

    const transaction =
      await db.orm.public.Transaction
        .where({ id })
        .update({
          amount: updatedAmount,

          currency:
            currency !== undefined
              ? currency
              : existingTransaction.currency,

          category:
            category !== undefined
              ? category
              : existingTransaction.category,

          description:
            description !== undefined
              ? description
              : existingTransaction.description,

          status:
            status !== undefined
              ? status
              : existingTransaction.status,
        });

    res.json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Transaction update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
});


// GET /api/transactions/:id
// Get a single transaction owned by the authenticated user
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction id is required",
      });
    }

    const transaction =
      await db.orm.public.Transaction
        .where({ id })
        .first();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Ownership check
    if (Number(transaction.userId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this transaction",
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Fetch transaction error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
});


export default router;