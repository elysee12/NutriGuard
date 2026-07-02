import DashboardLayout from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Eye, BarChart3, TrendingUp, Plus, History, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChildDetailsModal from "@/components/ChildDetailsModal";
import { API_URL } from "@/lib/api";
import { groupWithRowspan, getLatestPerChild } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface ResultRecord {
  id: number;
  child: { id: number; name: string; dob: string };
  date: string;
  prediction?: { riskLevel: "low" | "moderate" | "high"; riskScore: number };
  status: string;
  chw?: { id: number; name: string };
  reviewedBy?: string;
  reviewedAt?: string;
}

export default function CHWResults() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [selectedChildForHistory, setSelectedChildForHistory] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/assessment`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(t('assessment.load_results_failed', "Unable to load prediction results"));
        }

        const data: ResultRecord[] = await response.json();
        // CHW should see ALL assessments for their assigned children (including nurse assessments)
        setResults(data);
      } catch (error) {
        console.error("Failed to load results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [API_URL, token, t]);

  // Only keep the latest assessment per child for the main view
  const latestResults = useMemo(() => {
    return getLatestPerChild(results);
  }, [results]);

  const processedResults = useMemo(() => {
    return latestResults.map(r => ({ ...r, isFirst: true, rowspan: 1 }));
  }, [latestResults]);

  const calculateAge = (dob: string) => {
    const diff = new Date().getTime() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    return `${months} ${t('dashboard.months')}`;
  };

  // Get unique children for history search
  const uniqueChildren = useMemo(() => {
    const childrenMap = new Map();
    results.forEach(r => {
      if (!childrenMap.has(r.child.id)) {
        childrenMap.set(r.child.id, { id: r.child.id, name: r.child.name });
      }
    });
    return Array.from(childrenMap.values());
  }, [results]);

  // Filter children by search query
  const filteredChildren = useMemo(() => {
    if (!historySearchQuery.trim()) return uniqueChildren;
    const query = historySearchQuery.toLowerCase();
    return uniqueChildren.filter(child => 
      child.name.toLowerCase().includes(query)
    );
  }, [uniqueChildren, historySearchQuery]);

  // Get all assessments for selected child (for history view)
  const childHistory = useMemo(() => {
    if (!selectedChildForHistory) return [];
    return results
      .filter(r => r.child.id === selectedChildForHistory.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [results, selectedChildForHistory]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-white/80" />
                  <span className="text-white/90 text-sm font-semibold tracking-wider">PREDICTION RESULTS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate('/chw/assessments')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm h-9 px-4 rounded-lg font-semibold shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Assessment
                  </Button>
                  <Button
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm h-9 px-4 rounded-lg font-semibold shadow-lg transition-all"
                  >
                    <History className="h-4 w-4 mr-1.5" />
                    Assessment History
                  </Button>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('nav.results', 'Assessment Results')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('assessment.view_all_results', "View all ML prediction results for your children")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Mobile View: Card List */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4 animate-pulse">
                    <BarChart3 className="h-8 w-8 text-teal-600" />
                  </div>
                  <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
                </div>
              ) : processedResults.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4">
                    <BarChart3 className="h-10 w-10 text-teal-600" />
                  </div>
                  <p className="text-slate-600 font-semibold text-lg">{t('dashboard.no_assessments')}</p>
                  <p className="text-slate-500 text-sm mt-1">No assessment results found</p>
                </div>
              ) : (
                processedResults.map((r) => (
                  <div key={r.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                          <span className="text-teal-700 font-bold text-sm">{r.child.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{r.child.name}</p>
                          <p className="text-xs text-slate-600">{calculateAge(r.child.dob)} • {new Date(r.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <RiskBadge level={r.prediction?.riskLevel || 'low'} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (r.prediction?.riskScore || 0) > 60
                              ? 'bg-red-500'
                              : (r.prediction?.riskScore || 0) > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${r.prediction?.riskScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{Math.round(r.prediction?.riskScore || 0)}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        r.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {r.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-teal-700 font-bold hover:bg-teal-50"
                        onClick={() => {
                          setSelectedChildId(r.child.id);
                          setSelectedChildName(r.child.name);
                          setSelectedAssessmentId(r.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t('dashboard.details')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Prediction Results</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Showing {processedResults.length} assessment result{processedResults.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {[t('dashboard.child'), t('dashboard.age'), t('common.date'), t('dashboard.risk_level'), t('dashboard.score'), t('common.status'), t('common.actions')].map((h) => (
                        <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4 animate-pulse">
                            <BarChart3 className="h-8 w-8 text-teal-600" />
                          </div>
                          <p className="text-slate-600 font-semibold block">{t('common.loading')}</p>
                        </td>
                      </tr>
                    ) : processedResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4">
                            <BarChart3 className="h-10 w-10 text-teal-600" />
                          </div>
                          <p className="text-slate-600 font-semibold text-lg block">{t('dashboard.no_assessments')}</p>
                        </td>
                      </tr>
                    ) : (
                      processedResults.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                                <span className="text-teal-700 font-bold text-sm">{r.child.name[0]}</span>
                              </div>
                              <span className="text-sm font-bold text-slate-900">{r.child.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{calculateAge(r.child.dob)}</td>
                          <td className="p-4 text-sm text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="p-4">
                            <RiskBadge level={r.prediction?.riskLevel || 'low'} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    (r.prediction?.riskScore || 0) > 60
                                      ? 'bg-red-500'
                                      : (r.prediction?.riskScore || 0) > 30
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${r.prediction?.riskScore ?? 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-slate-600">{Math.round(r.prediction?.riskScore || 0)}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                              r.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {r.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')}
                            </span>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChildId(r.child.id);
                                setSelectedChildName(r.child.name);
                                setSelectedAssessmentId(r.id);
                              }}
                              className="h-9 rounded-lg font-bold border-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
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
        </div>
      </div>
      {selectedChildId && token && (
        <ChildDetailsModal
          key={`${selectedChildId}-${selectedAssessmentId}`}
          token={token}
          apiUrl={API_URL}
          childId={selectedChildId}
          childName={selectedChildName}
          assessmentId={selectedAssessmentId}
          onClose={() => {
            setSelectedChildId(null);
            setSelectedChildName("");
            setSelectedAssessmentId(null);
          }}
        />
      )}

      {/* Assessment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Assessment History</h2>
                  <p className="text-white/80 text-sm">View all assessments by child</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistorySearchQuery("");
                  setSelectedChildForHistory(null);
                }}
                className="h-10 w-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {!selectedChildForHistory ? (
                /* Child Selection View */
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search child by name..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {filteredChildren.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-teal-600" />
                      </div>
                      <p className="text-slate-600 font-semibold">No children found</p>
                      <p className="text-slate-500 text-sm mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredChildren.map((child) => {
                        const assessmentCount = results.filter(r => r.child.id === child.id).length;
                        return (
                          <button
                            key={child.id}
                            onClick={() => setSelectedChildForHistory(child)}
                            className="p-4 border-2 border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-teal-700 font-bold text-lg">{child.name[0]}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{child.name}</p>
                                <p className="text-sm text-slate-600">{assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Assessment History View */
                <div className="flex-1 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedChildForHistory(null)}
                        className="h-9 w-9 rounded-lg border-2 border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
                      >
                        <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                        <span className="text-teal-700 font-bold">{selectedChildForHistory.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedChildForHistory.name}</p>
                        <p className="text-sm text-slate-600">{childHistory.length} assessment{childHistory.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {childHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 items-center justify-center mb-4">
                          <BarChart3 className="h-8 w-8 text-teal-600" />
                        </div>
                        <p className="text-slate-600 font-semibold">No assessments found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {childHistory.map((assessment, idx) => {
                          const isNurseAssessment = assessment.reviewedBy?.includes('Direct Submission');
                          const assessor = isNurseAssessment ? 'Nurse' : (assessment.chw?.name || 'CHW');
                          
                          return (
                            <div
                              key={assessment.id}
                              className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-teal-500 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <span className="text-slate-700 font-bold text-sm">#{childHistory.length - idx}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{new Date(assessment.date).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-600">By {assessor}</p>
                                  </div>
                                </div>
                                <RiskBadge level={assessment.prediction?.riskLevel || 'low'} />
                              </div>

                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 bg-slate-100 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      (assessment.prediction?.riskScore || 0) > 60
                                        ? 'bg-red-500'
                                        : (assessment.prediction?.riskScore || 0) > 30
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${assessment.prediction?.riskScore ?? 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-600 min-w-[3rem] text-right">
                                  {Math.round(assessment.prediction?.riskScore || 0)}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  assessment.status === 'REVIEWED' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {assessment.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedChildId(assessment.child.id);
                                    setSelectedChildName(assessment.child.name);
                                    setSelectedAssessmentId(assessment.id);
                                    setShowHistoryModal(false);
                                    setSelectedChildForHistory(null);
                                    setHistorySearchQuery("");
                                  }}
                                  className="h-8 text-teal-700 font-bold hover:bg-teal-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {t('dashboard.details')}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
