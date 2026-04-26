import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, RiskBadge, PageHeader } from "@/components/DashboardComponents";
import { Users, Baby, AlertTriangle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";

interface PendingReview {
  id: number;
  child: { name: string };
  chw: { name: string };
  date: string;
  prediction: { result: string; riskScore: number; riskLevel: "low" | "moderate" | "high" };
}

export default function NurseDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const center = user?.healthCenter || "";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, assessmentsRes] = await Promise.all([
          fetch(`${API_URL}/stats/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/assessment`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (assessmentsRes.ok) {
          const assessments = await assessmentsRes.json();
          // Filter for pending assessments only for the review table
          setPendingReviews(assessments.filter((a: any) => a.status === 'PENDING').slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) fetchDashboardData();
  }, [token, API_URL]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title="Nurse Dashboard"
          description={center ? `${center} — Monitoring & Review` : "Monitoring & Review"}
          actions={
            <Button onClick={() => navigate("/nurse/register-child")} className="font-semibold">
              <Baby className="h-4 w-4 mr-2" />
              Register Child
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="CHWs Supervised" value={stats?.totalCHWs || 0} icon={<Users className="h-6 w-6" />} />
          <StatCard title="Children Registered" value={stats?.totalChildren || 0} icon={<Baby className="h-6 w-6" />} />
          <StatCard title="Pending Reviews" value={stats?.pendingReviews || 0} icon={<ClipboardList className="h-6 w-6" />} changeType="negative" />
          <StatCard title="High Risk Cases" value={stats?.highRiskCount || 0} icon={<AlertTriangle className="h-6 w-6" />} />
        </div>

        {/* Pending Reviews */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-card-foreground">Pending Reviews</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/nurse/assessments")}>View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Child", "Submitted by", "Date", "ML Prediction", "Risk", "Action"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{r.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.chw.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{r.prediction?.result} ({r.prediction?.riskScore}%)</td>
                    <td className="p-4"><RiskBadge level={r.prediction?.riskLevel || "low"} /></td>
                    <td className="p-4">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/nurse/assessments/${r.id}`)}>Review</Button>
                    </td>
                  </tr>
                ))}
                {pendingReviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No pending reviews found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
