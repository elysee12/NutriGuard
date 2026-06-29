import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, RiskBadge, PageHeader } from "@/components/DashboardComponents";
import { Users, Baby, AlertTriangle, ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { groupWithRowspan, getLatestPerChild, formatSubmittedBy } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PendingReview {
  id: number;
  child: { name: string; id?: number };
  chw: { name: string };
  date: string;
  prediction: { result: string; riskScore: number; riskLevel: "low" | "moderate" | "high" };
}

export default function NurseDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
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
          // Filter for pending assessments, keep only the latest per child
          const pendingAssessments = assessments.filter((a: any) => a.status === 'PENDING');
          const latestPending = getLatestPerChild(pendingAssessments);
          setPendingReviews(latestPending.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) fetchDashboardData();
  }, [token, API_URL]);

  const processedReviews = useMemo(() => {
    return pendingReviews.map(r => ({ ...r, isFirst: true, rowspan: 1 }));
  }, [pendingReviews]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          title={`Welcome, ${user?.name?.split(' ')[0] || 'Nurse'}.`}
          description={center ? `${center} — ${t('common.monitoring_review')}` : t('common.monitoring_review')}
          actions={
            <div className="flex gap-2">
              <Button onClick={() => navigate("/nurse/assessments/new")} variant="outline" className="font-bold gap-2">
                <ClipboardList className="h-5 w-5" />
                {t('assessment.new_assessment')}
              </Button>
              <Button onClick={() => navigate("/nurse/register-child")} className="font-bold gap-2">
                <Plus className="h-5 w-5" />
                {t('nav.register_child')}
              </Button>
            </div>
          }
        />

        {/* Premium Stats Grid */}
        <div className="data-grid mb-8">
          <StatCard title={t('dashboard.chws_supervised')} value={stats?.totalCHWs || 0} icon={<Users className="h-7 w-7" />} />
          <StatCard title={t('dashboard.children_registered')} value={stats?.totalChildren || 0} icon={<Baby className="h-7 w-7" />} />
          <StatCard title={t('dashboard.pending_reviews')} value={stats?.pendingReviews || 0} icon={<ClipboardList className="h-7 w-7" />} changeType="negative" />
          <StatCard title={t('dashboard.high_risk_cases')} value={stats?.highRiskCount || 0} icon={<AlertTriangle className="h-7 w-7" />} />
        </div>

        {/* Pending Reviews - Premium Card */}
        <div className="professional-card overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-warning/5 via-background to-background border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-card-foreground">{t('dashboard.pending_reviews')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Assessments requiring your review</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/nurse/assessments")} className="font-bold">
              {t('dashboard.view_all')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  {[t('common.name'), t('dashboard.submitted_by'), t('common.date'), t('dashboard.ml_prediction'), t('dashboard.risk_level'), t('common.actions')].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedReviews.map((r) => (
                  <tr key={r.id} className="table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Baby className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{r.child.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatSubmittedBy(r.chw)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-bold text-foreground">{r.prediction?.result} ({r.prediction?.riskScore}%)</td>
                    <td className="p-4"><RiskBadge level={r.prediction?.riskLevel || "low"} /></td>
                    <td className="p-4">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/nurse/assessments/${r.id}`)} className="h-9 font-bold">
                        {t('dashboard.review')}
                      </Button>
                    </td>
                  </tr>
                ))}
                {processedReviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground font-semibold">{t('dashboard.no_pending_reviews')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
