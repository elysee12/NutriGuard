import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
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
import { TrendingUp, Users, Activity, MapPin } from "lucide-react";

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
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center text-muted-foreground">
            {t("common.no_data_available", "No data available")}
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
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          title={t("nav.statistics", "Statistics")}
          description={
            stats.isNurseView 
              ? t("stats.health_center_overview", "Health center performance metrics and trends")
              : t("stats.comprehensive_overview", "Comprehensive overview of nutritional assessments and trends")
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="professional-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{stats.totalAssessments}</h3>
            <p className="text-sm text-muted-foreground">{t("stats.total_assessments", "Total Assessments")}</p>
          </div>

          <div className="professional-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{stats.totalChildren}</h3>
            <p className="text-sm text-muted-foreground">{t("stats.children_registered", "Children Registered")}</p>
          </div>

          <div className="professional-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {stats.nutritionalStatus.Stunted}
            </h3>
            <p className="text-sm text-muted-foreground">{t("stats.stunted_cases", "Stunted Cases")}</p>
            {stats.totalAssessments > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.nutritionalStatus.Stunted / stats.totalAssessments) * 100).toFixed(1)}% of total
              </p>
            )}
          </div>

          <div className="professional-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-info" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {stats.geoDistribution.length}
            </h3>
            <p className="text-sm text-muted-foreground">
              {stats.isNurseView 
                ? t("stats.health_centers_covered", "Health Centers") 
                : t("stats.provinces_covered", "Provinces Covered")}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stunting Status Distribution */}
          <div className="professional-card p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-card-foreground mb-1">
                {t("stats.stunting_status_distribution", "Stunting Status Distribution")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("stats.stunting_status_desc", "Latest stunting assessment results per child")}
              </p>
            </div>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("stats.no_data", "No assessment data available")}
              </div>
            )}
          </div>

          {/* Risk Level Distribution */}
          <div className="professional-card p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-card-foreground mb-1">
                {t("stats.risk_level_distribution", "Risk Level Distribution")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("stats.risk_level_desc", "Latest cases categorized by risk severity")}
              </p>
            </div>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("stats.no_data", "No assessment data available")}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="professional-card p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-card-foreground mb-1">
              {t("stats.monthly_assessment_trends", "Monthly Assessment Trends")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("stats.monthly_trends_desc", "Assessment volume over the past 6 months")}
            </p>
          </div>
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
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("stats.no_data", "No assessment data available")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Group Distribution */}
          <div className="professional-card p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-card-foreground mb-1">
                {t("stats.age_group_distribution", "Age Group Distribution")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("stats.age_group_desc", "Children categorized by age")}
              </p>
            </div>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("stats.no_data", "No children data available")}
              </div>
            )}
          </div>

          {/* Geographic Distribution */}
          <div className="professional-card p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-card-foreground mb-1">
                {stats.isNurseView
                  ? t("stats.health_center_distribution", "Health Center Distribution")
                  : t("stats.geographic_distribution", "Geographic Distribution")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats.isNurseView
                  ? t("stats.health_center_desc", "Children registered by health center")
                  : t("stats.geographic_desc", "Children registered by province")}
              </p>
            </div>
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
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("stats.no_data", "No geographic data available")}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
