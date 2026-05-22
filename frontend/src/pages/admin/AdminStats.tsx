import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalHealthCenters: number;
  totalChildren: number;
  highRiskCount: number;
}

export default function AdminStats() {
  const { token } = useAuth();
  const { t } = useTranslation();
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
        { label: t('admin.total_users'), value: stats.totalUsers, sub: `${stats.pendingUsers} ${t('admin.pending')}` },
        { label: t('admin.health_centers'), value: stats.totalHealthCenters, sub: t('admin.across_network') },
        { label: t('admin.children_screened'), value: stats.totalChildren, sub: t('admin.total_assessments') },
        { label: t('admin.high_risk_cases'), value: stats.highRiskCount, sub: t('admin.priority_follow_up') },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title={t('admin.national_statistics')} description={t('admin.stats_desc')} />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : statsList.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.no_results')}</div>
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
