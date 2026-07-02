import DashboardLayout from "@/components/DashboardLayout";
import { Users, Activity, AlertTriangle, Baby, TrendingUp, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface UserRecord {
  id: number;
  name: string;
  role: string;
  healthCenter?: { id: number; name: string };
}

interface ChildRecord {
  id: number;
  name: string;
  chw?: { id: number };
}

interface AssessmentRecord {
  id: number;
  date: string;
  status: string;
  child: {
    healthCenterId: number;
  };
  chw?: { id: number };
  prediction?: { riskLevel: string };
}

interface CHWStats {
  id: number;
  name: string;
  submissions: number;
  children: number;
  lastActive: string;
  lateSubmissions: number;
  highRiskPending: number;
  childrenNames: string[];
}

export default function NurseCHWMonitoring() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const center = user?.healthCenter || "";
  const [search, setSearch] = useState("");
  const [chws, setChws] = useState<CHWStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCHWData = async () => {
      if (!token || !center) return;
      setLoading(true);

      try {
        const [usersRes, childrenRes, assessmentsRes] = await Promise.all([
          fetch(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/child`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/assessment`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const users: UserRecord[] = usersRes.ok ? await usersRes.json() : [];
        const children: ChildRecord[] = childrenRes.ok ? await childrenRes.json() : [];
        const assessments: AssessmentRecord[] = assessmentsRes.ok ? await assessmentsRes.json() : [];

        const centerCHWs = users.filter(
          (u) => u.role === 'CHW' && u.healthCenter?.name === center,
        );

        const stats = centerCHWs.map((chw) => {
          const assignedChildren = children.filter((child) => child.chw?.id === chw.id);
          const chwAssessments = assessments.filter((assessment) => assessment.chw?.id === chw.id);
          const pendingAssessments = chwAssessments.filter((assessment) => assessment.status === 'PENDING');

          const lastAssessment = chwAssessments.reduce((latest, assessment) => {
            if (!latest) return assessment;
            return new Date(assessment.date) > new Date(latest.date) ? assessment : latest;
          }, null as AssessmentRecord | null);

          const lateSubmissions = pendingAssessments.filter((assessment) => {
            const ageMs = Date.now() - new Date(assessment.date).getTime();
            return ageMs > 7 * 24 * 60 * 60 * 1000;
          }).length;

          return {
            id: chw.id,
            name: chw.name,
            submissions: chwAssessments.length,
            children: assignedChildren.length,
            lastActive: lastAssessment ? new Date(lastAssessment.date).toLocaleDateString() : t('nurse.no_activity'),
            lateSubmissions,
            highRiskPending: pendingAssessments.filter((assessment) => assessment.prediction?.riskLevel === 'high').length,
            childrenNames: assignedChildren.map((child) => child.name).slice(0, 10),
          };
        });

        setChws(stats);
      } catch (error) {
        console.error('Failed to load CHW monitoring data:', error);
        setChws([]);
      } finally {
        setLoading(false);
      }
    };

    loadCHWData();
  }, [API_URL, center, token, t]);

  const filtered = useMemo(
    () => chws.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.childrenNames.some((n) => n.toLowerCase().includes(search.toLowerCase())),
    ),
    [chws, search],
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">CHW OVERSIGHT</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('nav.chw_monitoring', 'CHW Monitoring')}
              </h1>
              <p className="text-white/90 text-lg">
                {center ? t('nurse.health_center_label', { center }) : t('nurse.chw_monitoring_desc', 'Monitor community health worker performance and activity')}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                placeholder={t('common.search', 'Search CHWs or children...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-300 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4 animate-pulse">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t('nurse.no_chws_found', 'No CHWs found')}</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filtered.map((c) => (
                <div key={c.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Activity className="h-4 w-4 text-slate-500" />
                          <p className="text-sm text-slate-600">{t('nurse.last_active', { date: c.lastActive })}</p>
                        </div>
                      </div>
                    </div>
                    {c.lateSubmissions > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-xl border-2 border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        {t('nurse.late_submissions_count', { count: c.lateSubmissions })} late
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('nurse.submissions')}</p>
                        <p className="text-2xl font-bold text-slate-900">{c.submissions}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                        <Baby className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('admin.children')}</p>
                        <p className="text-2xl font-bold text-slate-900">{c.children}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('nurse.late_submissions', 'Late')}</p>
                        <p className={`text-2xl font-bold ${c.lateSubmissions > 0 ? "text-red-600" : "text-emerald-600"}`}>{c.lateSubmissions}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                      <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center shadow-md">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('nurse.high_risk_pending', 'High Risk')}</p>
                        <p className={`text-2xl font-bold ${c.highRiskPending > 0 ? "text-red-600" : "text-emerald-600"}`}>{c.highRiskPending}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Children */}
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Baby className="h-4 w-4 text-blue-600" />
                      {t('nurse.children_assigned', 'Children Assigned')} ({c.childrenNames.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.childrenNames.map((n) => (
                        <span key={n} className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
