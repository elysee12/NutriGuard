import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ExportButton";
import { Download, Filter, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { getLatestPerChild, groupWithRowspan, formatSubmittedBy } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

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
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title={t('assessment.assessment_reports')}
          description="View and analyze assessment data from your health center"
          actions={
            <div className="flex gap-2">
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
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? t('assessment.hide_filters') : t('assessment.show_filters')}
              </Button>
            </div>
          }
        />

        {/* Filters */}
        {showFilters && (
          <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
            <div className="space-y-4">
              {/* Date Filtering */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('assessment.date_range')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                  {(["all", "today", "week", "month", "year", "custom"] as DateFilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        dateFilterType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                      <Label>{t('assessment.from')}</Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('assessment.to')}</Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Child Selection */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('common.child')} Filter</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search for a child to view history..."
                    className="pl-10"
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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Search Dropdown */}
                  {searchDropdownOpen && filteredChildrenList.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredChildrenList.map(child => (
                        <div
                          key={child.id}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setSearchQuery(child.name);
                            setSearchDropdownOpen(false);
                          }}
                        >
                          <p className="font-medium text-sm">{child.name}</p>
                          <p className="text-xs text-muted-foreground">{child.motherName} • {child.village}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Filtering */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('location.location_title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{t('location.sector')}</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                    <Label>{t('location.cell')}</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                    <Label>{t('location.village')}</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t('assessment.clear_filters')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && processedAssessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dashboard.total_assessments', 'Total Assessments')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dashboard.high_risk')}</p>
              <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dashboard.moderate_risk')}</p>
              <p className="text-2xl font-bold text-warning">{stats.moderate}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dashboard.low_risk')}</p>
              <p className="text-2xl font-bold text-success">{stats.low}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dashboard.healthy_rate', 'Healthy Rate')}</p>
              <p className="text-2xl font-bold text-primary">{stats.healthyPercent}%</p>
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : processedAssessments.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            {t('dashboard.no_assessments')}
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.child')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.date')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('location.location_title')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Submitted By</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">H (cm)</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">W (kg)</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">MUAC</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('dashboard.ml_prediction')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('dashboard.risk_level')}</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {processedAssessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    {a.isFirst && (
                      <td className="p-4 text-sm font-medium text-foreground align-top" rowSpan={a.rowspan}>
                        {a.child.name}
                      </td>
                    )}
                    <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {[a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(" / ")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{a.chw ? formatSubmittedBy(a.chw) : "N/A"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.height}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.weight}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.muac}</td>
                    <td className="p-4 text-sm font-medium">{a.prediction?.result || t('dashboard.pending')}</td>
                    <td className="p-4">
                      <RiskBadge level={a.prediction?.riskLevel || "low"} />
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-medium ${
                          a.status === "REVIEWED" ? "text-success" : "text-warning"
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
        )}
      </div>
    </DashboardLayout>
  );
}
