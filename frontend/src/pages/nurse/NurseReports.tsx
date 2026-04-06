import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Filter, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AssessmentRecord {
  id: number;
  date: string;
  height: number;
  weight: number;
  muac: number;
  status: string;
  child: {
    name: string;
    dob: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  chw?: { name: string };
  prediction?: { result: string; riskLevel: "low" | "moderate" | "high"; riskScore: number };
}

type DateFilterType = "today" | "week" | "month" | "year" | "custom";

export default function NurseReports() {
  const { token } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Date filtering
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Location filtering
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Load assessments from backend
  useEffect(() => {
    const loadAssessments = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/assessment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Unable to load assessments');
        }
        const data = await response.json();
        setAssessments(data);
      } catch (error) {
        console.error('Failed to load assessments:', error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
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

  // Filter assessments by date and location
  const filteredAssessments = useMemo(() => {
    const [dateStart, dateEnd] = getDateRange();

    return assessments.filter((a) => {
      const assessmentDate = new Date(a.date);
      if (assessmentDate < dateStart || assessmentDate > dateEnd) return false;
      if (sector && a.child.sector !== sector) return false;
      if (cell && a.child.cell !== cell) return false;
      if (village && a.child.village !== village) return false;
      return true;
    });
  }, [assessments, dateFilterType, customDateFrom, customDateTo, sector, cell, village]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAssessments.length;
    const highRisk = filteredAssessments.filter((a) => a.prediction?.riskLevel === "high").length;
    const moderate = filteredAssessments.filter((a) => a.prediction?.riskLevel === "moderate").length;
    const low = filteredAssessments.filter((a) => a.prediction?.riskLevel === "low").length;
    const stunted = filteredAssessments.filter((a) => a.prediction?.result === "Stunted").length;

    return {
      total,
      highRisk,
      moderate,
      low,
      stunted,
      healthyPercent: total > 0 ? Math.round(((total - stunted) / total) * 100) : 0,
    };
  }, [filteredAssessments]);

  const handleClearFilters = () => {
    setDateFilterType("month");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSector("");
    setCell("");
    setVillage("");
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title="Assessment Reports"
          description="View and analyze assessment data from your health center"
          actions={
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          }
        />

        {/* Filters */}
        {showFilters && (
          <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
            <div className="space-y-4">
              {/* Date Filtering */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Date Range</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {(["today", "week", "month", "year", "custom"] as DateFilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        dateFilterType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {type === "today" && "Today"}
                      {type === "week" && "This Week"}
                      {type === "month" && "This Month"}
                      {type === "year" && "This Year"}
                      {type === "custom" && "Custom"}
                    </button>
                  ))}
                </div>

                {/* Custom date range */}
                {dateFilterType === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>From</Label>
                      <Input
                        type="date"
                        className="h-10"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To</Label>
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

              {/* Location Filtering */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Sector</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={sector}
                      onChange={(e) => {
                        setSector(e.target.value);
                        setCell("");
                        setVillage("");
                      }}
                    >
                      <option value="">All Sectors</option>
                      {sectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cell</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={cell}
                      onChange={(e) => {
                        setCell(e.target.value);
                        setVillage("");
                      }}
                    >
                      <option value="">All Cells</option>
                      {cells.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Village</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    >
                      <option value="">All Villages</option>
                      {villages.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
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
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && filteredAssessments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Assessments</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">High Risk</p>
              <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">Moderate Risk</p>
              <p className="text-2xl font-bold text-warning">{stats.moderate}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">Low Risk</p>
              <p className="text-2xl font-bold text-success">{stats.low}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-sm text-muted-foreground mb-1">Healthy Rate</p>
              <p className="text-2xl font-bold text-primary">{stats.healthyPercent}%</p>
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            Loading assessments…
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            No assessments found for the selected filters.
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Child</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">CHW</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">H (cm)</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">W (kg)</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">MUAC</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Prediction</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Risk</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{a.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {[a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(" / ")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{a.chw?.name || "N/A"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.height}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.weight}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.muac}</td>
                    <td className="p-4 text-sm font-medium">{a.prediction?.result || "Pending"}</td>
                    <td className="p-4">
                      <RiskBadge level={a.prediction?.riskLevel || "low"} />
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-medium ${
                          a.status === "REVIEWED" ? "text-success" : "text-warning"
                        }`}
                      >
                        {a.status}
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

