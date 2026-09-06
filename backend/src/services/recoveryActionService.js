import { db } from "../prisma/db.ts";

const VALID_STATUSES = ["pending", "in_progress", "completed"];

function validateStatus(status) {
  const normalizedStatus = String(status).toLowerCase();

  if (!VALID_STATUSES.includes(normalizedStatus)) {
    throw new Error("Status must be pending, in_progress, or completed");
  }

  return normalizedStatus;
}

// Create a recovery action
export async function createRecoveryAction({
  userId,
  priority,
  action,
  target,
}) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  if (!action || !target) {
    throw new Error("Action and target are required");
  }

  const recoveryAction = await db.orm.public.RecoveryAction.create({
    userId: Number(userId),
    priority: priority || "medium",
    action,
    target,
    status: "pending",
  });

  return recoveryAction;
}

// Get all recovery actions for a user
export async function getRecoveryActions(userId) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  return await db.orm.public.RecoveryAction.where({
    userId: Number(userId),
  }).all();
}

// Update recovery action status

export async function updateRecoveryActionStatus({ userId, actionId, status }) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  if (!actionId) {
    throw new Error("Valid actionId is required");
  }

  const normalizedStatus = validateStatus(status);

  const existingAction = await db.orm.public.RecoveryAction.where({
    id: Number(actionId),
  }).first();

  if (!existingAction) {
    throw new Error("Recovery action not found");
  }

  // User can only update their own action
  if (Number(existingAction.userId) !== Number(userId)) {
    throw new Error("You are not allowed to update this recovery action");
  }

  // Prevent duplicate completion processing
  const wasAlreadyCompleted =
    String(existingAction.status).toLowerCase() === "completed";

  // Update recovery action status
  const updatedAction = await db.orm.public.RecoveryAction.where({
    id: Number(actionId),
  }).update({
    status: normalizedStatus,
  });

  // When recovery is completed
  if (normalizedStatus === "completed" && !wasAlreadyCompleted) {
    const transactionMatch = String(existingAction.target ?? "").match(
      /Transaction\s+(\d+)/i,
    );

    // Mark linked transaction as successful
    if (transactionMatch) {
      const transactionId = Number(transactionMatch[1]);

      await db.orm.public.Transaction.where({
        id: transactionId,
      }).update({
        status: "successful",
      });
    }

    // Get all completed recovery actions for this user
    const allActions = await db.orm.public.RecoveryAction.where({
      userId: Number(userId),
    }).all();

    const completedActions = allActions.filter(
      (action) =>
        ["completed", "executed", "recovered"].includes(
          String(action.status).toLowerCase(),
        ),
    );

    // Calculate total recovered revenue from completed actions
    const recoveredRevenue = completedActions.reduce((sum, action) => {
      const match = String(action.target ?? "").match(
        /Expected recovery ₹([\d,]+)/i,
      );

      if (!match) {
        return sum;
      }

      return sum + Number(match[1].replace(/,/g, ""));
    }, 0);

    // Create a real notification in RevenueAlert
    await db.orm.public.RevenueAlert.create({
      userId: Number(userId),
      title: "Revenue recovery completed",
      message: `₹${recoveredRevenue.toLocaleString(
        "en-IN",
      )} recovered across ${completedActions.length} completed recovery actions.`,
      severity: "medium",
      type: "recovery_completed",
      isRead: false,
    });
  }

  return updatedAction;
}

// Delete a recovery action
export async function deleteRecoveryAction({ userId, actionId }) {
  if (!userId) {
    throw new Error("Valid userId is required");
  }

  if (!actionId) {
    throw new Error("Valid actionId is required");
  }

  const existingAction = await db.orm.public.RecoveryAction.where({
    id: Number(actionId),
  }).first();

  if (!existingAction) {
    throw new Error("Recovery action not found");
  }

  if (Number(existingAction.userId) !== Number(userId)) {
    throw new Error("You are not allowed to delete this recovery action");
  }

  await db.orm.public.RecoveryAction.where({
    id: Number(actionId),
  }).delete();

  return {
    success: true,
    message: "Recovery action deleted successfully",
  };
}
