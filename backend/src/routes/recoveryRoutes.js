import express from "express";
import { generateRecoveryPlan } from "../services/recoveryPlanService.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/recovery/:userId
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only access their own recovery plan
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this recovery plan",
      });
    }

    const recoveryPlan = await generateRecoveryPlan(userId);

    res.json({
      success: true,
      userId,
      recoveryPlan,
    });
  } catch (error) {
    console.error("Recovery plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate recovery plan",
    });
  }
});

export default router;