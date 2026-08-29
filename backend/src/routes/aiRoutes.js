import express from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../prisma/db.ts";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const transactions =
      await db.orm.public.Transaction.all();

    const alerts =
    await db.orm.public.RevenueAlert.all();

    const userAlerts = alerts.filter(
    (a) => Number(a.userId) === userId
    );

    const userTransactions = transactions.filter(
      (t) => Number(t.userId) === userId
    );

    if (userTransactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this user",
      });
    }

    const totalRevenue = userTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    const averageTransaction =
      totalRevenue / userTransactions.length;

    const transactionData = userTransactions.map((t) => ({
      amount: Number(t.amount),
      category: t.category,
      description: t.description,
      status: t.status,
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


// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: "userId and message are required",
      });
    }

    const transactions =
      await db.orm.public.Transaction.all();

    const alerts =
      await db.orm.public.RevenueAlert.all();

    const userTransactions = transactions.filter(
      (t) => Number(t.userId) === Number(userId)
    );

    const userAlerts = alerts.filter(
      (a) => Number(a.userId) === Number(userId)
    );

    const totalRevenue = userTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
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
      model: "gemini-3.6-flash",
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