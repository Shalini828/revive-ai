import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame, chartAxis, tooltipStyle } from "./ChartFrame";
import { compactINR, formatINR } from "@/lib/format";
import type { LeakagePoint } from "@/types";

export function LeakageChart({ data }: { data: LeakagePoint[] }) {
  const shaped = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  }));

  return (
    <ChartFrame height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={shaped} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {[
              ["riskGrad", "var(--danger)"],
              ["recoverableGrad", "var(--warning)"],
              ["recoveredGrad", "var(--success)"],
            ].map(([id, color]) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...chartAxis} minTickGap={24} />
          <YAxis {...chartAxis} tickFormatter={(v: number) => compactINR(v)} width={56} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: number, name: string) => [formatINR(value), name]}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="atRisk"
            name="Revenue at Risk"
            stroke="var(--danger)"
            strokeWidth={2}
            fill="url(#riskGrad)"
          />
          <Area
            type="monotone"
            dataKey="recoverable"
            name="Recoverable Revenue"
            stroke="var(--warning)"
            strokeWidth={2}
            fill="url(#recoverableGrad)"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Recovered Revenue"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#recoveredGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
