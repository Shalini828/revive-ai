import express from "express";
import { db } from "../prisma/db.ts";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/alerts
// Get alerts for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const allAlerts = await db.orm.public.RevenueAlert.all();

    const alerts = allAlerts
      .filter((alert) => Number(alert.userId) === req.user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Fetch alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
    });
  }
});

// GET /api/alerts/:userId
// Get alerts for a specific user
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // Prevent users from accessing another user's alerts
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access these alerts",
      });
    }

    const allAlerts = await db.orm.public.RevenueAlert.all();

    const alerts = allAlerts
      .filter((alert) => Number(alert.userId) === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Fetch user alerts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user alerts",
    });
  }
});

// POST /api/alerts
// Create a new revenue alert
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, message, severity, type, isRead } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "title, message and type are required",
      });
    }

    // userId comes from the authenticated JWT,
    // not from the request body
    const userId = req.user.id;

    const alert = await db.orm.public.RevenueAlert.create({
      userId,
      title,
      message,
      severity: severity || "medium",
      type,
      isRead: isRead ?? false,
    });

    res.status(201).json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error("Alert creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create alert",
    });
  }
});

// PATCH /api/alerts/:id/read
// Mark an alert as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const alertId = Number(req.params.id);

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "Valid alert id is required",
      });
    }

    const allAlerts = await db.orm.public.RevenueAlert.all();

    const alert = allAlerts.find((item) => Number(item.id) === alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    if (Number(alert.userId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this alert",
      });
    }

    const updatedAlert = await db.orm.public.RevenueAlert.where({
      id: alertId,
    }).update({
      isRead: true,
    });

    res.json({
      success: true,
      alert: updatedAlert,
    });
  } catch (error) {
    console.error("Mark alert read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark alert as read",
    });
  }
});

export default router;
