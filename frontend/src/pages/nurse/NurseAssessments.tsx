import DashboardLayout from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, History, Search, X, Plus, ClipboardList, Filter, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ChildDetailsModal from "@/components/ChildDetailsModal";
import { API_URL } from "@/lib/api";
import { getLatestPerChild, formatSubmittedBy } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AssessmentRecord {
  id: number;
  date: string;
  height: number;
  weight: number;
  muac: number;
  status: string;
  child: {
    id: number;
    name: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  chw?: { name: string };
  prediction?: { result: string; riskLevel: "low" | "moderate" | "high" };
}

interface ChildRecord {
  id: number;
  name: string;
  dob: string;
  gender: string;
  motherName: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  registeredAt: string;
}

export default function NurseAssessments() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedChildName, setSelectedChildName] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedHistoryChild, setSelectedHistoryChild] = useState<ChildRecord | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const [assessmentsRes, childrenRes] = await Promise.all([
          fetch(`${API_URL}/assessment`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/child`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json();
          setAssessments(data);
        }

        if (childrenRes.ok) {
          const data = await childrenRes.json();
          setChildren(data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [API_URL, token, t]);

  const sectors = useMemo(() => {
    return Array.from(new Set(assessments.map((a) => a.child.sector).filter(Boolean as any)));
  }, [assessments]);

  const cells = useMemo(() => {
    return Array.from(new Set(
      assessments
        .filter((a) => a.child.sector === sector)
        .map((a) => a.child.cell)
        .filter(Boolean as any),
    ));
  }, [assessments, sector]);

  const villages = useMemo(() => {
    return Array.from(new Set(
      assessments
        .filter((a) => a.child.cell === cell)
        .map((a) => a.child.village)
        .filter(Boolean as any),
    ));
  }, [assessments, cell]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (dateFrom && new Date(a.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.date) > new Date(dateTo)) return false;
      if (sector && a.child.sector !== sector) return false;
      if (cell && a.child.cell !== cell) return false;
      if (village && a.child.village !== village) return false;
      return true;
    });
  }, [assessments, dateFrom, dateTo, sector, cell, village]);

  // Only keep the latest assessment per child for the main table
  const mainTableAssessments = useMemo(() => {
    return getLatestPerChild(filteredAssessments);
  }, [filteredAssessments]);

  // Filter children for search dropdown
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return children.filter(child => 
      child.name.toLowerCase().includes(query)
    );
  }, [children, searchQuery]);

  const handleSelectChild = (child: ChildRecord) => {
    setSelectedHistoryChild(child);
    setSearchQuery(child.name);
    setSearchDropdownOpen(false);
  };

  const clearHistorySelection = () => {
    setSelectedHistoryChild(null);
    setSearchQuery("");
  };

  // Get filtered assessments for history table
  const childHistoryAssessments = useMemo(() => {
    if (!selectedHistoryChild) return [];
    return assessments
      .filter(a => a.child.id === selectedHistoryChild.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assessments, selectedHistoryChild]);

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
                <ClipboardList className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">ASSESSMENT REVIEW</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t("assessment.review_assessments", "Review Assessments")}
              </h1>
              <p className="text-white/90 text-lg mb-6">
                {t("assessment.review_assessments_desc", "Review submitted forms and ML predictions")}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate("/nurse/assessments/new")}
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-white/90 shadow-xl font-bold h-12 px-6 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t("assessment.new_assessment")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowHistoryModal(true)}
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur font-bold h-12 px-6 rounded-xl"
                >
                  <History className="h-5 w-5 mr-2" />
                  Assessment History
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                <Filter className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Filter Assessments</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {t("assessment.from")}
                </Label>
                <Input type="date" className="h-11 border-slate-300 focus-visible:ring-blue-500" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {t("assessment.to")}
                </Label>
                <Input type="date" className="h-11 border-slate-300 focus-visible:ring-blue-500" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-900">{t("location.sector")}</Label>
                <select
                  className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value);
                    setCell("");
                    setVillage("");
                  }}
                >
                  <option value="">{t("assessment.all")}</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-900">{t("location.cell")}</Label>
                <select
                  className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={cell}
                  onChange={(e) => {
                    setCell(e.target.value);
                    setVillage("");
                  }}
                >
                  <option value="">{t("assessment.all")}</option>
                  {cells.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-900">{t("location.village")}</Label>
                <select
                  className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                >
                  <option value="">{t("assessment.all")}</option>
                  {villages.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4 animate-pulse">
                <ClipboardList className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t("common.loading")}</p>
            </div>
          ) : mainTableAssessments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4">
                <ClipboardList className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t("dashboard.no_assessments")}</p>
              <p className="text-slate-500 text-sm mt-1">No assessments match your filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shadow-lg">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Assessment Records</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Showing {mainTableAssessments.length} latest assessment{mainTableAssessments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {[
                        t("common.child"),
                        "Assessed By",
                        t("common.date"),
                        `${t("assessment.height_cm")} (cm)`,
                        `${t("assessment.weight_kg")} (kg)`,
                        t("assessment.muac_mm"),
                        t("dashboard.ml_prediction"),
                        t("dashboard.risk_level"),
                        t("common.status"),
                        ""
                      ].map((h) => (
                        <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mainTableAssessments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                              <span className="text-blue-700 font-bold text-sm">{a.child.name[0]}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{a.child.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{a.chw ? formatSubmittedBy(a.chw) : t("admin.unknown_user")}</td>
                        <td className="p-4 text-sm text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-slate-600 font-medium">{a.height}</td>
                        <td className="p-4 text-sm text-slate-600 font-medium">{a.weight}</td>
                        <td className="p-4 text-sm text-slate-600 font-medium">{a.muac}</td>
                        <td className="p-4 text-sm font-bold text-slate-900">{a.prediction?.result || t("dashboard.pending")}</td>
                        <td className="p-4"><RiskBadge level={a.prediction?.riskLevel || 'low'} /></td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                            a.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {a.status === 'REVIEWED' ? t("dashboard.reviewed") : t("dashboard.pending")}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedChildId(a.child.id);
                              setSelectedChildName(a.child.name);
                              setSelectedAssessmentId(a.id);
                            }}
                            className="h-9 rounded-lg font-bold border-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t("dashboard.details")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Child Details Modal */}
        {selectedChildId !== null && (
          <ChildDetailsModal
            key={`${selectedChildId}-${selectedAssessmentId}`}
            childId={selectedChildId}
            childName={selectedChildName}
            assessmentId={selectedAssessmentId}
            onClose={() => {
              setSelectedChildId(null);
              setSelectedChildName("");
              setSelectedAssessmentId(null);
            }}
            token={token}
            apiUrl={API_URL}
          />
        )}

        {/* Assessment History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 text-white p-6 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold">Assessment History</h2>
                  <p className="text-white/80 text-sm mt-1">Search for a child to view all their assessments</p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    clearHistorySelection();
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Search Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search for a child by name..."
                      className="pl-12 pr-12 h-12 border-2 border-slate-300 focus-visible:ring-blue-500 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchDropdownOpen(true);
                      }}
                      onFocus={() => setSearchDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
                    />
                    {selectedHistoryChild && (
                      <button
                        onClick={clearHistorySelection}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    {/* Search Dropdown */}
                    {searchDropdownOpen && filteredChildren.length > 0 && !selectedHistoryChild && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                        {filteredChildren.map(child => (
                          <div
                            key={child.id}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0"
                            onClick={() => handleSelectChild(child)}
                          >
                            <p className="font-bold text-slate-900">{child.name}</p>
                            <p className="text-xs text-slate-600">{child.motherName} • {child.village}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedHistoryChild && (
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-lg">{selectedHistoryChild.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{selectedHistoryChild.name}</p>
                          <p className="text-sm text-slate-600">{selectedHistoryChild.motherName} • {selectedHistoryChild.village}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Table */}
                {selectedHistoryChild && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg">{t("assessment.all_assessments_for", "All Assessments for")} {selectedHistoryChild.name}</h3>
                      <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-200">{childHistoryAssessments.length} records</span>
                    </div>
                    <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b-2 border-slate-200">
                          <tr>
                            {[
                              t("common.date"),
                              "Assessed By",
                              `${t("assessment.height_cm")} (cm)`,
                              `${t("assessment.weight_kg")} (kg)`,
                              t("assessment.muac_mm"),
                              t("dashboard.ml_prediction"),
                              t("dashboard.risk_level"),
                              t("common.status")
                            ].map((h) => (
                              <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {childHistoryAssessments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-sm text-slate-600 font-medium">{new Date(a.date).toLocaleDateString()}</td>
                              <td className="p-4 text-sm text-slate-600">{a.chw ? formatSubmittedBy(a.chw) : t("admin.unknown_user")}</td>
                              <td className="p-4 text-sm text-slate-600 font-medium">{a.height}</td>
                              <td className="p-4 text-sm text-slate-600 font-medium">{a.weight}</td>
                              <td className="p-4 text-sm text-slate-600 font-medium">{a.muac}</td>
                              <td className="p-4 text-sm font-bold text-slate-900">{a.prediction?.result || t("dashboard.pending")}</td>
                              <td className="p-4"><RiskBadge level={a.prediction?.riskLevel || 'low'} /></td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  a.status === 'REVIEWED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {a.status === 'REVIEWED' ? t("dashboard.reviewed") : t("dashboard.pending")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t-2 border-slate-200 p-4 flex justify-end rounded-b-2xl">
                <Button onClick={() => {
                  setShowHistoryModal(false);
                  clearHistorySelection();
                }} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 h-11 rounded-xl font-bold">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
