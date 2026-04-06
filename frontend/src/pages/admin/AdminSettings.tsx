import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <PageHeader title="System Settings" description="Configure NutriGuard system parameters" />
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <p className="text-sm text-muted-foreground">
            System settings are managed by the backend and are not hardcoded in the UI.
            If you need to configure application settings, update them through the server configuration or a dedicated backend administration interface.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
