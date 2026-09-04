import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import {
  AgentStatusCard,
  GuardrailsCard,
  RecoveryQueue,
  RecoverySimulator,
  RecoveryStrategyPipeline,
} from "@/components/agent/AgentSections";
import { OpportunityDrawer } from "@/components/opportunities/OpportunityDrawer";
import { useAgent } from "@/components/layout/agent-context";
import { getAgentStatus, getRecoveryQueue, getSimulatorStrategies, queryKeys } from "@/services/api";
import type { Opportunity } from "@/types";

const statusQuery = { queryKey: queryKeys.agentStatus, queryFn: getAgentStatus };
const queueQuery = { queryKey: queryKeys.recoveryQueue, queryFn: getRecoveryQueue };
const simulatorQuery = { queryKey: queryKeys.simulator, queryFn: getSimulatorStrategies };

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "AI Recovery Agent · REVIVE AI" },
      {
        name: "description",
        content:
          "Autonomous recovery decisions with financial guardrails, a live recovery queue and a strategy simulator.",
      },
      { property: "og:title", content: "AI Recovery Agent · REVIVE AI" },
      {
        property: "og:description",
        content: "Autonomous decision-making with built-in financial guardrails.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(statusQuery),
      context.queryClient.ensureQueryData(queueQuery),
      context.queryClient.ensureQueryData(simulatorQuery),
    ]);
  },
  component: AgentPage,
});

function AgentPage() {
  const { data: status } = useSuspenseQuery(statusQuery);
  const { data: queue } = useSuspenseQuery(queueQuery);
  const { data: strategies } = useSuspenseQuery(simulatorQuery);
  const { active, toggle } = useAgent();
  const [selected, setSelected] = useState<Opportunity | null>(null);

  return (
    <>
      <PageHeader
        title="AI Recovery Agent"
        subtitle="Autonomous decision-making with built-in financial guardrails."
      />

      <div className="space-y-6">
        <AgentStatusCard stats={status.stats} active={active} onToggle={toggle} />
        <RecoveryStrategyPipeline stages={status.pipeline} />
        <RecoveryQueue queue={queue} onReview={setSelected} />
        <RecoverySimulator strategies={strategies} />
        <GuardrailsCard guardrails={status.guardrails} />
      </div>

      <OpportunityDrawer
        opportunity={selected}
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </>
  );
}
