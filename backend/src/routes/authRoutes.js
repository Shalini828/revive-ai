import express from "express";
import {
  registerUser,
  loginUser,
} from "../services/authService.js";

const router = express.Router();


// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});


// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({
      email,
      password,
    });

    res.json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
});

export default router;