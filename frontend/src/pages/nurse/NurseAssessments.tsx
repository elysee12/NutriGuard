import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, History, Search, X, Plus } from "lucide-react";
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
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title={t("assessment.review_assessments")}
          description={t("assessment.review_assessments_desc", "Review submitted forms and ML predictions")}
          actions={
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/nurse/assessments/new")}
                className="h-11 px-5 font-semibold bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("assessment.new_assessment")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistoryModal(true)}
                className="h-11 px-5 font-semibold"
              >
                <History className="h-4 w-4 mr-2" />
                Assessment History
              </Button>
            </div>
          }
        />

        <div className="bg-card rounded-xl border shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t("assessment.from")}</Label>
              <Input type="date" className="h-10" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("assessment.to")}</Label>
              <Input type="date" className="h-10" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>{t("location.sector")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
              <Label>{t("location.cell")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
              <Label>{t("location.village")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

        <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
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
                  <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td>
                </tr>
              ) : mainTableAssessments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">{t("dashboard.no_assessments")}</td>
                </tr>
              ) : (
                mainTableAssessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground align-top">{a.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.chw ? formatSubmittedBy(a.chw) : t("admin.unknown_user")}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.height}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.weight}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.muac}</td>
                    <td className="p-4 text-sm font-medium">{a.prediction?.result || t("dashboard.pending")}</td>
                    <td className="p-4"><RiskBadge level={a.prediction?.riskLevel || 'low'} /></td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${a.status === 'REVIEWED' ? 'text-success' : 'text-warning'}`}>
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
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        {t("dashboard.details")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 flex items-center justify-between border-b">
                <div>
                  <h2 className="text-2xl font-bold">Assessment History</h2>
                  <p className="text-primary-foreground/80 text-sm">Search for a child to view all their assessments</p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    clearHistorySelection();
                  }}
                  className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Search Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search for a child by name..."
                      className="pl-10 pr-10"
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
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    {/* Search Dropdown */}
                    {searchDropdownOpen && filteredChildren.length > 0 && !selectedHistoryChild && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredChildren.map(child => (
                          <div
                            key={child.id}
                            className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSelectChild(child)}
                          >
                            <p className="font-medium">{child.name}</p>
                            <p className="text-xs text-muted-foreground">{child.motherName} • {child.village}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedHistoryChild && (
                    <div className="bg-muted/20 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedHistoryChild.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedHistoryChild.motherName} • {selectedHistoryChild.village}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Table */}
                {selectedHistoryChild ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{t("assessment.all_assessments_for", "All Assessments for")} {selectedHistoryChild.name}</h3>
                      <span className="text-sm text-muted-foreground">{childHistoryAssessments.length} records</span>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full">
                        <thead className="table-header">
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
                              <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {childHistoryAssessments.map((a) => (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                              <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                              <td className="p-4 text-sm text-muted-foreground">{a.chw ? formatSubmittedBy(a.chw) : t("admin.unknown_user")}</td>
                              <td className="p-4 text-sm text-muted-foreground">{a.height}</td>
                              <td className="p-4 text-sm text-muted-foreground">{a.weight}</td>
                              <td className="p-4 text-sm text-muted-foreground">{a.muac}</td>
                              <td className="p-4 text-sm font-medium">{a.prediction?.result || t("dashboard.pending")}</td>
                              <td className="p-4"><RiskBadge level={a.prediction?.riskLevel || 'low'} /></td>
                              <td className="p-4">
                                <span className={`text-sm font-medium ${a.status === 'REVIEWED' ? 'text-success' : 'text-warning'}`}>
                                  {a.status === 'REVIEWED' ? t("dashboard.reviewed") : t("dashboard.pending")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">{t("assessment.search_to_view_history", "Search for a child to view their assessment history")}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-muted/50 border-t p-4 flex justify-end">
                <Button onClick={() => {
                  setShowHistoryModal(false);
                  clearHistorySelection();
                }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
