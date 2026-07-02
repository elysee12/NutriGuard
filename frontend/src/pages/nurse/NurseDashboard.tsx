import DashboardLayout from "@/components/DashboardLayout";
import { Users, Baby, AlertTriangle, ClipboardList, Plus, TrendingUp, Calendar, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { getLatestPerChild, formatSubmittedBy } from "@/lib/utils";
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
          const pendingAssessments = assessments.filter((a: any) => a.status === 'PENDING');
          const latestPending = getLatestPerChild(pendingAssessments);
          setPendingReviews(latestPending.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  const processedReviews = useMemo(() => {
    return pendingReviews.map(r => ({ ...r, isFirst: true, rowspan: 1 }));
  }, [pendingReviews]);

  const getRiskBadgeStyles = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.good_morning', 'GOOD MORNING');
    if (hour < 18) return t('dashboard.good_afternoon', 'GOOD AFTERNOON');
    return t('dashboard.good_evening', 'GOOD EVENING');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-primary via-teal-600 to-primary rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">{getGreeting()}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                Welcome, {user?.name?.split(' ')[0] || 'Nurse'}.
              </h1>
              <p className="text-white/90 text-lg mb-6">
                {center ? `${center} — ${t('common.monitoring_review')}` : t('common.monitoring_review')}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => navigate("/nurse/register-child")} 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl font-bold h-12 px-6 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t('nav.register_child')}
                </Button>
                <Button 
                  onClick={() => navigate("/nurse/assessments/new")} 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur font-bold h-12 px-6 rounded-xl"
                >
                  <ClipboardList className="h-5 w-5 mr-2" />
                  {t('assessment.new_assessment')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CHWs Supervised */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  <Award className="h-3 w-3 inline mr-1" />
                  Team
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalCHWs || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.chws_supervised')}</p>
            </div>

            {/* Children Registered */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Baby className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Active
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalChildren || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.children_registered')}</p>
            </div>

            {/* Pending Reviews */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Urgent
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.pendingReviews || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.pending_reviews')}</p>
            </div>

            {/* High Risk Cases */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                  Critical
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.highRiskCount || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.high_risk_cases')}</p>
            </div>
          </div>

          {/* Pending Reviews Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('dashboard.pending_reviews')}</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Assessments requiring your review</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/nurse/assessments")} 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg font-bold rounded-xl"
                >
                  {t('dashboard.view_all')}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[t('common.name'), t('dashboard.submitted_by'), t('common.date'), t('dashboard.ml_prediction'), t('dashboard.risk_level'), t('common.actions')].map((h) => (
                      <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                            <Baby className="h-5 w-5 text-teal-700" />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{r.child.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{formatSubmittedBy(r.chw)}</td>
                      <td className="p-4 text-sm text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-900">{r.prediction?.result}</span>
                        <span className="text-xs text-slate-500 ml-1">({Math.round(r.prediction?.riskScore)}%)</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getRiskBadgeStyles(r.prediction?.riskLevel || 'low')}`}>
                          {r.prediction?.riskLevel?.toUpperCase() || 'LOW'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/nurse/assessments/${r.id}`)} 
                          className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white font-bold rounded-lg shadow-md"
                        >
                          {t('dashboard.review')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {processedReviews.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16">
                        <div className="text-center">
                          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 items-center justify-center mb-4">
                            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-slate-600 font-semibold text-lg">{t('dashboard.no_pending_reviews')}</p>
                          <p className="text-slate-500 text-sm mt-1">All assessments have been reviewed</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
