import express from "express";
import cors from "cors";
import { db } from "./src/prisma/db.ts";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import analysisRoutes from "./src/routes/analysisRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "REVIVE AI backend is running 🚀",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    res.json({
      success: true,
      database: "connected",
      users: users.length,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      database: "error",
      message: "Could not connect to database",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`REVIVE AI backend running on http://localhost:${PORT}`);
});