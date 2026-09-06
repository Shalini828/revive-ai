import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";

export const Route = createFileRoute("/recovery-policies")({
  component: RecoveryPoliciesPage,
});

const POLICIES = [
  {
    title: "Maximum recovery discount",
    value: "10%",
    description:
      "Recovery actions cannot apply more than a 10% customer discount.",
  },
  {
    title: "Maximum customer contacts",
    value: "2 contacts",
    description:
      "The recovery agent limits outreach to a maximum of two customer contacts.",
  },
  {
    title: "High-value transaction review",
    value: "₹10,000+",
    description:
      "High-value recovery opportunities require additional review before execution.",
  },
  {
    title: "Recovery eligibility",
    value: "Failed payments only",
    description:
      "Only failed transactions that have not already been recovered are eligible for recovery actions.",
  },
];

function RecoveryPoliciesPage() {
  return (
    <>
      <PageHeader
        title="Recovery Policies"
        subtitle="Financial and customer-safety guardrails governing REVIVE AI decisions."
      />

      <Panel>
        <PanelHeader
          title="Active Recovery Guardrails"
          subtitle="These policies constrain what the recovery agent can execute."
        />

        <PanelBody className="space-y-3">
          {POLICIES.map((policy) => (
            <div
              key={policy.title}
              className="flex items-start justify-between gap-5 rounded-xl border border-border p-4"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <ShieldCheck className="size-4 text-success" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {policy.title}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {policy.value}
                </span>

                <CheckCircle2 className="size-4 text-success" />
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </>
  );
}