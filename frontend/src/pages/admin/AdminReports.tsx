import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/ExportButton";
import { useRwandaLocations } from "@/hooks/useRwandaLocations";
import { Filter, X, Download, Building2, MapPin, Calendar, FileText, Home } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">NATIONAL REPORTS</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                System-Wide Reports
              </h1>
              <p className="text-white/90 text-lg mb-6">
                Generate comprehensive reports across all health centers with advanced filtering
              </p>
              
              <div className="flex flex-wrap gap-3">
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
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur font-bold h-12 px-6 rounded-xl"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          {!loading && processedAssessments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">Children</p>
                <p className="text-3xl font-bold text-slate-900">{stats.uniqueChildren}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">Centers</p>
                <p className="text-3xl font-bold text-slate-900">{stats.uniqueCenters}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-red-600 mb-1 font-bold uppercase tracking-wider">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-amber-600 mb-1 font-bold uppercase tracking-wider">Moderate</p>
                <p className="text-3xl font-bold text-amber-600">{stats.moderate}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-emerald-600 mb-1 font-bold uppercase tracking-wider">Low Risk</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.low}</p>
              </div>
              <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <p className="text-xs text-primary mb-1 font-bold uppercase tracking-wider">Healthy %</p>
                <p className="text-3xl font-bold text-primary">{stats.healthyPercent}%</p>
              </div>
            </div>
          )}

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 mb-6">
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Date Range
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {(["today", "week", "month", "year", "custom"] as DateFilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        dateFilterType === type
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                      <Label className="font-bold text-slate-900">From</Label>
                      <Input
                        type="date"
                        className="h-11 border-slate-300 focus-visible:ring-purple-500"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-900">To</Label>
                      <Input
                        type="date"
                        className="h-11 border-slate-300 focus-visible:ring-purple-500"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Health Center Filter */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Health Center
                </h3>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10" />
                  <select
                    className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  Geographic Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-slate-900">
                      <MapPin className="h-3.5 w-3.5 text-purple-600" />
                      Province
                    </Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    <Label className="flex items-center gap-2 font-bold text-slate-900">
                      <MapPin className="h-3.5 w-3.5 text-purple-600" />
                      District
                    </Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    <Label className="flex items-center gap-2 font-bold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      Sector
                    </Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    <Label className="flex items-center gap-2 font-bold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      Cell
                    </Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                    <Label className="flex items-center gap-2 font-bold text-slate-900">
                      <Home className="h-3.5 w-3.5 text-purple-600" />
                      Village
                    </Label>
                    <select
                      className="flex h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                  className="flex items-center gap-2 font-bold h-10 rounded-xl border-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
            <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4 animate-pulse">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-slate-600 font-semibold">Loading reports...</p>
          </div>
        ) : processedAssessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
            <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-purple-600" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">No assessments found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Detailed Assessment Records</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Showing {processedAssessments.length} assessment{processedAssessments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Child Name</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Health Center</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Location</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Submitted By</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Height</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Weight</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">MUAC</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">ML Result</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Risk</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                            <span className="text-purple-700 font-bold text-sm">{a.child.name[0]}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{a.child.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{a.child.gender === 'M' ? 'Male' : 'Female'}</td>
                      <td className="p-4 text-sm text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {a.healthCenter?.name || a.chw?.healthCenter?.name || 'N/A'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {[a.child.province, a.child.district, a.child.sector, a.child.cell, a.child.village].filter(Boolean).join(' / ')}
                      </td>
                      <td className="p-4 text-sm text-slate-600">{a.chw ? formatSubmittedBy(a.chw) : 'N/A'}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.height} cm</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.weight} kg</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{a.muac} mm</td>
                      <td className="p-4 text-sm font-bold text-slate-900">{a.prediction?.result || 'Pending'}</td>
                      <td className="p-4">
                        <RiskBadge level={a.prediction?.riskLevel || "low"} />
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-sm font-bold ${
                            a.status === "REVIEWED" ? "text-emerald-600" : "text-amber-600"
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
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
