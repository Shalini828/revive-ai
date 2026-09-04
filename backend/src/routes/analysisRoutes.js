import express from "express";

import {
  analyzeRevenue,
  generateRevenueAlert,
} from "../services/revenueAnalysisService.js";

import { db } from "../prisma/db.ts";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const SUCCESS_STATUSES = [
  "success",
  "successful",
  "succeeded",
  "completed",
  "captured",
];

const FAILED_STATUSES = ["failed", "failure"];

function normalizeStatus(status) {
  return String(status ?? "").toLowerCase();
}

function getExpectedRecovery(action) {
  const target = String(action?.target ?? "");

  const match = target.match(/Expected recovery ₹([\d,]+)/i);

  if (!match) {
    return 0;
  }

  return Number(match[1].replace(/,/g, "")) || 0;
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getLastSixMonths() {
  const months = [];

  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1,
    );

    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString("en-US", {
        month: "short",
      }),
    });
  }

  return months;
}

function getMonthKey(date) {
  const d = new Date(date);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleString("en-US", {
    month: "short",
  });
}

/*
|--------------------------------------------------------------------------
| GET /api/analysis/:userId
|--------------------------------------------------------------------------
*/

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this analysis",
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

/*
|--------------------------------------------------------------------------
| POST /api/analysis/:userId/alerts
|--------------------------------------------------------------------------
*/

router.post("/:userId/alerts", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create alerts for this user",
      });
    }

    const result = await generateRevenueAlert(userId);

    res.json({
      success: true,
      userId,
      ...result,
    });
  } catch (error) {
    console.error("Revenue alert error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate revenue alert",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/analysis/:userId/summary
|--------------------------------------------------------------------------
*/

router.get("/:userId/summary", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this summary",
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
    console.error("Revenue summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue summary",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/analysis/:userId/analytics
|--------------------------------------------------------------------------
|
| This endpoint powers the Recovery Analytics page.
|
| All values are calculated from:
|   - Transaction table
|   - RecoveryAction table
|
|--------------------------------------------------------------------------
*/

router.get("/:userId/analytics", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access analytics",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch REAL database data
    |--------------------------------------------------------------------------
    */

    const [transactions, recoveryActions] = await Promise.all([
      db.orm.public.Transaction.where({
        userId,
      }).all(),

      db.orm.public.RecoveryAction.where({
        userId,
      }).all(),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Separate transaction states
    |--------------------------------------------------------------------------
    */

    const failedTransactions = transactions.filter((transaction) =>
      FAILED_STATUSES.includes(normalizeStatus(transaction.status)),
    );

    const successfulTransactions = transactions.filter((transaction) =>
      SUCCESS_STATUSES.includes(normalizeStatus(transaction.status)),
    );

    /*
    |--------------------------------------------------------------------------
    | Recovery actions
    |--------------------------------------------------------------------------
    */

    const completedActions = recoveryActions.filter((action) =>
      ["completed", "executed", "recovered"].includes(
        normalizeStatus(action.status),
      ),
    );

    const pendingActions = recoveryActions.filter((action) =>
      ["pending", "in_progress"].includes(
        normalizeStatus(action.status),
      ),
    );

    /*
    |--------------------------------------------------------------------------
    | REAL recovered revenue
    |--------------------------------------------------------------------------
    |
    | RecoveryAction currently stores the expected recovery amount
    | inside its target string.
    |
    | Example:
    | Transaction 18 · Expected recovery ₹2700.
    |
    |--------------------------------------------------------------------------
    */

    const recoveredRevenue = completedActions.reduce(
      (sum, action) => {
        return sum + getExpectedRecovery(action);
      },
      0,
    );

    /*
    |--------------------------------------------------------------------------
    | Current recoverable revenue
    |--------------------------------------------------------------------------
    */

    const currentlyRecoverableRevenue = failedTransactions.reduce(
      (sum, transaction) => {
        return sum + Number(transaction.amount || 0);
      },
      0,
    );

    /*
    |--------------------------------------------------------------------------
    | Historical recovery opportunity
    |--------------------------------------------------------------------------
    |
    | Once a recovery is approved, the transaction status becomes
    | "successful". Therefore it is no longer present inside
    | failedTransactions.
    |
    | We therefore include completed recovery amounts so the
    | analytics page retains the historical recovery opportunity.
    |
    |--------------------------------------------------------------------------
    */

    const totalRecoveryOpportunity =
      currentlyRecoverableRevenue + recoveredRevenue;

    const recoveryRate =
      totalRecoveryOpportunity > 0
        ? (recoveredRevenue / totalRecoveryOpportunity) * 100
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Historical recoverable revenue
    |--------------------------------------------------------------------------
    |
    | This represents all revenue that was available for recovery,
    | including opportunities that have already been recovered.
    |
    |--------------------------------------------------------------------------
    */

    const recommendedRevenue =
      currentlyRecoverableRevenue + recoveredRevenue;

    /*
    |--------------------------------------------------------------------------
    | KPI cards
    |--------------------------------------------------------------------------
    */

    const kpis = [
      {
        id: "recoverable",
        label: "Recoverable Revenue",
        value: formatINR(recommendedRevenue),
        sublabel: "Historical recovery opportunity",
        tone: "recoverable",
        tooltip:
          "Revenue that was historically available for recovery, including completed recovery opportunities.",
      },

      {
        id: "recovered",
        label: "Revenue Recovered",
        value: formatINR(recoveredRevenue),
        sublabel: "From completed recovery actions",
        tone: "recovered",
        tooltip:
          "Revenue recovered through completed recovery actions.",
      },

      {
        id: "rate",
        label: "Recovery Rate",
        value: `${recoveryRate.toFixed(1)}%`,
        sublabel: "Recovered / historical recovery opportunity",
        tone: "rate",
        tooltip:
          "Recovered revenue divided by total historical recovery opportunity.",
      },

      {
        id: "transactions",
        label: "Transactions",
        value: String(transactions.length),
        sublabel: "Total transactions analyzed",
        tooltip:
          "Total transactions belonging to this merchant.",
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | Recovery Trend — REAL DATA
    |--------------------------------------------------------------------------
    */

    const months = getLastSixMonths();

    const trend = months.map(({ year, month }) => {
      const monthKey = `${year}-${String(month + 1).padStart(
        2,
        "0",
      )}`;

      const monthTransactions = transactions.filter(
        (transaction) =>
          getMonthKey(transaction.createdAt) === monthKey,
      );

      const monthFailedRevenue = monthTransactions
        .filter((transaction) =>
          FAILED_STATUSES.includes(
            normalizeStatus(transaction.status),
          ),
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0,
        );

      const monthCompletedActions = completedActions.filter(
        (action) =>
          getMonthKey(
            action.updatedAt ?? action.createdAt,
          ) === monthKey,
      );

      const monthRecoveredRevenue =
        monthCompletedActions.reduce(
          (sum, action) =>
            sum + getExpectedRecovery(action),
          0,
        );

      const monthOpportunity =
        monthFailedRevenue + monthRecoveredRevenue;

      const monthRate =
        monthOpportunity > 0
          ? (monthRecoveredRevenue / monthOpportunity) * 100
          : 0;

      return {
        month: getMonthLabel(year, month),
        recoverable: monthFailedRevenue,
        recovered: monthRecoveredRevenue,
        rate: Number(monthRate.toFixed(1)),
      };
    });

    /*
    |--------------------------------------------------------------------------
    | Recovery Rate by Failure Type
    |--------------------------------------------------------------------------
    |
    | Uses transaction.category as the real failure/opportunity type.
    |--------------------------------------------------------------------------
    */

    const failureGroups = new Map();

    for (const transaction of transactions) {
      const isFailed = FAILED_STATUSES.includes(
        normalizeStatus(transaction.status),
      );

      const type =
        String(
          transaction.category ||
            transaction.type ||
            "unknown",
        ).trim() || "unknown";

      if (!failureGroups.has(type)) {
        failureGroups.set(type, {
          volume: 0,
          failedRevenue: 0,
          recoveredRevenue: 0,
        });
      }

      const group = failureGroups.get(type);

      if (isFailed) {
        group.volume += 1;
        group.failedRevenue += Number(
          transaction.amount || 0,
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Match completed recovery actions to their transactions
    |--------------------------------------------------------------------------
    */

    for (const action of completedActions) {
      const target = String(action.target ?? "");

      const match = target.match(/Transaction\s+(\d+)/i);

      if (!match) {
        continue;
      }

      const transactionId = Number(match[1]);

      const transaction = transactions.find(
        (item) => Number(item.id) === transactionId,
      );

      if (!transaction) {
        continue;
      }

      const type =
        String(
          transaction.category ||
            transaction.type ||
            "unknown",
        ).trim() || "unknown";

      if (!failureGroups.has(type)) {
        failureGroups.set(type, {
          volume: 0,
          failedRevenue: 0,
          recoveredRevenue: 0,
        });
      }

      failureGroups.get(type).recoveredRevenue +=
        getExpectedRecovery(action);
    }

    const byFailureType = Array.from(
      failureGroups.entries(),
    ).map(([type, group]) => {
      const opportunity =
        group.failedRevenue + group.recoveredRevenue;

      const rate =
        opportunity > 0
          ? (group.recoveredRevenue / opportunity) * 100
          : 0;

      return {
        type,
        rate: Number(rate.toFixed(1)),
        volume: group.volume,
      };
    });

    /*
    |--------------------------------------------------------------------------
    | Recovery by Intervention
    |--------------------------------------------------------------------------
    */

    const interventionGroups = new Map();

    for (const action of recoveryActions) {
      const intervention = String(
        action.action || "Unknown intervention",
      ).trim();

      if (!interventionGroups.has(intervention)) {
        interventionGroups.set(intervention, {
          recovered: 0,
          attempts: 0,
        });
      }

      const group = interventionGroups.get(intervention);

      group.attempts += 1;

      if (
        ["completed", "executed", "recovered"].includes(
          normalizeStatus(action.status),
        )
      ) {
        group.recovered += getExpectedRecovery(action);
      }
    }

    const byIntervention = Array.from(
      interventionGroups.entries(),
    ).map(([intervention, group]) => ({
      intervention,
      recovered: group.recovered,
      attempts: group.attempts,
    }));

    /*
    |--------------------------------------------------------------------------
    | Revenue Recovered by Customer Segment
    |--------------------------------------------------------------------------
    |
    | We use transaction.category as the available real segment
    | when no dedicated customerSegment column exists.
    |
    |--------------------------------------------------------------------------
    */

    const segmentGroups = new Map();

    for (const action of completedActions) {
      const target = String(action.target ?? "");

      const match = target.match(/Transaction\s+(\d+)/i);

      if (!match) {
        continue;
      }

      const transactionId = Number(match[1]);

      const transaction = transactions.find(
        (item) => Number(item.id) === transactionId,
      );

      if (!transaction) {
        continue;
      }

      const segment =
        String(
          transaction.category ||
            transaction.customerSegment ||
            "Other",
        ).trim() || "Other";

      const recovered = getExpectedRecovery(action);

      segmentGroups.set(
        segment,
        (segmentGroups.get(segment) || 0) + recovered,
      );
    }

    const bySegment = Array.from(
      segmentGroups.entries(),
    ).map(([segment, recovered]) => ({
      segment,
      recovered,
    }));

    /*
    |--------------------------------------------------------------------------
    | Recovery Funnel
    |--------------------------------------------------------------------------
    */

    const detectedRevenue = totalRecoveryOpportunity;

    const funnel = [
      {
        id: "detected",
        label: "Revenue at Risk",
        value: Number(detectedRevenue) || 0,
        valueLabel: formatINR(
          Number(detectedRevenue) || 0,
        ),
      },

      {
        id: "recoverable",
        label: "Recoverable Revenue",
        value: Number(recommendedRevenue) || 0,
        valueLabel: formatINR(
          Number(recommendedRevenue) || 0,
        ),
        sublabel: "Historical recovery opportunity",
        tone: "recoverable",
      },

      {
        id: "recovered",
        label: "Revenue Recovered",
        value: Number(recoveredRevenue) || 0,
        valueLabel: formatINR(
          Number(recoveredRevenue) || 0,
        ),
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | AI Performance
    |--------------------------------------------------------------------------
    */

    const completedCount = completedActions.length;

    const aiPerformance = [
      {
        id: "recovery-rate",
        label: "Recovery Rate",
        value: `${recoveryRate.toFixed(1)}%`,
        tooltip:
          "Percentage of historical recovery opportunity converted into recovered revenue.",
      },

      {
        id: "actions",
        label: "Completed Actions",
        value: String(completedCount),
        tooltip:
          "Recovery actions that have been completed successfully.",
      },

      {
        id: "pending",
        label: "Pending Actions",
        value: String(pendingActions.length),
        tooltip:
          "Recovery actions waiting for execution or approval.",
      },

      {
        id: "transactions",
        label: "Transactions Analyzed",
        value: String(transactions.length),
        tooltip:
          "Total real transactions analyzed by the recovery engine.",
      },
    ];

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,
      userId,

      analytics: {
        kpis,
        trend,
        byFailureType,
        byIntervention,
        bySegment,
        funnel,
        aiPerformance,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
});

export default router;