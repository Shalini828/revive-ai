import { createFileRoute } from "@tanstack/react-router";
import { Users, ShieldCheck, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";

export const Route = createFileRoute("/team-approvals")({
  component: TeamApprovalsPage,
});

function TeamApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Team & Approvals"
        subtitle="Manage recovery oversight and approval responsibilities."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Team"
            subtitle="People with access to this merchant workspace."
          />

          <PanelBody>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  NK
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Neha Kapoor
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Finance Operations
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                Owner
              </span>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Approval Controls"
            subtitle="Human oversight for sensitive recovery decisions."
          />

          <PanelBody className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <ShieldCheck className="size-5 text-success" />

              <div>
                <p className="text-sm font-medium">
                  High-value review
                </p>
                <p className="text-xs text-muted-foreground">
                  Transactions above ₹10,000 require additional review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <Clock3 className="size-5 text-warning" />

              <div>
                <p className="text-sm font-medium">
                  Human approval
                </p>
                <p className="text-xs text-muted-foreground">
                  Sensitive recovery actions can remain pending until
                  reviewed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <Users className="size-5 text-info" />

              <div>
                <p className="text-sm font-medium">
                  Audit visibility
                </p>
                <p className="text-xs text-muted-foreground">
                  Recovery decisions remain visible through the audit
                  trail.
                </p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}