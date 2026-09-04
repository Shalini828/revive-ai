import express from "express";

import { db } from "../prisma/db.ts";
import { requireAuth } from "../middleware/authMiddleware.js";
import { generateAIRecommendation } from "../services/recommendationService.js";

const router = express.Router();

// GET /api/recommendations/:userId
// Get AI recommendations for the authenticated user
router.get("/:userId", requireAuth, async (req, res) => {
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

    const allRecommendations =
      await db.orm.public.AIRecommendation.all();

    const recommendations = allRecommendations
      .filter(
        (recommendation) =>
          Number(recommendation.userId) === userId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    res.json({
      success: true,
      userId,
      recommendations,
    });
  } catch (error) {
    console.error("Fetch recommendations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
});

// POST /api/recommendations/:userId/generate
// Generate a new AI recommendation
router.post("/:userId/generate", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only generate recommendations for themselves
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to generate recommendations for this user",
      });
    }

    const recommendation = await generateAIRecommendation(userId);

    res.status(201).json({
      success: true,
      userId,
      recommendation,
    });
  } catch (error) {
    console.error("Generate AI recommendation error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI recommendation",
    });
  }
});


export default router;