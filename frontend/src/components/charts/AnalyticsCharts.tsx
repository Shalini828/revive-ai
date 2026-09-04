import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame, chartAxis, tooltipStyle } from "./ChartFrame";
import { compactINR, formatINR } from "@/lib/format";
import type { AnalyticsData } from "@/types";

export function RecoveryTrendChart({ data }: { data: AnalyticsData["trend"] }) {
  return (
    <ChartFrame height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...chartAxis} />
          <YAxis {...chartAxis} tickFormatter={(v: number) => compactINR(v)} width={56} />
          <YAxis yAxisId="rate" orientation="right" {...chartAxis} unit="%" width={40} domain={[40, 80]} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value: number, name: string) =>
              name === "Recovery rate" ? [`${value}%`, name] : [formatINR(value), name]
            }
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--muted-foreground)" }}
          />
          <Bar dataKey="recoverable" name="Recoverable" fill="var(--warning)" radius={[4, 4, 0, 0]} barSize={18} />
          <Bar dataKey="recovered" name="Recovered" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={18} />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="rate"
            name="Recovery rate"
            stroke="var(--info)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RateByFailureTypeChart({ data }: { data: AnalyticsData["byFailureType"] }) {
  return (
    <ChartFrame height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" {...chartAxis} unit="%" domain={[0, 100]} />
          <YAxis type="category" dataKey="type" {...chartAxis} width={116} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Recovery rate"]} />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((d) => (
              <Cell
                key={d.type}
                fill={d.rate >= 70 ? "var(--success)" : d.rate >= 55 ? "var(--info)" : "var(--warning)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RecoveryByInterventionChart({ data }: { data: AnalyticsData["byIntervention"] }) {
  return (
    <ChartFrame height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="intervention" {...chartAxis} interval={0} angle={-12} textAnchor="end" height={54} />
          <YAxis {...chartAxis} tickFormatter={(v: number) => compactINR(v)} width={56} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [formatINR(v), "Recovered"]} />
          <Bar dataKey="recovered" fill="var(--info)" radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RecoveryBySegmentChart({ data }: { data: AnalyticsData["bySegment"] }) {
  const palette = ["var(--chart-4)", "var(--chart-3)", "var(--chart-2)", "var(--chart-5)", "var(--chart-1)"];
  return (
    <ChartFrame height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" {...chartAxis} tickFormatter={(v: number) => compactINR(v)} />
          <YAxis type="category" dataKey="segment" {...chartAxis} width={116} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [formatINR(v), "Recovered"]} />
          <Bar dataKey="recovered" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((d, i) => (
              <Cell key={d.segment} fill={palette[i % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
