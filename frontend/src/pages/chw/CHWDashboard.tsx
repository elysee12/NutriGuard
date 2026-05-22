import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, RiskBadge, PageHeader } from "@/components/DashboardComponents";
import { Baby, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const center = user?.healthCenter || "";

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
          const filteredAssessments = user?.role === "CHW"
            ? assessments.filter((a: Assessment) => a.chw?.id === user.id)
            : assessments;
          setRecentAssessments(filteredAssessments.slice(0, 5));
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
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title={`${user?.role} ${t('nav.dashboard')}`}
          description={`${t('dashboard.welcome_back')}, ${user?.name || ""}${center ? ` — ${center}` : ""}`}
          actions={
            <Button onClick={() => navigate("/chw/register")} className="font-semibold">
              <Baby className="h-4 w-4 mr-2" />
              {t('nav.register_child')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title={t('dashboard.children_registered')} value={stats?.totalChildren || 0} icon={<Baby className="h-6 w-6" />} />
          <StatCard title={t('dashboard.assessments')} value={stats?.totalAssessments || 0} icon={<ClipboardList className="h-6 w-6" />} />
          <StatCard title={t('dashboard.high_risk_cases')} value={stats?.highRiskCount || 0} icon={<AlertTriangle className="h-6 w-6" />} changeType="negative" />
          <StatCard title={t('dashboard.follow_up_rate')} value={stats?.followUpRate || "0%"} icon={<TrendingUp className="h-6 w-6" />} changeType="positive" />
        </div>

        {/* Recent Assessments */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-card-foreground">{t('dashboard.recent_assessments')}</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/chw/results")}>
              {t('dashboard.view_all')}
            </Button>
          </div>
          
          {/* Mobile View: Card List */}
          <div className="block sm:hidden divide-y">
            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('dashboard.no_assessments')}</div>
            ) : (
              recentAssessments.map((a) => (
                <div key={a.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{a.child.name}</p>
                      <p className="text-xs text-muted-foreground">{calculateAge(a.child.dob)} • {new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    <RiskBadge level={a.prediction?.riskLevel || "low"} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${a.status === "REVIEWED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
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
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('dashboard.child')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('dashboard.age')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('common.date')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('dashboard.risk_level')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('common.status')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">{t('dashboard.no_assessments')}</td>
                  </tr>
                ) : (
                  recentAssessments.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{a.child.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{calculateAge(a.child.dob)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <RiskBadge level={a.prediction?.riskLevel || "low"} />
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${a.status === "REVIEWED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {a.status === "REVIEWED" ? t('dashboard.reviewed') : t('dashboard.pending')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="h-8 text-primary font-bold" onClick={() => navigate(`/chw/results`)}>
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
