import express from "express";

import { GoogleGenAI } from "@google/genai";

import { db } from "../prisma/db.ts";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// GET /api/ai/:userId
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only access their own AI insights
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this user's AI insights",
      });
    }

    const transactions = await db.orm.public.Transaction.all();
    const alerts = await db.orm.public.RevenueAlert.all();

    const userAlerts = alerts.filter(
      (alert) => Number(alert.userId) === userId,
    );

    const userTransactions = transactions.filter(
      (transaction) => Number(transaction.userId) === userId,
    );

    if (userTransactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this user",
      });
    }

    const totalRevenue = userTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const averageTransaction =
      totalRevenue / userTransactions.length;

    const transactionData = userTransactions.map((transaction) => ({
      amount: Number(transaction.amount),
      category: transaction.category,
      description: transaction.description,
      status: transaction.status,
    }));

    const prompt = `
You are the financial AI assistant for REVIVE AI.

Analyze this user's transaction data.

Total revenue: ${totalRevenue}

Transaction count: ${userTransactions.length}

Average transaction: ${averageTransaction}

Transactions:

${JSON.stringify(transactionData, null, 2)}

Alerts:

${JSON.stringify(userAlerts, null, 2)}

Return ONLY valid JSON in exactly this format:

{
  "insight": "short explanation of what is happening",
  "reason": "possible reason based on the data",
  "recommendation": "one practical recommendation"
}

Do not use markdown.

Do not use code blocks.

Keep each field under 50 words.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text.trim();

    const aiResult = JSON.parse(text);

    await db.orm.public.AIRecommendation.create({
      userId,
      insight: aiResult.insight,
      reason: aiResult.reason,
      recommendation: aiResult.recommendation,
    });

    res.json({
      success: true,
      userId,
      ai: aiResult,
      summary: {
        totalRevenue,
        transactionCount: userTransactions.length,
        averageTransaction,
      },
    });
  } catch (error) {
    console.error("Gemini AI error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI insight",
    });
  }
});

// GET /api/ai/:userId/recommendations
router.get("/:userId/recommendations", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only access their own recommendations
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access these recommendations",
      });
    }

    const recommendations =
      await db.orm.public.AIRecommendation.where({
        userId,
      }).all();

    res.json({
      success: true,
      userId,
      recommendations,
    });
  } catch (error) {
    console.error("AI recommendations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch AI recommendations",
    });
  }
});

// POST /api/ai/chat
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    // Get userId from authenticated user, NOT from request body
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "message is required",
      });
    }

    const transactions = await db.orm.public.Transaction.all();
    const alerts = await db.orm.public.RevenueAlert.all();

    const userTransactions = transactions.filter(
      (transaction) => Number(transaction.userId) === userId,
    );

    const userAlerts = alerts.filter(
      (alert) => Number(alert.userId) === userId,
    );

    const totalRevenue = userTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    const prompt = `
You are REVIVE AI, a financial assistant.

Answer the user's question using their financial data.

User question:

${message}

Financial summary:

Total revenue: ${totalRevenue}

Transaction count: ${userTransactions.length}

Transactions:

${JSON.stringify(userTransactions, null, 2)}

Alerts:

${JSON.stringify(userAlerts, null, 2)}

Give a clear, practical answer.

Do not invent financial data.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      userId,
      message,
      answer: response.text,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
    });
  }
});

export default router;