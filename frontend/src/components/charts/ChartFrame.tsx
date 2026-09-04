import { useHydrated } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Charts are measured client-side; skip them during SSR to avoid zero-width renders. */
export function ChartFrame({ height, children }: { height: number; children: ReactNode }) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return <div style={{ height }} className="w-full animate-pulse rounded-lg bg-surface-muted" />;
  }
  return (
    <div style={{ height }} className="w-full">
      {children}
    </div>
  );
}

export const chartAxis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const tooltipStyle = {
  contentStyle: {
    borderRadius: "0.625rem",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    boxShadow: "var(--shadow-raised)",
    fontSize: "12px",
    padding: "8px 10px",
  },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 4, fontSize: "11px" },
  itemStyle: { padding: 0 },
} as const;
