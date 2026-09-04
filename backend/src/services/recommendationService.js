import { GoogleGenAI } from "@google/genai";
import { db } from "../prisma/db.ts";
import { analyzeRevenue } from "./revenueAnalysisService.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateAIRecommendation(userId) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  const numericUserId = Number(userId);

  // 1. Get revenue analysis
  const analysis = await analyzeRevenue(numericUserId);

  // 2. Get user's alerts
  const allAlerts = await db.orm.public.RevenueAlert.all();

  const alerts = allAlerts
    .filter((alert) => Number(alert.userId) === numericUserId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // 3. Prepare data for Gemini
  const prompt = `
You are a business revenue advisor.

Analyze the following business revenue information and provide one practical recommendation.

Revenue Analysis:
- Total Revenue: ₹${analysis.totalRevenue}
- Transaction Count: ${analysis.transactionCount}
- Average Transaction: ₹${analysis.averageTransaction}
- Revenue Trend: ${analysis.trend}
- Trend Percentage: ${analysis.trendPercentage}%
- Health Score: ${analysis.healthScore}
- Health Status: ${analysis.healthStatus}

Recent Alerts:
${alerts.length > 0
    ? alerts
        .map(
          (alert) =>
            `- ${alert.title}: ${alert.message} (Severity: ${alert.severity})`
        )
        .join("\n")
    : "No recent alerts."}

Return ONLY valid JSON in this exact format:

{
  "insight": "Short description of the current situation",
  "reason": "Why this situation is happening",
  "recommendation": "One practical action the business owner should take"
}
`;

  // 4. Ask Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error("AI did not return a response");
  }

  // 5. Clean possible markdown formatting
  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let aiResult;

  try {
    aiResult = JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI JSON parsing error:", error);
    console.error("AI response:", text);

    throw new Error("AI returned an invalid recommendation format");
  }

  // 6. Save recommendation in database
  const recommendation =
    await db.orm.public.AIRecommendation.create({
      userId: numericUserId,
      insight: aiResult.insight,
      reason: aiResult.reason,
      recommendation: aiResult.recommendation,
    });

  return recommendation;
}