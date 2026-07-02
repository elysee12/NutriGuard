import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Users, Building2, Baby, AlertTriangle, TrendingUp } from "lucide-react";

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
        { 
          label: t('admin.total_users'), 
          value: stats.totalUsers, 
          sub: `${stats.pendingUsers} ${t('admin.pending')}`,
          icon: Users,
          gradient: 'from-purple-500 to-purple-600'
        },
        { 
          label: t('admin.health_centers'), 
          value: stats.totalHealthCenters, 
          sub: t('admin.across_network', 'Across Network'),
          icon: Building2,
          gradient: 'from-blue-500 to-blue-600'
        },
        { 
          label: t('admin.children_screened'), 
          value: stats.totalChildren, 
          sub: t('admin.total_assessments', 'Total Assessments'),
          icon: Baby,
          gradient: 'from-teal-500 to-emerald-600'
        },
        { 
          label: t('admin.high_risk_cases'), 
          value: stats.highRiskCount, 
          sub: t('admin.priority_follow_up', 'Priority Follow-up'),
          icon: AlertTriangle,
          gradient: 'from-red-500 to-rose-600'
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">NATIONAL OVERVIEW</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('admin.national_statistics', 'National Statistics')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('admin.stats_desc', 'Real-time overview of system-wide health metrics')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4 animate-pulse">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          ) : statsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4">
                <BarChart3 className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t('common.no_results')}</p>
              <p className="text-slate-500 text-sm mt-1">Statistics data unavailable</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsList.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-teal-500/10 text-primary text-xs font-bold">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Live
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-slate-900 mb-2">{item.value}</p>
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
