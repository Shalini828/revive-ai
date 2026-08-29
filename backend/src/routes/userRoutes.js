import express from "express";
import { db } from "../prisma/db.ts";

const router = express.Router();

// POST /api/users
// Create a new user
router.post("/", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await db.orm.public.User.create({
      email,
      name,
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
// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// UPDATE a user
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { email, name } = req.body;

    const user = await db.orm.public.User
      .where({ id })
      .update({
        email,
        name,
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

/// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // Delete user's alerts first
    await db.orm.public.RevenueAlert
      .where({ userId: id })
      .delete();

    // Delete user's transactions
    await db.orm.public.Transaction
      .where({ userId: id })
      .delete();

    // Finally delete the user
    const user = await db.orm.public.User
      .where({ id })
      .delete();

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