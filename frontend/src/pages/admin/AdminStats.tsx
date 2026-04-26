import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalHealthCenters: number;
  totalChildren: number;
  highRiskCount: number;
}

export default function AdminStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, API_URL]);

  const statsList = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, sub: `${stats.pendingUsers} pending` },
        { label: "Health Centers", value: stats.totalHealthCenters, sub: "Across the network" },
        { label: "Children Screened", value: stats.totalChildren, sub: "Total assessments submitted" },
        { label: "High Risk Cases", value: stats.highRiskCount, sub: "Priority follow-up required" },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title="National Statistics" description="Overview of stunting indicators across Rwanda" />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading statistics…</div>
        ) : statsList.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">No statistics available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsList.map((item) => (
              <div key={item.label} className="stat-card text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">{item.label}</p>
                <p className="text-4xl font-display font-bold text-primary">{item.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
