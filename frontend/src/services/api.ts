import type {
  AgentStats,
  AnalyticsData,
  AuditLogEntry,
  DashboardData,
  Guardrail,
  Opportunity,
  PipelineStage,
  SimulatorStrategy,
  Transaction,
} from "@/types";

export const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   AUTH
========================================================= */

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
}

function getUserIdFromToken(): number | null {
  const token = getToken();

  if (!token) return null;

  try {
    const parts = token.split(".");

    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    // JWT uses base64url encoding.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(atob(padded));

    const userId = Number(payload?.userId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

/* =========================================================
   HTTP HELPER
========================================================= */

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    throw new Error("Your session has expired. Please sign in again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.messages ||
        `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

/* =========================================================
   HELPERS
========================================================= */

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatINR(value: number): string {
  return `₹${Math.round(toNumber(value)).toLocaleString("en-IN")}`;
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/* =========================================================
   BACKEND TYPES
========================================================= */

interface BackendTransaction {
  id: number | string;
  userId?: number;

  amount: number | string;

  status: string;

  description?: string;
  title?: string;
  category?: string;
  transactionType?: string;

  createdAt?: string;
  updatedAt?: string;
  date?: string;
}

interface BackendDashboardResponse {
  success?: boolean;

  dashboard?: {
    totalRevenue?: number | string;
    transactionCount?: number | string;
    averageTransaction?: number | string;
    trend?: string;
    trendPercentage?: number | string;
  };

  recentTransactions?: BackendTransaction[];

  transactions?: BackendTransaction[];

  alerts?: unknown[];
}

/* =========================================================
   TRANSACTION NORMALIZER
========================================================= */

function normalizeTransaction(transaction: BackendTransaction): Transaction {
  const amount = toNumber(transaction.amount);

  const createdAt =
    transaction.createdAt || transaction.date || new Date().toISOString();

  const title = transaction.title || transaction.description || "Transaction";

  const description = transaction.description || title;

  const status = normalizeStatus(transaction.status);

  let normalizedStatus:
    "successful" | "failed" | "pending" | "recovered" | "abandoned";

  if (["success", "successful", "completed", "captured"].includes(status)) {
    normalizedStatus = "successful";
  } else if (status === "failed") {
    normalizedStatus = "failed";
  } else if (["recovered", "recovery_success"].includes(status)) {
    normalizedStatus = "recovered";
  } else if (["abandoned", "cancelled", "canceled"].includes(status)) {
    normalizedStatus = "abandoned";
  } else {
    normalizedStatus = "pending";
  }

  return {
    ...transaction,
    id: String(transaction.id),
    amount,
    status: normalizedStatus,
    title,
    description,
    category: transaction.category || "General",
    createdAt,
  } as unknown as Transaction;
}

/* =========================================================
   DASHBOARD MAPPER
========================================================= */
function mapDashboard(response: BackendDashboardResponse): DashboardData {
  const dashboard = response.dashboard ?? {};

  const recoveryDashboard = dashboard as typeof dashboard & {
    revenueAtRisk?: number;
    recoverableRevenue?: number;
    recoveredRevenue?: number;
    historicalRecoveryOpportunity?: number;
    recoveryRate?: number;
    failedTransactions?: number;
    successfulTransactions?: number;
    completedRecoveryActions?: number;
    pendingRecoveryActions?: number;
  };

  const sourceTransactions =
    response.recentTransactions ?? response.transactions ?? [];

  const transactions = sourceTransactions.map((transaction) => ({
    ...transaction,
    id: String(transaction.id),
    amount: toNumber(transaction.amount),
    createdAt:
      transaction.createdAt || transaction.date || new Date().toISOString(),
    title: transaction.title || transaction.description || "Transaction",
    description: transaction.description || transaction.title || "Transaction",
    category: transaction.category || "General",
    status: normalizeStatus(transaction.status),
  }));

  const failedTransactions = transactions.filter(
    (transaction) => normalizeStatus(transaction.status) === "failed",
  );

  const successfulTransactions = transactions.filter((transaction) =>
    ["successful", "success", "completed", "captured", "recovered"].includes(
      normalizeStatus(transaction.status),
    ),
  );

  // Use backend recovery metrics as the source of truth.
  const revenueAtRisk = toNumber(recoveryDashboard.revenueAtRisk);

  const recoverableRevenue = toNumber(
    recoveryDashboard.historicalRecoveryOpportunity ??
      recoveryDashboard.recoverableRevenue,
  );

  const recoveredRevenue = toNumber(recoveryDashboard.recoveredRevenue);

  const recoveryRate = toNumber(recoveryDashboard.recoveryRate);

  const totalRevenue = toNumber(dashboard.totalRevenue);

  const transactionCount =
    toNumber(dashboard.transactionCount) || transactions.length;

  const averageTransaction =
    toNumber(dashboard.averageTransaction) ||
    (transactionCount > 0 ? totalRevenue / transactionCount : 0);

  const trendPercentage = toNumber(dashboard.trendPercentage);

  const kpis = [
    {
      id: "revenue-at-risk",
      label: "Revenue at Risk",
      value: formatINR(revenueAtRisk),
      sublabel: `${
        recoveryDashboard.failedTransactions ?? failedTransactions.length
      } failed transactions`,
      tone: "risk" as const,
      tooltip: "Revenue currently exposed through failed transactions.",
    },
    {
      id: "recoverable-revenue",
      label: "Recoverable Revenue",
      value: formatINR(recoverableRevenue),
      sublabel: "Historical recovery opportunity",
      tone: "recoverable" as const,
      tooltip:
        "Historical revenue opportunity available to the recovery engine.",
    },
    {
      id: "revenue-recovered",
      label: "Revenue Recovered",
      value: formatINR(recoveredRevenue),
      sublabel: `${
        recoveryDashboard.completedRecoveryActions ?? 0
      } completed recovery actions`,
      tone: "recovered" as const,
      tooltip: "Revenue recovered through completed recovery actions.",
    },
    {
      id: "recovery-rate",
      label: "Recovery Rate",
      value: `${recoveryRate.toFixed(1)}%`,
      sublabel: "Recovered ÷ historical recovery opportunity",
      tone: "rate" as const,
      tooltip: "Recovered revenue divided by historical recovery opportunity.",
    },
  ];

  // Build leakage chart from the transactions we have.
  const groupedByDate = new Map<
    string,
    {
      atRisk: number;
      recoverable: number;
      recovered: number;
    }
  >();

  transactions.forEach((transaction) => {
    const rawDate = transaction.createdAt || new Date().toISOString();

    const date = new Date(rawDate).toISOString().slice(0, 10);

    const current = groupedByDate.get(date) ?? {
      atRisk: 0,
      recoverable: 0,
      recovered: 0,
    };

    const amount = toNumber(transaction.amount);
    const status = normalizeStatus(transaction.status);

    if (status === "failed") {
      current.atRisk += amount;
    }

    if (
      ["successful", "success", "completed", "captured", "recovered"].includes(
        status,
      )
    ) {
      current.recovered += amount;
    }

    groupedByDate.set(date, current);
  });

  const leakageSeries = Array.from(groupedByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      ...values,
    }));

  // Ensure the chart reflects backend recovery totals
  // even when recentTransactions contains only a subset.
  if (leakageSeries.length === 0) {
    leakageSeries.push({
      date: new Date().toISOString().slice(0, 10),
      atRisk: revenueAtRisk,
      recoverable: recoverableRevenue,
      recovered: recoveredRevenue,
    });
  } else {
    const lastIndex = leakageSeries.length - 1;

    const lastPoint = leakageSeries[lastIndex];

    leakageSeries[lastIndex] = {
      date: lastPoint?.date ?? new Date().toISOString().slice(0, 10),
      atRisk: lastPoint?.atRisk ?? revenueAtRisk,
      recoverable: Math.max(lastPoint?.recoverable ?? 0, recoverableRevenue),
      recovered: Math.max(lastPoint?.recovered ?? 0, recoveredRevenue),
    };
  }
  const failedCount =
    recoveryDashboard.failedTransactions ?? failedTransactions.length;

  const categories = [
    {
      id: "failed_payment" as const,
      label: "Failed Payments",
      count: failedCount,
      atRisk: revenueAtRisk,
      recoverable: recoverableRevenue,
      recoveryRate,
    },
    {
      id: "abandoned_checkout" as const,
      label: "Abandoned Checkouts",
      count: transactions.filter(
        (transaction) => normalizeStatus(transaction.status) === "abandoned",
      ).length,
      atRisk: 0,
      recoverable: 0,
      recoveryRate: 0,
    },
    {
      id: "failed_subscription" as const,
      label: "Failed Subscriptions",
      count: transactions.filter(
        (transaction) =>
          normalizeStatus(transaction.status) === "failed" &&
          normalizeStatus(transaction.category).includes("subscription"),
      ).length,
      atRisk: 0,
      recoverable: 0,
      recoveryRate: 0,
    },
    {
      id: "overdue_invoice" as const,
      label: "Overdue Invoices",
      count: transactions.filter((transaction) =>
        normalizeStatus(transaction.category).includes("invoice"),
      ).length,
      atRisk: 0,
      recoverable: 0,
      recoveryRate: 0,
    },
  ];

  const recommendedActions = failedTransactions
    .slice(0, 5)
    .map((transaction, index) => ({
      id: String(transaction.id),
      customer:
        transaction.description || transaction.title || `Customer ${index + 1}`,
      amount: toNumber(transaction.amount),
      issue: "Failed payment",
      recommendation: "Retry failed payment",
      confidence: 85,
      expectedRecovery: toNumber(transaction.amount),
      status: "recommended" as const,
    }));

  return {
    kpis,
    leakageSeries,
    categories,
    recommendedActions,
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboard(): Promise<DashboardData> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in. Please sign in again.");
  }

  /*
   * IMPORTANT:
   *
   * Backend route:
   * GET /api/dashboard/:userId
   */

  const response = await apiRequest<BackendDashboardResponse>(
    `/dashboard/${userId}`,
  );

  return mapDashboard(response);
}

/* =========================================================
   TRANSACTIONS
========================================================= */

export async function getTransactions(): Promise<Transaction[]> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in.");
  }

  const response = await apiRequest<any>(`/transactions?userId=${userId}`);

  const transactions =
    response?.transactions ??
    response?.data ??
    (Array.isArray(response) ? response : []);

  return transactions.map((transaction: BackendTransaction) =>
    normalizeTransaction(transaction),
  );
}

export async function getTransaction(
  id: string,
): Promise<Transaction | undefined> {
  const transactions = await getTransactions();

  return transactions.find(
    (transaction) => String(transaction.id) === String(id),
  );
}

/* =========================================================
   OPPORTUNITIES / REVENUE LEAK
========================================================= */

export async function getOpportunities(): Promise<Opportunity[]> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("Authentication required");
  }

  // Get real transactions and real recovery actions from the backend
  const [transactionResponse, recoveryResponse] = await Promise.all([
    apiRequest<any>("/transactions"),
    apiRequest<any>("/recovery-actions"),
  ]);

  const transactions = Array.isArray(transactionResponse?.transactions)
    ? transactionResponse.transactions
    : [];

  const recoveryActions = Array.isArray(recoveryResponse?.actions)
    ? recoveryResponse.actions
    : [];

  // A transaction is relevant if:
  // 1. it is currently failed, OR
  // 2. it has a recovery action associated with it
  //
  // This preserves historical recovery opportunities even after
  // the transaction becomes successful.
  const opportunityTransactions = transactions.filter((transaction: any) => {
    const transactionId = Number(transaction.id);

    const relatedActions = recoveryActions.filter((action: any) => {
      const target = String(action.target ?? "");

      return (
        target.includes(`Transaction ${transactionId}`) ||
        target.includes(`Transaction ${transaction.id}`)
      );
    });

    const isFailed = ["failed", "failure"].includes(
      String(transaction.status).toLowerCase(),
    );

    return isFailed || relatedActions.length > 0;
  });

  return opportunityTransactions.map((transaction: any): Opportunity => {
    const amount = Number(transaction.amount) || 0;
    const transactionId = Number(transaction.id);

    // Find all recovery actions associated with this transaction
    const relatedActions = recoveryActions.filter((action: any) => {
      const target = String(action.target ?? "");

      return (
        target.includes(`Transaction ${transactionId}`) ||
        target.includes(`Transaction ${transaction.id}`)
      );
    });

    const latestAction =
      relatedActions.length > 0
        ? relatedActions[relatedActions.length - 1]
        : null;

    const hasCompletedRecovery = relatedActions.some((action: any) =>
      ["completed", "executed", "recovered"].includes(
        String(action.status).toLowerCase(),
      ),
    );

    // Extract expected recovery from the real recovery action
    let expectedRecovery = amount;

    for (const action of relatedActions) {
      const recoveryMatch = String(action.target ?? "").match(
        /Expected recovery ₹([\d,]+)/i,
      );

      if (recoveryMatch) {
        expectedRecovery = Number(
          (recoveryMatch[1] ?? "0").replace(/,/g, ""),
        );
      }
    }

    // Calculate recoverability from actual expected recovery
    const recoverability =
      amount > 0
        ? Math.min(100, Math.round((expectedRecovery / amount) * 100))
        : 0;

    // Use the actual recovery action as the recommendation
    const recommendation =
      latestAction?.action || "Retry failed payment";

    const isHighValue = amount >= 10000;

    const transactionStatus = String(
      transaction.status ?? "",
    ).toLowerCase();

    // Preserve the real recovery state
    const opportunityStatus = hasCompletedRecovery
      ? "approved"
      : latestAction?.status || (transactionStatus === "failed"
          ? "recommended"
          : "recommended");

    return {
      id: String(transaction.id),
      transactionId: String(transaction.id),

      customer:
        transaction.customer ||
        transaction.customerName ||
        `Customer #${transaction.id}`,

      email: transaction.email || "",

      type: "failed_payment",

      amount,

      reason:
        transaction.description ||
        (hasCompletedRecovery
          ? "Payment failure was recovered successfully."
          : "Payment failed and revenue was not recovered."),

      recoverability,

      recommendation,

      diagnosis: hasCompletedRecovery
        ? "Payment failure was detected from transaction data and the associated recovery action was completed successfully."
        : "Payment failure detected from transaction data. Recovery strategy is evaluated against the available recovery actions.",

      confidence: latestAction ? 100 : 85,

      priority:
        amount >= 10000
          ? "critical"
          : amount >= 5000
            ? "high"
            : "medium",

      status: opportunityStatus,

      expectedRecovery,

      guardrail: "passed",

      guardrailNote: isHighValue
        ? "High-value transactions require additional review before recovery execution."
        : hasCompletedRecovery
          ? "Recovery action was completed for this transaction."
          : "Transaction is eligible for recovery review.",

      detectedAt:
        transaction.createdAt || new Date().toISOString(),

      // Number of real recovery attempts/actions
      attempts: relatedActions.length,

      customerHistory:
        transaction.customerHistory ||
        "No additional customer history available.",
    };
  });
}


/* =========================================================
   ANALYTICS
========================================================= */

export async function getAnalytics(): Promise<AnalyticsData> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in.");
  }

  const response = await apiRequest<any>(`/analysis/${userId}/analytics`);

  return (response?.analytics ?? response?.data ?? response) as AnalyticsData;
}

/* =========================================================
   AUDIT LOGS / ALERTS
========================================================= */

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in.");
  }

  const response = await apiRequest<any>(`/alerts?userId=${userId}`);

  return (response?.auditLogs ??
    response?.logs ??
    response?.alerts ??
    response?.data ??
    []) as AuditLogEntry[];
}

/* =========================================================
   AI AGENT
========================================================= */

export async function getAgentStatus(): Promise<{
  stats: AgentStats;
  pipeline: PipelineStage[];
  guardrails: Guardrail[];
}> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in.");
  }

  const [analysisResponse, recoveryResponse, recoveryPlanResponse] =
    await Promise.all([
      apiRequest<any>(`/analysis/${userId}`),
      apiRequest<any>("/recovery-actions"),
      apiRequest<any>(`/recovery/${userId}`),
    ]);

  const analysis = analysisResponse?.analysis ?? {};
  const recoveryPlan = recoveryPlanResponse?.recoveryPlan ?? {};

  const actions =
    recoveryResponse?.actions ??
    recoveryResponse?.data ??
    (Array.isArray(recoveryResponse) ? recoveryResponse : []);

  const completedActions = actions.filter((action: any) =>
    ["completed", "executed", "recovered"].includes(
      normalizeStatus(action.status),
    ),
  );
  const recoveredAmount = completedActions.reduce(
    (sum: number, action: any) => {
      const directAmount =
        action.amount ?? action.expectedRecovery ?? action.recoveredAmount;

      if (directAmount !== undefined && directAmount !== null) {
        return sum + toNumber(directAmount);
      }

      const target = String(action.target ?? "");

      const match = target.match(/Expected recovery ₹([\d,]+)/i);

      if (match) {
        return sum + toNumber((match[1] ?? "0").replace(/,/g, ""));
      }

      return sum;
    },
    0,
  );

  return {
    stats: {
      analyzed: toNumber(analysis.transactionCount),

      interventions: actions.length,

      recoveries: completedActions.length,

      recoveredAmount,

      uptime: "Active",

      lastDecisionAt:
        actions.length > 0
          ? (actions[actions.length - 1]?.updatedAt ??
            actions[actions.length - 1]?.createdAt ??
            new Date().toISOString())
          : new Date().toISOString(),
    },

    pipeline: recoveryPlan.pipeline ?? [],

    guardrails: recoveryPlan.guardrails ?? [],
  };
}

/* =========================================================
   SIMULATOR
========================================================= */

export async function getSimulatorStrategies(): Promise<SimulatorStrategy[]> {
  const userId = getUserIdFromToken();

  if (!userId) {
    throw new Error("You are not signed in.");
  }

  const response = await apiRequest<any>(`/recovery/${userId}`);

  const strategies =
    response?.recoveryPlan?.strategies ?? response?.strategies ?? [];

  return strategies.map((strategy: any): SimulatorStrategy => ({
    id: String(strategy.id),
    ...(strategy.transactionId
      ? { transactionId: Number(strategy.transactionId) }
      : {}),
    strategy: String(strategy.strategy),

    expectedRecovery: toNumber(strategy.expectedRecovery),

    expectedRecoveryLabel: formatINR(toNumber(strategy.expectedRecovery)),

    interventionCost: toNumber(strategy.interventionCost),

    interventionCostLabel: formatINR(toNumber(strategy.interventionCost)),

    friction: strategy.friction ?? "Medium",

    risk: strategy.risk ?? "Medium",

    recommended: Boolean(strategy.recommended),
  }));
}

/* =========================================================
   RECOVERY QUEUE
========================================================= */

export async function getRecoveryQueue(): Promise<Opportunity[]> {
  const [opportunities, recoveryResponse] = await Promise.all([
    getOpportunities(),
    apiRequest<any>("/recovery-actions"),
  ]);

  const actions = Array.isArray(recoveryResponse?.actions)
    ? recoveryResponse.actions
    : [];

  return actions
    .filter((action: any) =>
      ["pending", "in_progress"].includes(String(action.status).toLowerCase()),
    )
    .map((action: any): Opportunity => {
      const target = String(action.target ?? "");

      const opportunity = opportunities.find((o) => {
        const transactionId = String(o.transactionId);
        return (
          target === transactionId ||
          target === `Transaction ${transactionId}` ||
          target.startsWith(`Transaction ${transactionId} ·`)
        );
      });

      const amount = opportunity?.amount ?? 0;

      return {
        id: String(action.id), // ✅ REAL RecoveryAction ID
        transactionId: opportunity?.transactionId ?? String(action.id),
        customer: opportunity?.customer ?? "Recovery Customer",
        email: opportunity?.email ?? "",
        type: opportunity?.type ?? "failed_payment",
        amount,
        reason:
          opportunity?.reason ?? action.target ?? "Recovery action pending.",
        recoverability: opportunity?.recoverability ?? 85,
        recommendation: action.action,
        diagnosis:
          opportunity?.diagnosis ??
          "Recovery action created from a detected revenue opportunity.",
        confidence: opportunity?.confidence ?? 85,
        priority: action.priority ?? opportunity?.priority ?? "medium",
        status: action.status,
        expectedRecovery: opportunity?.expectedRecovery ?? amount,
        guardrail: opportunity?.guardrail ?? "passed",
        guardrailNote:
          opportunity?.guardrailNote ??
          "Recovery action is eligible for execution.",
        detectedAt:
          action.createdAt ??
          opportunity?.detectedAt ??
          new Date().toISOString(),
        attempts: opportunity?.attempts ?? 0,
        customerHistory:
          opportunity?.customerHistory ??
          "No additional customer history available.",
      };
    });
}

/* =========================================================
   RECOVERY ACTIONS
========================================================= */

export interface RecoveryActionResult {
  id: string;

  status: "approved" | "executed" | "dismissed";

  message: string;
}

/* =========================================================
   REQUEST RECOMMENDATION
========================================================= */

export async function requestRecommendation(
  id: string,
): Promise<RecoveryActionResult> {
  const response = await apiRequest<any>(`/recovery/${id}/recommend`, {
    method: "POST",
  });

  return {
    id,

    status: "approved",

    message: response?.message || "Recommendation generated successfully.",
  };
}

/* =========================================================
   EXECUTE RECOVERY
========================================================= */

export async function executeRecovery(
  id: string,
): Promise<RecoveryActionResult> {
  const response = await apiRequest<any>(`/recovery/${id}/execute`, {
    method: "POST",
  });

  return {
    id,

    status: "executed",

    message: response?.message || "Recovery action queued for execution.",
  };
}

/* =========================================================
   DISMISS OPPORTUNITY
========================================================= */

export async function dismissOpportunity(
  id: string,
): Promise<RecoveryActionResult> {
  const response = await apiRequest<any>(`/recovery/${id}/dismiss`, {
    method: "POST",
  });

  return {
    id,

    status: "dismissed",

    message: response?.message || "Opportunity dismissed.",
  };
}

/* =========================================================
   AGENT ACTIVE STATE
========================================================= */

export async function setAgentActive(
  active: boolean,
): Promise<{ active: boolean }> {
  const response = await apiRequest<any>("/recovery-actions", {
    method: "POST",

    body: JSON.stringify({
      action: active
        ? "Activate AI recovery agent"
        : "Deactivate AI recovery agent",

      target: "REVIVE AI",

      priority: "medium",
    }),
  });

  return {
    active: response?.active ?? active,
  };
}

export async function createRecoveryAction({
  priority,
  action,
  target,
}: {
  priority: string;
  action: string;
  target: string;
}) {
  return apiRequest<any>("/recovery-actions", {
    method: "POST",
    body: JSON.stringify({
      priority,
      action,
      target,
    }),
  });
}

export async function updateRecoveryActionStatus({
  actionId,
  status,
}: {
  actionId: number;
  status: "pending" | "in_progress" | "completed";
}) {
  return apiRequest<any>(`/recovery-actions/${actionId}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status,
    }),
  });
}

/* =========================================================
   QUERY KEYS
========================================================= */

export const queryKeys = {
  dashboard: ["dashboard"] as const,

  opportunities: ["opportunities"] as const,

  transactions: ["transactions"] as const,

  analytics: ["analytics"] as const,

  auditLogs: ["audit-logs"] as const,

  agentStatus: ["agent", "status"] as const,

  simulator: ["agent", "simulator"] as const,

  recoveryQueue: ["agent", "queue"] as const,
};
