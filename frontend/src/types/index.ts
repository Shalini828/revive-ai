/**
 * Domain types for REVIVE AI.
 * These mirror the shapes the future REST backend is expected to return,
 * so mock data can be swapped for API responses without UI changes.
 */

export type LeakageType =
  | "failed_payment"
  | "abandoned_checkout"
  | "failed_subscription"
  | "overdue_invoice";

export type Priority = "critical" | "high" | "medium" | "low";

export type OpportunityStatus =
  | "recommended"
  | "pending"
  | "in_progress"
  | "recovered"
  | "approved"
  | "failed"
  | "dismissed";

export type TransactionStatus =
  | "successful"
  | "failed"
  | "pending"
  | "recovered"
  | "abandoned";

export type RecoveryStatus =
  | "not_required"
  | "queued"
  | "in_progress"
  | "recovered"
  | "unrecoverable";

export type GuardrailResult = "passed" | "review" | "blocked";

export interface KpiTrend {
  direction: "up" | "down";
  value: string;
  label: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  trend?: KpiTrend;
  tone?: "risk" | "recoverable" | "recovered" | "rate";
  tooltip?: string;
}

export interface LeakagePoint {
  date: string;
  atRisk: number;
  recoverable: number;
  recovered: number;
}

export interface LeakageCategory {
  id: LeakageType;
  label: string;
  count: number;
  atRisk: number;
  recoverable: number;
  recoveryRate: number;
}

export interface RecommendedAction {
  id: string;
  customer: string;
  amount: number;
  issue: string;
  recommendation: string;
  confidence: number;
  expectedRecovery: number;
  status: OpportunityStatus;
}

export interface DashboardData {
  kpis: Kpi[];
  leakageSeries: LeakagePoint[];
  categories: LeakageCategory[];
  recommendedActions: RecommendedAction[];
}

export interface Opportunity {
  id: string;
  transactionId: string;
  customer: string;
  email: string;
  type: LeakageType;
  amount: number;
  reason: string;
  recoverability: number;
  recommendation: string;
  diagnosis: string;
  confidence: number;
  priority: Priority;
  status: OpportunityStatus;
  expectedRecovery: number;
  guardrail: GuardrailResult;
  guardrailNote: string;
  detectedAt: string;
  attempts: number;
  customerHistory: string;
}

export interface AgentStats {
  analyzed: number;
  interventions: number;
  recoveries: number;
  recoveredAmount: number;
  uptime: string;
  lastDecisionAt: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  description: string;
  throughput: string;
}

export interface SimulatorStrategy {
  id: string;
  transactionId?: number;
  strategy: string;
  expectedRecovery: number;
  expectedRecoveryLabel: string;
  interventionCost: number;
  interventionCostLabel: string;
  friction: "Low" | "Medium" | "High";
  risk: "Low" | "Medium" | "High";
  recommended?: boolean;
}

export interface Guardrail {
  id: string;
  label: string;
  value: string;
  description: string;
  status: "active" | "enforced" | "monitoring";
}

export interface AnalyticsFunnelStage {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
}

export interface AnalyticsData {
  kpis: Kpi[];
  trend: { month: string; recoverable: number; recovered: number; rate: number }[];
  byFailureType: { type: string; rate: number; volume: number }[];
  byIntervention: { intervention: string; recovered: number; attempts: number }[];
  bySegment: { segment: string; recovered: number }[];
  funnel: AnalyticsFunnelStage[];
  aiPerformance: { id: string; label: string; value: string; tooltip: string }[];
}

export interface TimelineEvent {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  state: "done" | "active" | "pending" | "failed";
}

export interface Transaction {
  id: string;
  customer: string;
  email: string;
  amount: number;
  method: string;
  status: TransactionStatus;
  failureReason: string | null;
  date: string;
  recoveryStatus: RecoveryStatus;
  timeline: TimelineEvent[];
  explanation: string;
  confidence: number | null;
  expectedRecovery: number | null;
  guardrail: GuardrailResult | null;
  action: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  entity: string;
  event: string;
  eventType: "analysis" | "decision" | "execution" | "guardrail" | "outcome";
  decision: string;
  action: string;
  result: "Pending" | "Approved" | "Executed" | "Recovered" | "Blocked" | "Failed";
  actor: "REVIVE AI" | "Human";
  actorName: string;
  detail: string;
}
