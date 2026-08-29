import express from "express";
import { db } from "../prisma/db.ts";

const router = express.Router();

// GET /api/alerts
// Get all revenue alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await db.orm.public.RevenueAlert.all();

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
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const alerts = await db.orm.public.RevenueAlert.all();

    const userAlerts = alerts.filter(
      (alert) => Number(alert.userId) === userId
    );

    res.json({
      success: true,
      alerts: userAlerts,
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
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      severity,
      type,
      isRead,
    } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "userId, title, message and type are required",
      });
    }

    const alert = await db.orm.public.RevenueAlert.create({
      userId,
      title,
      message,
      severity: severity || "medium",
      type,
      isRead: isRead || false,
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

export default router;