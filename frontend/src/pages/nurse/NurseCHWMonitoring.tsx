import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UserRecord {
  id: number;
  name: string;
  role: string;
  healthCenter?: { id: number; name: string };
}

interface ChildRecord {
  id: number;
  name: string;
  chw?: { id: number };
}

interface AssessmentRecord {
  id: number;
  date: string;
  status: string;
  child: {
    healthCenterId: number;
  };
  chw?: { id: number };
  prediction?: { riskLevel: string };
}

interface CHWStats {
  id: number;
  name: string;
  submissions: number;
  children: number;
  lastActive: string;
  lateSubmissions: number;
  highRiskPending: number;
  childrenNames: string[];
}

export default function NurseCHWMonitoring() {
  const { user, token } = useAuth();
  const center = user?.healthCenter || "";
  const [search, setSearch] = useState("");
  const [chws, setChws] = useState<CHWStats[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadCHWData = async () => {
      if (!token || !center) return;
      setLoading(true);

      try {
        const [usersRes, childrenRes, assessmentsRes] = await Promise.all([
          fetch(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/child`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/assessment`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const users: UserRecord[] = usersRes.ok ? await usersRes.json() : [];
        const children: ChildRecord[] = childrenRes.ok ? await childrenRes.json() : [];
        const assessments: AssessmentRecord[] = assessmentsRes.ok ? await assessmentsRes.json() : [];

        const centerCHWs = users.filter(
          (u) => u.role === 'CHW' && u.healthCenter?.name === center,
        );

        const stats = centerCHWs.map((chw) => {
          const assignedChildren = children.filter((child) => child.chw?.id === chw.id);
          const chwAssessments = assessments.filter((assessment) => assessment.chw?.id === chw.id);
          const pendingAssessments = chwAssessments.filter((assessment) => assessment.status === 'PENDING');

          const lastAssessment = chwAssessments.reduce((latest, assessment) => {
            if (!latest) return assessment;
            return new Date(assessment.date) > new Date(latest.date) ? assessment : latest;
          }, null as AssessmentRecord | null);

          const lateSubmissions = pendingAssessments.filter((assessment) => {
            const ageMs = Date.now() - new Date(assessment.date).getTime();
            return ageMs > 7 * 24 * 60 * 60 * 1000;
          }).length;

          return {
            id: chw.id,
            name: chw.name,
            submissions: chwAssessments.length,
            children: assignedChildren.length,
            lastActive: lastAssessment ? new Date(lastAssessment.date).toLocaleDateString() : 'No activity',
            lateSubmissions,
            highRiskPending: pendingAssessments.filter((assessment) => assessment.prediction?.riskLevel === 'high').length,
            childrenNames: assignedChildren.map((child) => child.name).slice(0, 10),
          };
        });

        setChws(stats);
      } catch (error) {
        console.error('Failed to load CHW monitoring data:', error);
        setChws([]);
      } finally {
        setLoading(false);
      }
    };

    loadCHWData();
  }, [API_URL, center, token]);

  const filtered = useMemo(
    () => chws.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.childrenNames.some((n) => n.toLowerCase().includes(search.toLowerCase())),
    ),
    [chws, search],
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title="CHW Monitoring"
          description={center ? `Health Center: ${center}` : "Track community health worker activity and performance"}
        />
        <div className="mb-4">
          <Input
            placeholder="Search CHWs or children"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading CHW data…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">No CHWs found for this center.</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-card rounded-xl border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{c.name}</h3>
                      <p className="text-sm text-muted-foreground">Last active: {c.lastActive}</p>
                    </div>
                  </div>
                  {c.lateSubmissions > 0 && (
                    <span className="risk-high text-xs font-semibold px-2.5 py-1 rounded-full border">
                      {c.lateSubmissions} late submissions
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Submissions</p>
                    <p className="text-lg font-bold text-foreground">{c.submissions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Children</p>
                    <p className="text-lg font-bold text-foreground">{c.children}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Late Submissions</p>
                    <p className={`text-lg font-bold ${c.lateSubmissions > 0 ? "text-destructive" : "text-success"}`}>{c.lateSubmissions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk Pending</p>
                    <p className={`text-lg font-bold ${c.highRiskPending > 0 ? "text-warning" : "text-success"}`}>{c.highRiskPending}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium">Children assigned</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {c.childrenNames.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
