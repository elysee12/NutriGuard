import DashboardLayout from "@/components/DashboardLayout";
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.good_morning', 'GOOD MORNING');
    if (hour < 18) return t('dashboard.good_afternoon', 'GOOD AFTERNOON');
    return t('dashboard.good_evening', 'GOOD EVENING');
  };

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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Baby className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">{getGreeting()}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                Welcome, {user?.name?.split(' ')[0] || 'CHW'}.
              </h1>
              <p className="text-white/90 text-lg mb-6">
                {center ? `${center} — Community Health Worker Dashboard` : "Community Health Worker Dashboard"}
              </p>
              
              <Button 
                onClick={() => navigate("/chw/register")} 
                size="lg"
                className="bg-white text-teal-600 hover:bg-white/90 shadow-xl font-bold h-12 px-6 rounded-xl"
              >
                <Baby className="h-5 w-5 mr-2" />
                {t('nav.register_child')}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Total Assessments */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  Total
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalAssessments || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.assessments')}</p>
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

            {/* Follow-up Rate */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Rate
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.followUpRate || "0%"}</p>
              <p className="text-sm text-slate-600 font-medium">{t('dashboard.follow_up_rate')}</p>
            </div>
          </div>

          {/* Recent Assessments Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('dashboard.recent_assessments')}</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Latest health screenings conducted</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/chw/results")} 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg font-bold rounded-xl"
                >
                  {t('dashboard.view_all')}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[t('dashboard.child'), t('dashboard.age'), t('common.date'), t('dashboard.risk_level'), t('common.status'), t('common.actions')].map((h) => (
                      <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                            <Baby className="h-5 w-5 text-teal-700" />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{a.child.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{calculateAge(a.child.dob)}</td>
                      <td className="p-4 text-sm text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getRiskBadgeStyles(a.prediction?.riskLevel || 'low')}`}>
                          {(a.prediction?.riskLevel || 'low').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${a.status === "REVIEWED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {a.status === "REVIEWED" ? t('dashboard.reviewed') : t('dashboard.pending')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/chw/results`)} 
                          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md"
                        >
                          {t('dashboard.details')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {recentAssessments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16">
                        <div className="text-center">
                          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4">
                            <ClipboardList className="h-10 w-10 text-teal-600" />
                          </div>
                          <p className="text-slate-600 font-semibold text-lg">{t('dashboard.no_assessments')}</p>
                          <p className="text-slate-500 text-sm mt-1">Start by registering children and conducting assessments</p>
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
