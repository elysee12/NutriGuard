import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Activity, MapPin, BarChart3, Sparkles } from "lucide-react";

interface DetailedStats {
  nutritionalStatus: {
    Stunted: number;
    'Not Stunted': number;
  };
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
  monthlyTrends: Array<{ month: string; assessments: number }>;
  ageGroups: Array<{ ageGroup: string; count: number }>;
  geoDistribution: Array<{ location: string; count: number }>;
  totalAssessments: number;
  totalChildren: number;
  isNurseView?: boolean;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--info))",
  chart1: "#0088FE",
  chart2: "#00C49F",
  chart3: "#FFBB28",
  chart4: "#FF8042",
  chart5: "#8884d8",
};

export default function StatisticsPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats/detailed`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching detailed statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDetailedStats();
  }, [token]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4 animate-pulse">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 items-center justify-center mb-4">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t("common.no_data_available", "No data available")}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare data for charts
  const nutritionalData = [
    { name: t("stats.stunted", "Stunted"), value: stats.nutritionalStatus.Stunted, color: COLORS.destructive },
    { name: t("stats.not_stunted", "Not Stunted"), value: stats.nutritionalStatus['Not Stunted'], color: COLORS.success },
  ].filter(item => item.value > 0); // Only show categories with data

  const riskData = [
    { name: t("stats.low_risk", "Low Risk"), value: stats.riskDistribution.low, color: COLORS.success },
    { name: t("stats.moderate_risk", "Moderate Risk"), value: stats.riskDistribution.moderate, color: COLORS.warning },
    { name: t("stats.high_risk", "High Risk"), value: stats.riskDistribution.high, color: COLORS.destructive },
  ].filter(item => item.value > 0); // Only show categories with data

  const hasNutritionalData = nutritionalData.length > 0;
  const hasRiskData = riskData.length > 0;
  const hasMonthlyData = stats.monthlyTrends.some(m => m.assessments > 0);
  const hasAgeData = stats.ageGroups.some(g => g.count > 0);
  const hasGeoData = stats.geoDistribution.length > 0;

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
                <BarChart3 className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">
                  {user?.role === 'NURSE' ? 'GOOD MORNING' : 'ANALYTICS DASHBOARD'}
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t("nav.statistics", "Statistics")}
              </h1>
              <p className="text-white/90 text-lg">
                {stats.isNurseView 
                  ? t("stats.health_center_overview", "Health center performance metrics and trends")
                  : t("stats.comprehensive_overview", "Comprehensive overview of nutritional assessments and trends")}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Total
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalAssessments}</p>
              <p className="text-sm text-slate-600 font-medium">{t("stats.total_assessments", "Total Assessments")}</p>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Registered
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalChildren}</p>
              <p className="text-sm text-slate-600 font-medium">{t("stats.children_registered", "Children Registered")}</p>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                  Alert
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.nutritionalStatus.Stunted}</p>
              <p className="text-sm text-slate-600 font-medium">{t("stats.stunted_cases", "Stunted Cases")}</p>
              {stats.totalAssessments > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {((stats.nutritionalStatus.Stunted / stats.totalAssessments) * 100).toFixed(1)}% of total
                </p>
              )}
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                  Network
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.geoDistribution.length}</p>
              <p className="text-sm text-slate-600 font-medium">
                {stats.isNurseView 
                  ? t("stats.health_centers_covered", "Health Centers") 
                  : t("stats.provinces_covered", "Provinces Covered")}
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stunting Status Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {t("stats.stunting_status_distribution", "Stunting Status Distribution")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("stats.stunting_status_desc", "Latest stunting assessment results per child")}
                </p>
              </div>
              <div className="p-6">
                {hasNutritionalData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={nutritionalData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {nutritionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t("stats.no_data", "No assessment data available")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Level Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {t("stats.risk_level_distribution", "Risk Level Distribution")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("stats.risk_level_desc", "Latest cases categorized by risk severity")}
                </p>
              </div>
              <div className="p-6">
                {hasRiskData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t("stats.no_data", "No assessment data available")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {t("stats.monthly_assessment_trends", "Monthly Assessment Trends")}
              </h2>
              <p className="text-sm text-slate-600">
                {t("stats.monthly_trends_desc", "Assessment volume over the past 6 months")}
              </p>
            </div>
            <div className="p-6">
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="assessments"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      name={t("stats.assessments", "Assessments")}
                      dot={{ fill: COLORS.primary, r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                  <p>{t("stats.no_data", "No assessment data available")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Group Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {t("stats.age_group_distribution", "Age Group Distribution")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("stats.age_group_desc", "Children categorized by age")}
                </p>
              </div>
              <div className="p-6">
                {hasAgeData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.ageGroups}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="ageGroup" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.info} name={t("stats.children", "Children")} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t("stats.no_data", "No children data available")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {stats.isNurseView
                    ? t("stats.health_center_distribution", "Health Center Distribution")
                    : t("stats.geographic_distribution", "Geographic Distribution")}
                </h2>
                <p className="text-sm text-slate-600">
                  {stats.isNurseView
                    ? t("stats.health_center_desc", "Children registered by health center")
                    : t("stats.geographic_desc", "Children registered by province")}
                </p>
              </div>
              <div className="p-6">
                {hasGeoData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.geoDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        dataKey="location" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        width={stats.isNurseView ? 150 : 100} 
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.success} name={t("stats.children", "Children")} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-500">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t("stats.no_data", "No geographic data available")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
