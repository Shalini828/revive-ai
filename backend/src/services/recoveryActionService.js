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

  if (normalizedStatus === "completed") {
    const match = String(existingAction.target ?? "").match(
      /^Transaction\s+(\d+)/,
    );

    if (match) {
      const transactionId = Number(match[1]);

      await db.orm.public.Transaction.where({
        id: transactionId,
      }).update({
        status: "success",
      });
    }
  }
  // Track when the action was actually completed
  const updatedAction = await db.orm.public.RecoveryAction.where({
    id: Number(actionId),
  }).update({
    status: normalizedStatus,
  });

  if (normalizedStatus === "completed") {
    const transactionMatch = String(existingAction.target || "").match(
      /Transaction\s+(\d+)/i,
    );

    if (transactionMatch) {
      const transactionId = Number(transactionMatch[1]);

      await db.orm.public.Transaction.where({
        id: transactionId,
      }).update({
        status: "successful",
      });
    }
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
