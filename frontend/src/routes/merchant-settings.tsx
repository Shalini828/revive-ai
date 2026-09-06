import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, User, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Panel, PanelBody, PanelHeader } from "@/components/common/Panel";

export const Route = createFileRoute("/merchant-settings")({
  component: MerchantSettingsPage,
});

function MerchantSettingsPage() {
  return (
    <>
      <PageHeader
        title="Merchant Settings"
        subtitle="Manage your merchant profile and account configuration."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Merchant Profile"
            subtitle="Business information associated with this REVIVE workspace."
          />

          <PanelBody className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                AC
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  Acme Commerce
                </p>
                <p className="text-sm text-muted-foreground">
                  Merchant workspace
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Business name
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Acme Commerce
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Account owner
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Neha Kapoor
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Finance Operations
                  </p>
                </div>
              </div>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Security"
            subtitle="Security controls for this merchant workspace."
          />

          <PanelBody className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-success" />
                <div>
                  <p className="text-sm font-medium">
                    Authentication
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JWT-protected merchant access
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                Active
              </span>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                REVIVE AI workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Recovery decisions and account activity are protected
                through authenticated access and recorded in the audit
                trail.
              </p>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}