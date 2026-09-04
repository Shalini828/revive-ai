import express from "express";

import {
  createRecoveryAction,
  getRecoveryActions,
  updateRecoveryActionStatus,
  deleteRecoveryAction,
} from "../services/recoveryActionService.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/recovery-actions
// Get recovery actions for authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const actions = await getRecoveryActions(req.user.id);

    res.json({
      success: true,
      userId: req.user.id,
      actions,
    });
  } catch (error) {
    console.error("Get recovery actions error:", error);

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch recovery actions",
    });
  }
});

// POST /api/recovery-actions
// Create a recovery action
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      priority,
      action,
      target,
    } = req.body;

    const recoveryAction =
      await createRecoveryAction({
        userId: req.user.id,
        priority,
        action,
        target,
      });

    res.status(201).json({
      success: true,
      recoveryAction,
    });
  } catch (error) {
    console.error("Create recovery action error:", error);

    res.status(400).json({
      success: false,
      message:
        error.message || "Failed to create recovery action",
    });
  }
});

// PUT /api/recovery-actions/:id/status
// Update recovery action status
router.put("/:id/status", requireAuth, async (req, res) => {
  try {
    const actionId = Number(req.params.id);
    const { status } = req.body;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        message: "Valid action id is required",
      });
    }

    const recoveryAction =
      await updateRecoveryActionStatus({
        userId: req.user.id,
        actionId,
        status,
      });

    res.json({
      success: true,
      recoveryAction,
    });
  } catch (error) {
    console.error("Update recovery action error:", error);

    const statusCode =
      error.message.includes("not allowed")
        ? 403
        : error.message.includes("not found")
        ? 404
        : 400;

    res.status(statusCode).json({
      success: false,
      message:
        error.message || "Failed to update recovery action",
    });
  }
});

// DELETE /api/recovery-actions/:id
// Delete a recovery action
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const actionId = Number(req.params.id);

    if (!actionId) {
      return res.status(400).json({
        success: false,
        message: "Valid action id is required",
      });
    }

    const result = await deleteRecoveryAction({
      userId: req.user.id,
      actionId,
    });

    res.json(result);
  } catch (error) {
    console.error("Delete recovery action error:", error);

    const statusCode =
      error.message.includes("not allowed")
        ? 403
        : error.message.includes("not found")
        ? 404
        : 400;

    res.status(statusCode).json({
      success: false,
      message:
        error.message || "Failed to delete recovery action",
    });
  }
});

export default router;