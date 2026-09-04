import type { AgentStats, Guardrail, PipelineStage, SimulatorStrategy } from "@/types";

export const mockAgentStats: AgentStats = {
  analyzed: 2184,
  interventions: 1910,
  recoveries: 1267,
  recoveredAmount: 782400,
  uptime: "99.98%",
  lastDecisionAt: "2026-08-28T21:44:02+05:30",
};

export const mockPipeline: PipelineStage[] = [
  {
    id: "detect",
    label: "Detect",
    description: "Ingest failures, abandoned sessions, mandate errors and overdue invoices in real time.",
    throughput: "2,184 signals",
  },
  {
    id: "diagnose",
    label: "Diagnose",
    description: "Classify root cause from issuer codes, session telemetry and customer history.",
    throughput: "2,184 diagnosed",
  },
  {
    id: "prioritize",
    label: "Prioritize",
    description: "Rank by recoverable value, decay curve and customer lifetime value.",
    throughput: "2,050 ranked",
  },
  {
    id: "recommend",
    label: "Recommend",
    description: "Select the intervention with the highest expected recovery per unit of friction.",
    throughput: "1,988 actions",
  },
  {
    id: "guardrail",
    label: "Guardrail Check",
    description: "Enforce retry caps, contact limits, discount ceilings and high-value approvals.",
    throughput: "78 held",
  },
  {
    id: "execute",
    label: "Execute",
    description: "Fire retries, payment links, reminders or escalations through connected channels.",
    throughput: "1,910 executed",
  },
  {
    id: "measure",
    label: "Measure",
    description: "Attribute settled revenue back to the intervention and retrain the ranking model.",
    throughput: "₹7.82L attributed",
  },
];

export const mockSimulator: SimulatorStrategy[] = [
  {
    id: "retry_now",
    strategy: "Retry Immediately",
    expectedRecovery: 210000,
    expectedRecoveryLabel: "₹2.1L",
    interventionCost: 4000,
    interventionCostLabel: "₹4K",
    friction: "Medium",
    risk: "Medium",
  },
  {
    id: "retry_30",
    strategy: "Retry After 30 Minutes",
    expectedRecovery: 340000,
    expectedRecoveryLabel: "₹3.4L",
    interventionCost: 4000,
    interventionCostLabel: "₹4K",
    friction: "Low",
    risk: "Low",
  },
  {
    id: "payment_link",
    strategy: "Payment Link",
    expectedRecovery: 420000,
    expectedRecoveryLabel: "₹4.2L",
    interventionCost: 8000,
    interventionCostLabel: "₹8K",
    friction: "Low",
    risk: "Low",
    recommended: true,
  },
  {
    id: "whatsapp",
    strategy: "WhatsApp Reminder",
    expectedRecovery: 380000,
    expectedRecoveryLabel: "₹3.8L",
    interventionCost: 5000,
    interventionCostLabel: "₹5K",
    friction: "Low",
    risk: "Low",
  },
  {
    id: "human",
    strategy: "Human Escalation",
    expectedRecovery: 270000,
    expectedRecoveryLabel: "₹2.7L",
    interventionCost: 35000,
    interventionCostLabel: "₹35K",
    friction: "High",
    risk: "Low",
  },
];

export const mockGuardrails: Guardrail[] = [
  {
    id: "retries",
    label: "Maximum automatic retries",
    value: "2",
    description: "Hard declines are never retried. Soft declines get at most two spaced attempts.",
    status: "enforced",
  },
  {
    id: "contacts",
    label: "Maximum customer contacts",
    value: "2 / 24 hours",
    description: "Across email, SMS and WhatsApp combined, per customer.",
    status: "enforced",
  },
  {
    id: "discount",
    label: "Maximum discount",
    value: "10%",
    description: "Incentives are only offered when expected recovery lift exceeds the discount cost.",
    status: "enforced",
  },
  {
    id: "high_value",
    label: "High-value transaction threshold",
    value: "₹50,000",
    description: "Opportunities above this amount are routed for human review before execution.",
    status: "active",
  },
  {
    id: "approval",
    label: "Human approval",
    value: "Required",
    description: "Mandatory for high-value interventions and any human escalation strategy.",
    status: "active",
  },
  {
    id: "fraud",
    label: "Fraud / risk signal",
    value: "Auto-recovery disabled",
    description: "Velocity anomalies, device mismatch or blocklist hits disable automation entirely.",
    status: "monitoring",
  },
];
