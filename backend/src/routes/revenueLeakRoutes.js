import express from "express";
import { calculateRevenueLeak } from "../services/revenueLeakService.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/revenue-leak/:userId
// Get revenue leakage analysis for authenticated user
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only access their own revenue leak data
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this data",
      });
    }

    const revenueLeak = await calculateRevenueLeak(userId);

    res.json({
      success: true,
      revenueLeak,
    });
  } catch (error) {
    console.error("Revenue leak error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate revenue leakage",
    });
  }
});

export default router;