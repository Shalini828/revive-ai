import express from "express";

import { db } from "../prisma/db.ts";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/users
// Create a new user
router.post("/", requireAuth, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await db.orm.public.User.create({
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("User creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

// GET /api/users
// Get users
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await db.orm.public.User.where({ id: req.user.id }).first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Fetch user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// UPDATE a user
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only update their own profile
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this user",
      });
    }

    const { email, name } = req.body;

    const existingUser = await db.orm.public.User.where({ id }).first();

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = await db.orm.public.User.where({ id }).update({
      email:
        email !== undefined ? email.trim().toLowerCase() : existingUser.email,
      name: name !== undefined ? name.trim() : existingUser.name,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("User update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// DELETE /api/users/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // User can only delete their own account
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this user",
      });
    }

    // Delete user's recovery actions
    await db.orm.public.RecoveryAction.where({ userId: id }).delete();

    // Delete user's AI recommendations
    await db.orm.public.AIRecommendation.where({ userId: id }).delete();

    // Delete user's payments
    await db.orm.public.Payment.where({ userId: id }).delete();

    // Delete user's alerts
    await db.orm.public.RevenueAlert.where({ userId: id }).delete();

    // Delete user's transactions
    await db.orm.public.Transaction.where({ userId: id }).delete();

    // Finally delete the user
    const user = await db.orm.public.User.where({ id }).delete();

    res.json({
      success: true,
      message: "User deleted successfully",
      user,
    });
  } catch (error) {
    console.error("User deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

export default router;
