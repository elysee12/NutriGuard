import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, RiskBadge, PageHeader } from "@/components/DashboardComponents";
import { Baby, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLatestPerChild } from "@/lib/utils";

interface Assessment {
  id: number;
  child: { name: string; dob: string };
  date: string;
  prediction: { riskLevel: "low" | "moderate" | "high" };
  status: string;
  chw?: { id: number };
}

export default function CHWDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const center = user?.healthCenter || "";

  // Only keep the latest assessment per child
  const recentAssessments = useMemo(() => {
    const filteredAssessments = user?.role === "CHW"
      ? allAssessments.filter((a: Assessment) => a.chw?.id === user.id)
      : allAssessments;
    return getLatestPerChild(filteredAssessments).slice(0, 5);
  }, [allAssessments, user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, assessmentsRes] = await Promise.all([
          fetch(`${API_URL}/stats/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/assessment`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (assessmentsRes.ok) {
          const assessments = await assessmentsRes.json();
          setAllAssessments(assessments);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) fetchDashboardData();
  }, [token, API_URL, user]);

  const calculateAge = (dob: string) => {
    const diff = new Date().getTime() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    return `${months} ${t('dashboard.months')}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          title={`Welcome, ${user?.name?.split(' ')[0] || 'CHW'}.`}
          description={center ? `${center} — Community Health Worker Dashboard` : "Community Health Worker Dashboard"}
          actions={
            <Button onClick={() => navigate("/chw/register")} className="font-bold">
              <Baby className="h-5 w-5" />
              {t('nav.register_child')}
            </Button>
          }
        />

        {/* Premium Stats Grid */}
        <div className="data-grid mb-8">
          <StatCard title={t('dashboard.children_registered')} value={stats?.totalChildren || 0} icon={<Baby className="h-7 w-7" />} />
          <StatCard title={t('dashboard.assessments')} value={stats?.totalAssessments || 0} icon={<ClipboardList className="h-7 w-7" />} />
          <StatCard title={t('dashboard.high_risk_cases')} value={stats?.highRiskCount || 0} icon={<AlertTriangle className="h-7 w-7" />} changeType="negative" />
          <StatCard title={t('dashboard.follow_up_rate')} value={stats?.followUpRate || "0%"} icon={<TrendingUp className="h-7 w-7" />} changeType="positive" />
        </div>

        {/* Recent Assessments - Premium Card */}
        <div className="professional-card overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary/5 via-background to-background border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-card-foreground">{t('dashboard.recent_assessments')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Latest health screenings</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/chw/results")} className="font-bold">
              {t('dashboard.view_all')}
            </Button>
          </div>
          
          {/* Mobile View: Card List */}
          <div className="block sm:hidden divide-y">
            {recentAssessments.length === 0 ? (
              <div className="p-12">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <ClipboardList className="h-10 w-10" />
                  </div>
                  <p className="text-muted-foreground font-semibold">{t('dashboard.no_assessments')}</p>
                </div>
              </div>
            ) : (
              recentAssessments.map((a) => (
                <div key={a.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Baby className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{a.child.name}</p>
                        <p className="text-xs text-muted-foreground">{calculateAge(a.child.dob)} • {new Date(a.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <RiskBadge level={a.prediction?.riskLevel || "low"} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`premium-badge ${a.status === "REVIEWED" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                      {a.status === "REVIEWED" ? t('dashboard.reviewed') : t('dashboard.pending')}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 text-primary font-bold" onClick={() => navigate(`/chw/results`)}>
                      {t('dashboard.details')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('dashboard.child')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('dashboard.age')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.date')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('dashboard.risk_level')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.status')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <ClipboardList className="h-10 w-10" />
                        </div>
                        <p className="text-muted-foreground font-semibold">{t('dashboard.no_assessments')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentAssessments.map((a) => (
                    <tr key={a.id} className="table-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Baby className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-bold text-foreground">{a.child.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{calculateAge(a.child.dob)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <RiskBadge level={a.prediction?.riskLevel || "low"} />
                      </td>
                      <td className="p-4">
                        <span className={`premium-badge ${a.status === "REVIEWED" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {a.status === "REVIEWED" ? t('dashboard.reviewed') : t('dashboard.pending')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="h-9 text-primary font-bold" onClick={() => navigate(`/chw/results`)}>
                          {t('dashboard.details')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
