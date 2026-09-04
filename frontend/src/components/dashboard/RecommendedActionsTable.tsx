import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { ConfidenceMeter, OpportunityStatusBadge } from "@/components/common/Badges";
import { formatINR } from "@/lib/format";
import { executeRecovery } from "@/services/api";
import type { RecommendedAction } from "@/types";

export function RecommendedActionsTable({
  actions,
  onReview,
}: {
  actions: RecommendedAction[];
  onReview: (id: string) => void;
}) {
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  const approve = async (a: RecommendedAction) => {
    setApproved((p) => ({ ...p, [a.id]: true }));
    await executeRecovery(a.id);
    toast.success(`Recovery approved for ${a.customer}`, {
      description: `${a.recommendation} · expected ${formatINR(a.expectedRecovery)}`,
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {[
              "Customer",
              "Amount",
              "Issue",
              "AI Recommendation",
              "Confidence",
              "Expected Recovery",
              "Status",
              "",
            ].map((h) => (
              <th
                key={h}
                className="px-5 py-2.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {actions.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-surface-muted">
              <td className="px-5 py-3 font-medium text-foreground">{a.customer}</td>
              <td className="num px-5 py-3 text-foreground">{formatINR(a.amount)}</td>
              <td className="px-5 py-3 text-muted-foreground">{a.issue}</td>
              <td className="px-5 py-3 text-foreground">{a.recommendation}</td>
              <td className="px-5 py-3">
                <ConfidenceMeter value={a.confidence} />
              </td>
              <td className="num px-5 py-3 font-medium text-success">
                {formatINR(a.expectedRecovery)}
              </td>
              <td className="px-5 py-3">
                <OpportunityStatusBadge status={approved[a.id] ? "approved" : a.status} />
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onReview(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Eye className="size-3.5" /> Review
                  </button>
                  <button
                    type="button"
                    disabled={approved[a.id]}
                    onClick={() => void approve(a)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Check className="size-3.5" /> {approved[a.id] ? "Approved" : "Approve"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
