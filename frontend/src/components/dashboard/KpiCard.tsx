import { TrendingDown, TrendingUp } from "lucide-react";
import { InfoHint } from "@/components/common/Badges";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/types";

const toneBar: Record<NonNullable<Kpi["tone"]>, string> = {
  risk: "bg-danger",
  recoverable: "bg-warning",
  recovered: "bg-success",
  rate: "bg-info",
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Trend = kpi.trend?.direction === "down" ? TrendingDown : TrendingUp;
  const trendTone =
    kpi.trend?.direction === "down"
      ? kpi.tone === "risk"
        ? "text-success"
        : "text-danger"
      : kpi.tone === "risk"
        ? "text-danger"
        : "text-success";

  return (
    <div className="panel relative overflow-hidden p-5">
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", kpi.tone ? toneBar[kpi.tone] : "bg-border")}
      />
      <div className="flex items-center gap-1.5">
        <span className="section-label">{kpi.label}</span>
        {kpi.tooltip ? <InfoHint text={kpi.tooltip} /> : null}
      </div>
      <div className="num mt-3 text-[1.75rem] leading-none font-semibold tracking-tight text-foreground">
        {kpi.value}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {kpi.trend ? (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendTone)}>
            <Trend className="size-3.5" />
            {kpi.trend.value}
            <span className="font-normal text-muted-foreground">{kpi.trend.label}</span>
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{kpi.sublabel}</p>
    </div>
  );
}
