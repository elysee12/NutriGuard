import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ExportButton";
import { Download, Filter, X, Search, MapPin, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { getLatestPerChild, groupWithRowspan, formatSubmittedBy } from "@/lib/utils";
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
    dob: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  chw?: { name: string };
  prediction?: { result: string; riskLevel: "low" | "moderate" | "high"; riskScore: number };
}

interface ChildRecord {
  id: number;
  name: string;
  motherName: string;
  village: string;
}

type DateFilterType = "today" | "week" | "month" | "year" | "custom" | "all";

export default function NurseReports() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Date filtering
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Location filtering
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  // Child filtering
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Load data from backend
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
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [API_URL, token]);

  // Extract unique sectors, cells, villages from assessments
  const sectors = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.child.sector).filter(Boolean as any))),
    [assessments],
  );

  const cells = useMemo(
    () => Array.from(new Set(
      assessments
        .filter((a) => a.child.sector === sector)
        .map((a) => a.child.cell)
        .filter(Boolean as any),
    )),
    [assessments, sector],
  );

  const villages = useMemo(
    () => Array.from(new Set(
      assessments
        .filter((a) => a.child.cell === cell)
        .map((a) => a.child.village)
        .filter(Boolean as any),
    )),
    [assessments, cell],
  );

  // Calculate date range based on filter type
  const getDateRange = (): [Date, Date] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    switch (dateFilterType) {
      case "today":
        return [today, new Date(today.getTime() + 24 * 60 * 60 * 1000)];

      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        return [weekStart, weekEnd];
      }

      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return [monthStart, monthEnd];
      }

      case "year": {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
        return [yearStart, yearEnd];
      }

      case "custom":
        return [
          customDateFrom ? new Date(customDateFrom) : new Date(1970, 0, 1),
          customDateTo ? new Date(customDateTo) : new Date(2100, 0, 1),
        ];

      default:
        return [new Date(1970, 0, 1), now];
    }
  };

  // Filter assessments by date, location, and child
  const filteredAssessments = useMemo(() => {
    const [dateStart, dateEnd] = getDateRange();

    return assessments.filter((a) => {
      // Date filter (only if not "all")
      if (dateFilterType !== "all") {
        const assessmentDate = new Date(a.date);
        if (assessmentDate < dateStart || assessmentDate > dateEnd) return false;
      }

      // Location filters
      if (sector && a.child.sector !== sector) return false;
      if (cell && a.child.cell !== cell) return false;
      if (village && a.child.village !== village) return false;

      // Child filter
      if (selectedChildId && a.child.id !== selectedChildId) return false;

      return true;
    });
  }, [assessments, dateFilterType, customDateFrom, customDateTo, sector, cell, village, selectedChildId]);

  const processedAssessments = useMemo(() => {
    let data = filteredAssessments;

    // If no specific child is selected, only show the latest assessment per child
    if (!selectedChildId) {
      data = getLatestPerChild(data);
    } else {
      // If a child is selected, show all their assessments sorted by date descending
      data = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return groupWithRowspan(data, (a) => a.child.name);
  }, [filteredAssessments, selectedChildId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedAssessments.length;
    const highRisk = processedAssessments.filter((a) => a.prediction?.riskLevel === "high").length;
    const moderate = processedAssessments.filter((a) => a.prediction?.riskLevel === "moderate").length;
    const low = processedAssessments.filter((a) => a.prediction?.riskLevel === "low").length;
    const stunted = processedAssessments.filter((a) => a.prediction?.result === "Stunted").length;

    return {
      total,
      highRisk,
      moderate,
      low,
      stunted,
      healthyPercent: total > 0 ? Math.round(((total - stunted) / total) * 100) : 0,
    };
  }, [processedAssessments]);

  // Filter children for search dropdown
  const filteredChildrenList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return children.filter(child =>
      child.name.toLowerCase().includes(query)
    );
  }, [children, searchQuery]);

  const handleClearFilters = () => {
    setDateFilterType("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSector("");
    setCell("");
    setVillage("");
    setSelectedChildId(null);
    setSearchQuery("");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-primary via-teal-600 to-primary rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">HEALTH CENTER REPORTS</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('assessment.assessment_reports')}
              </h1>
              <p className="text-white/90 text-lg mb-6">
                View and analyze assessment data from your health center
              </p>
              
              <div className="flex flex-wrap gap-3">
                {!loading && processedAssessments.length > 0 && (
                  <ExportButton
                    data={processedAssessments.map(a => ({
                      'Child Name': a.child.name,
                      'Date': new Date(a.date).toLocaleDateString(),
                      'Location': [a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(' / '),
                      'Submitted By': a.chw ? formatSubmittedBy(a.chw) : 'N/A',
                      'Height (cm)': a.height,
                      'Weight (kg)': a.weight,
                      'MUAC': a.muac,
                      'ML Prediction': a.prediction?.result || t('dashboard.pending'),
                      'Risk Level': a.prediction?.riskLevel || 'low',
                      'Status': a.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')
                    }))}
                    filename="assessment_reports"
                    title="Assessment Reports"
                  />
                )}
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur font-bold h-12 px-6 rounded-xl"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  {showFilters ? t('assessment.hide_filters') : t('assessment.show_filters')}
                </Button>
              </div>
            </div>
          </div>


          {/* Summary Statistics */}
          {!loading && processedAssessments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">{t('dashboard.total_assessments', 'Total')}</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-red-600 mb-1 font-bold uppercase tracking-wider">{t('dashboard.high_risk')}</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-amber-600 mb-1 font-bold uppercase tracking-wider">{t('dashboard.moderate_risk')}</p>
                <p className="text-3xl font-bold text-amber-600">{stats.moderate}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-emerald-600 mb-1 font-bold uppercase tracking-wider">{t('dashboard.low_risk')}</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.low}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-primary mb-1 font-bold uppercase tracking-wider">{t('dashboard.healthy_rate', 'Healthy %')}</p>
                <p className="text-3xl font-bold text-primary">{stats.healthyPercent}%</p>
              </div>
            </div>
          )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
            <div className="space-y-6">
              {/* Date Filtering */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  {t('assessment.date_range')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                  {(["all", "today", "week", "month", "year", "custom"] as DateFilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        dateFilterType === type
                          ? "bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {type === "all" && t('assessment.all')}
                      {type === "today" && t('assessment.today')}
                      {type === "week" && t('assessment.this_week')}
                      {type === "month" && t('assessment.this_month')}
                      {type === "year" && t('assessment.this_year')}
                      {type === "custom" && t('assessment.custom')}
                    </button>
                  ))}
                </div>

                {/* Custom date range */}
                {dateFilterType === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-900">{t('assessment.from')}</Label>
                      <Input
                        type="date"
                        className="h-11 border-slate-300 focus-visible:ring-primary"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-900">{t('assessment.to')}</Label>
                      <Input
                        type="date"
                        className="h-11 border-slate-300 focus-visible:ring-primary"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Child Selection */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  {t('common.child')} Filter
                </h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search for a child to view history..."
                    className="pl-10 h-11 border-slate-300 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchDropdownOpen(true);
                    }}
                    onFocus={() => setSearchDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
                  />
                  {selectedChildId && (
                    <button
                      onClick={() => {
                        setSelectedChildId(null);
                        setSearchQuery("");
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Search Dropdown */}
                  {searchDropdownOpen && filteredChildrenList.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-primary/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredChildrenList.map(child => (
                        <div
                          key={child.id}
                          className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors border-b last:border-0"
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setSearchQuery(child.name);
                            setSearchDropdownOpen(false);
                          }}
                        >
                          <p className="font-bold text-sm text-slate-900">{child.name}</p>
                          <p className="text-xs text-slate-600">{child.motherName} • {child.village}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Filtering */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('location.location_title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-900">{t('location.sector')}</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={sector}
                      onChange={(e) => {
                        setSector(e.target.value);
                        setCell("");
                        setVillage("");
                      }}
                    >
                      <option value="">{t('assessment.all')}</option>
                      {sectors.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-900">{t('location.cell')}</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={cell}
                      onChange={(e) => {
                        setCell(e.target.value);
                        setVillage("");
                      }}
                    >
                      <option value="">{t('assessment.all')}</option>
                      {cells.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-900">{t('location.village')}</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    >
                      <option value="">{t('assessment.all')}</option>
                      {villages.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 font-bold h-10 rounded-xl border-2"
                >
                  <X className="h-4 w-4" />
                  {t('assessment.clear_filters')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-teal-200 items-center justify-center mb-4 animate-pulse">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
          </div>
        ) : processedAssessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
            <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-teal-200 items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">{t('dashboard.no_assessments')}</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters to see results</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-teal-50 to-primary/10 border-b border-primary/20 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('assessment.assessment_reports')}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Showing {processedAssessments.length} assessment{processedAssessments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('common.child')}</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('common.date')}</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('location.location_title')}</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Submitted By</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">H (cm)</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">W (kg)</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">MUAC</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dashboard.ml_prediction')}</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dashboard.risk_level')}</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      {a.isFirst && (
                        <td className="p-4 align-top" rowSpan={a.rowspan}>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-teal-200 flex items-center justify-center">
                              <span className="text-primary font-bold text-sm">{a.child.name[0]}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{a.child.name}</span>
                          </div>
                        </td>
                      )}
                      <td className="p-4 text-sm text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {[a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(" / ")}
                      </td>
                      <td className="p-4 text-sm text-slate-600">{a.chw ? formatSubmittedBy(a.chw) : "N/A"}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.height}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.weight}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.muac}</td>
                      <td className="p-4 text-sm font-bold text-slate-900">{a.prediction?.result || t('dashboard.pending')}</td>
                      <td className="p-4">
                        <RiskBadge level={a.prediction?.riskLevel || "low"} />
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-sm font-bold ${
                            a.status === "REVIEWED" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {a.status === "REVIEWED" ? t('dashboard.reviewed') : t('dashboard.pending')}
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
      </div>
    </DashboardLayout>
  );
}
