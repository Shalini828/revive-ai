import express from "express";
import {
  analyzeRevenue,
  generateRevenueAlert,
} from "../services/revenueAnalysisService.js";

import { db } from "../prisma/db.ts";

const router = express.Router();

// GET /api/analysis/:userId
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const analysis = await analyzeRevenue(userId);

    res.json({
      success: true,
      userId,
      analysis,
    });
  } catch (error) {
    console.error("Revenue analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to analyze revenue",
    });
  }
});

// POST /api/analysis/:userId/alerts
router.post("/:userId/alerts", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const result = await generateRevenueAlert(userId);

    res.json({
      success: true,
      userId,
      result,
    });
  } catch (error) {
    console.error("Automatic alert error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate revenue alert",
    });
  }
});

// GET /api/analysis/:userId/summary
router.get("/:userId/summary", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const analysis = await analyzeRevenue(userId);

    const alerts = await db.orm.public.RevenueAlert.where({
      userId,
    }).all();

    res.json({
      success: true,
      userId,
      analysis,
      alerts,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
});

export default router;