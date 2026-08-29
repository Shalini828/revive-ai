import express from "express";
import { db } from "../prisma/db.ts";

const router = express.Router();

// GET all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await db.orm.public.Transaction.all();

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

// GET transactions for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const transactions =
      await db.orm.public.Transaction.where({
        userId,
      }).all();

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

// CREATE a transaction
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      amount,
      currency,
      category,
      description,
      status,
    } = req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and amount are required",
      });
    }

    const transaction =
      await db.orm.public.Transaction.create({
        userId: Number(userId),
        amount: Number(amount),
        currency: currency || "INR",
        category: category || null,
        description: description || null,
        status: status || "completed",
      });

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

// DELETE a transaction
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const transaction = await db.orm.public.Transaction
      .where({ id })
      .delete();

    res.json({
      success: true,
      message: "Transaction deleted successfully",
      transaction,
    });
  } catch (error) {
    console.error("Transaction deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
});

// UPDATE a transaction
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      amount,
      currency,
      category,
      description,
      status,
    } = req.body;

    const transaction = await db.orm.public.Transaction
      .where({ id })
      .update({
        amount,
        currency,
        category,
        description,
        status,
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

// GET a single transaction
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const transaction = await db.orm.public.Transaction
      .where({ id })
      .first();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
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