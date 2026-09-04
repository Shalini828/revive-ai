import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";
import { Pill } from "@/components/common/Badges";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/format";
import { getAuditLogs, queryKeys } from "@/services/api";
import type { AuditLogEntry } from "@/types";

const auditQuery = { queryKey: queryKeys.auditLogs, queryFn: getAuditLogs };

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs · REVIVE AI" },
      {
        name: "description",
        content:
          "A complete, immutable record of every AI analysis, decision, guardrail check and recovery outcome.",
      },
      { property: "og:title", content: "Audit Logs · REVIVE AI" },
      {
        property: "og:description",
        content: "Every AI and human decision, recorded for compliance review.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(auditQuery);
  },
  component: AuditLogsPage,
});

const resultTone = {
  Pending: "neutral",
  Approved: "info",
  Executed: "info",
  Recovered: "success",
  Blocked: "danger",
  Failed: "danger",
} as const;

const typeTone = {
  analysis: "neutral",
  decision: "info",
  execution: "warning",
  guardrail: "danger",
  outcome: "success",
} as const;

function AuditLogsPage() {
  const { data } = useSuspenseQuery(auditQuery);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [actor, setActor] = useState("all");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((e) => {
      if (type !== "all" && e.eventType !== type) return false;
      if (actor !== "all" && e.actor !== actor) return false;
      if (!q) return true;
      return (
        e.entity.toLowerCase().includes(q) ||
        e.event.toLowerCase().includes(q) ||
        e.decision.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q)
      );
    });
  }, [data, query, type, actor]);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="An immutable record of every decision the agent and your team made."
        actions={
          <button
            type="button"
            onClick={() =>
              toast.success("Audit export queued", {
                description: `${rows.length} entries will be exported for compliance review.`,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" /> Export log
          </button>
        }
      />

      <Panel>
        <PanelHeader
          title={`${rows.length} events`}
          subtitle="Newest first · retained for 7 years"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entity, event, decision"
                  className="h-9 w-60 rounded-lg border border-border bg-surface pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="all">All event types</option>
                <option value="analysis">Analysis</option>
                <option value="decision">Decision</option>
                <option value="execution">Execution</option>
                <option value="guardrail">Guardrail</option>
                <option value="outcome">Outcome</option>
              </select>
              <select
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="all">All actors</option>
                <option value="REVIVE AI">REVIVE AI</option>
                <option value="Human">Human</option>
              </select>
            </div>
          }
        />
        <PanelBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  <th className="py-2.5 pr-4 pl-5">Timestamp</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Event</th>
                  <th className="px-4 py-2.5">Decision</th>
                  <th className="px-4 py-2.5">Action taken</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5 pr-5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted"
                  >
                    <td className="num py-3 pr-4 pl-5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(e.timestamp)}
                    </td>
                    <td className="num px-4 py-3 font-medium text-foreground">{e.entity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Pill tone={typeTone[e.eventType]}>{e.eventType}</Pill>
                        <span className="text-foreground">{e.event}</span>
                      </div>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-muted-foreground">{e.decision}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.action}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {e.actor === "REVIVE AI" ? (
                          <Sparkles className="size-3.5 text-info" />
                        ) : (
                          <User className="size-3.5 text-muted-foreground" />
                        )}
                        <span className="text-foreground">{e.actorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <Pill tone={resultTone[e.result]} dot>
                        {e.result}
                      </Pill>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      No audit events match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </PanelBody>
      </Panel>

      <Sheet open={selected !== null} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-base">{selected.event}</SheetTitle>
                <SheetDescription className="num">
                  {selected.entity} · {formatDateTime(selected.timestamp)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="flex flex-wrap gap-2">
                  <Pill tone={typeTone[selected.eventType]}>{selected.eventType}</Pill>
                  <Pill tone={resultTone[selected.result]} dot>
                    {selected.result}
                  </Pill>
                  <Pill tone="neutral">{selected.actorName}</Pill>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="section-label">Decision</p>
                  <p className="mt-1.5 text-sm text-foreground">{selected.decision}</p>
                </div>
                <div className="rounded-xl border border-info/25 bg-info-soft p-4">
                  <p className="section-label text-info">Reasoning trace</p>
                  <p className="mt-1.5 text-sm text-foreground">{selected.detail}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="section-label">Action taken</p>
                  <p className="mt-1.5 text-sm text-foreground">{selected.action}</p>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
