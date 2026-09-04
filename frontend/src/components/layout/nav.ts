import {
  Activity,
  BarChart3,
  Bot,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    title: "Revenue Recovery Overview",
    subtitle: "AI-powered recovery intelligence for your merchant account.",
  },
  {
    to: "/opportunities",
    label: "Revenue Opportunities",
    icon: Activity,
    title: "Revenue Opportunities",
    subtitle: "Prioritized opportunities identified by REVIVE AI.",
  },
  {
    to: "/agent",
    label: "AI Recovery Agent",
    icon: Bot,
    title: "AI Recovery Agent",
    subtitle: "Autonomous decision-making with built-in financial guardrails.",
  },
  {
    to: "/analytics",
    label: "Recovery Analytics",
    icon: BarChart3,
    title: "Recovery Analytics",
    subtitle: "Measured outcomes across every intervention the agent runs.",
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: ReceiptText,
    title: "Transactions",
    subtitle: "Every payment, checkout, subscription cycle and invoice in one ledger.",
  },
  {
    to: "/audit-logs",
    label: "Audit Logs",
    icon: ScrollText,
    title: "Audit Logs",
    subtitle: "Every AI decision and recovery action is traceable.",
  },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
