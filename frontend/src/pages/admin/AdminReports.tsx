import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ExportButton";
import { useRwandaLocations } from "@/hooks/useRwandaLocations";
import { Filter, X, Download, Building2, MapPin } from "lucide-react";
import { FaMapMarkerAlt, FaBuilding, FaHome, FaHospital } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
    dob: string;
    gender: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  chw?: { id: number; name: string; role: string; village?: string; healthCenter?: { name: string } };
  healthCenter?: { id: number; name: string };
  prediction?: { result: string; riskLevel: "low" | "moderate" | "high"; riskScore: number };
}

interface HealthCenter {
  id: number;
  name: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

type DateFilterType = "today" | "week" | "month" | "year" | "custom";

export default function AdminReports() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Use Rwanda locations hook for filtering
  const locationFilter = useRwandaLocations();

  // Date filtering
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Health Center filtering
  const [selectedHealthCenter, setSelectedHealthCenter] = useState("");

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      setLoading(true);

      try {
        const [assessmentsRes, centersRes] = await Promise.all([
          fetch(`${API_URL}/assessment`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/health-center`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (assessmentsRes.ok) {
          const assessmentsData = await assessmentsRes.json();
          setAssessments(assessmentsData);
        }

        if (centersRes.ok) {
          const centersData = await centersRes.json();
          setHealthCenters(centersData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Calculate date range based on filter type
  const getDateRange = (): [Date, Date] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        return [new Date(1970, 0, 1), new Date()];
    }
  };

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    const [dateStart, dateEnd] = getDateRange();

    return assessments.filter((a) => {
      const assessmentDate = new Date(a.date);
      
      // Date filter
      if (assessmentDate < dateStart || assessmentDate > dateEnd) return false;
      
      // Health Center filter
      if (selectedHealthCenter && a.healthCenter?.id !== Number(selectedHealthCenter)) return false;
      
      // Location filters using the new location fields
      if (locationFilter.province && a.child.province !== locationFilter.province) return false;
      if (locationFilter.district && a.child.district !== locationFilter.district) return false;
      if (locationFilter.sector && a.child.sector !== locationFilter.sector) return false;
      if (locationFilter.cell && a.child.cell !== locationFilter.cell) return false;
      if (locationFilter.village && a.child.village !== locationFilter.village) return false;
      
      return true;
    });
  }, [assessments, dateFilterType, customDateFrom, customDateTo, selectedHealthCenter, locationFilter.province, locationFilter.district, locationFilter.sector, locationFilter.cell, locationFilter.village]);

  // Only keep latest assessment per child
  const processedAssessments = useMemo(() => {
    return getLatestPerChild(filteredAssessments);
  }, [filteredAssessments]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedAssessments.length;
    const highRisk = processedAssessments.filter((a) => a.prediction?.riskLevel === "high").length;
    const moderate = processedAssessments.filter((a) => a.prediction?.riskLevel === "moderate").length;
    const low = processedAssessments.filter((a) => a.prediction?.riskLevel === "low").length;
    const stunted = processedAssessments.filter((a) => a.prediction?.result === "Stunted").length;
    const uniqueChildren = new Set(processedAssessments.map(a => a.child.name)).size;
    const uniqueCenters = new Set(processedAssessments.map(a => a.healthCenter?.name).filter(Boolean)).size;

    return {
      total,
      highRisk,
      moderate,
      low,
      stunted,
      uniqueChildren,
      uniqueCenters,
      healthyPercent: total > 0 ? Math.round(((total - stunted) / total) * 100) : 0,
    };
  }, [processedAssessments]);

  const handleClearFilters = () => {
    setDateFilterType("month");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSelectedHealthCenter("");
    locationFilter.resetLocation();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title="System-Wide Reports"
          description="Generate comprehensive reports across all health centers with advanced filtering"
          actions={
            <div className="flex gap-2">
              {!loading && processedAssessments.length > 0 && (
                <ExportButton
                  data={processedAssessments.map(a => ({
                    'Child Name': a.child.name,
                    'Gender': a.child.gender === 'M' ? 'Male' : 'Female',
                    'Date of Birth': new Date(a.child.dob).toLocaleDateString(),
                    'Assessment Date': new Date(a.date).toLocaleDateString(),
                    'Health Center': a.healthCenter?.name || a.chw?.healthCenter?.name || 'N/A',
                    'Province': a.child.province || 'N/A',
                    'District': a.child.district || 'N/A',
                    'Sector': a.child.sector || 'N/A',
                    'Cell': a.child.cell || 'N/A',
                    'Village': a.child.village || 'N/A',
                    'Submitted By': a.chw ? formatSubmittedBy(a.chw) : 'N/A',
                    'Height (cm)': a.height,
                    'Weight (kg)': a.weight,
                    'MUAC (mm)': a.muac,
                    'ML Prediction': a.prediction?.result || 'Pending',
                    'Risk Level': a.prediction?.riskLevel || 'low',
                    'Risk Score': a.prediction?.riskScore || 0,
                    'Status': a.status,
                  }))}
                  filename="admin_system_report"
                  title="e-KuraNeza Kibondo System-Wide Assessment Report"
                />
              )}
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          }
        />

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-card rounded-xl border shadow-sm p-6 mb-6">
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary" />
                  Date Range
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {(["today", "week", "month", "year", "custom"] as DateFilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        dateFilterType === type
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {type === "today" && "Today"}
                      {type === "week" && "This Week"}
                      {type === "month" && "This Month"}
                      {type === "year" && "This Year"}
                      {type === "custom" && "Custom Range"}
                    </button>
                  ))}
                </div>

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

              {/* Health Center Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FaHospital className="h-4 w-4 text-primary" />
                  Health Center
                </h3>
                <div className="relative">
                  <FaHospital className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm"
                    value={selectedHealthCenter}
                    onChange={(e) => setSelectedHealthCenter(e.target.value)}
                  >
                    <option value="">All Health Centers</option>
                    {healthCenters.map((hc) => (
                      <option key={hc.id} value={hc.id}>
                        {hc.name} ({hc.sector}, {hc.cell})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Filters */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary" />
                  Geographic Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Province
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={locationFilter.province}
                      onChange={(e) => locationFilter.handleProvinceChange(e.target.value)}
                    >
                      <option value="">All Provinces</option>
                      {locationFilter.provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      District
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={locationFilter.district}
                      onChange={(e) => locationFilter.handleDistrictChange(e.target.value)}
                      disabled={!locationFilter.province}
                    >
                      <option value="">All Districts</option>
                      {locationFilter.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaBuilding className="h-3.5 w-3.5 text-primary" />
                      Sector
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={locationFilter.sector}
                      onChange={(e) => locationFilter.handleSectorChange(e.target.value)}
                      disabled={!locationFilter.district}
                    >
                      <option value="">All Sectors</option>
                      {locationFilter.sectors.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Cell
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={locationFilter.cell}
                      onChange={(e) => locationFilter.handleCellChange(e.target.value)}
                      disabled={!locationFilter.sector}
                    >
                      <option value="">All Cells</option>
                      {locationFilter.cells.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaHome className="h-3.5 w-3.5 text-primary" />
                      Village
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={locationFilter.village}
                      onChange={(e) => locationFilter.handleVillageChange(e.target.value)}
                      disabled={!locationFilter.cell}
                    >
                      <option value="">All Villages</option>
                      {locationFilter.villages.map((v) => (
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
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {!loading && processedAssessments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Total Assessments</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Unique Children</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueChildren}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Health Centers</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueCenters}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">High Risk</p>
              <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Moderate</p>
              <p className="text-2xl font-bold text-warning">{stats.moderate}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Low Risk</p>
              <p className="text-2xl font-bold text-success">{stats.low}</p>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1 font-semibold">Healthy Rate</p>
              <p className="text-2xl font-bold text-primary">{stats.healthyPercent}%</p>
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            Loading reports...
          </div>
        ) : processedAssessments.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">
            No assessments found matching the selected filters
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Child Name</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Gender</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Health Center</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Location</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Submitted By</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Height</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Weight</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">MUAC</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">ML Result</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Risk</th>
                  <th className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {processedAssessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{a.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.child.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {a.healthCenter?.name || a.chw?.healthCenter?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {[a.child.province, a.child.district, a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(' / ')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{a.chw ? formatSubmittedBy(a.chw) : 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.height} cm</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.weight} kg</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.muac} mm</td>
                    <td className="p-4 text-sm font-medium">{a.prediction?.result || 'Pending'}</td>
                    <td className="p-4">
                      <RiskBadge level={a.prediction?.riskLevel || "low"} />
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-sm font-medium ${
                          a.status === "REVIEWED" ? "text-success" : "text-warning"
                        }`}
                      >
                        {a.status === "REVIEWED" ? "Reviewed" : "Pending"}
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
