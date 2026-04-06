import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    sector?: string;
    cell?: string;
    village?: string;
  };
  chw?: { name: string };
  prediction?: { result: string; riskLevel: "low" | "moderate" | "high" };
}

export default function NurseAssessments() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader
          title="Review Assessments"
          description="Review submitted forms and ML predictions"
          actions={
            <Button onClick={() => navigate("/chw/assessments")} className="font-semibold">
              Conduct Assessment
            </Button>
          }
        />

        <div className="bg-card rounded-xl border shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" className="h-10" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" className="h-10" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
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
                <option value="">All</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                <option value="">All</option>
                {cells.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                <option value="">All</option>
                {villages.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {["Child", "CHW", "Date", "H(cm)", "W(kg)", "MUAC", "Prediction", "Risk", "Status", ""].map((h) => (
                  <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">Loading assessments…</td>
                </tr>
              ) : filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">No assessments found.</td>
                </tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{a.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.chw?.name || 'Unknown'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.height}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.weight}</td>
                    <td className="p-4 text-sm text-muted-foreground">{a.muac}</td>
                    <td className="p-4 text-sm font-medium">{a.prediction?.result || 'Pending'}</td>
                    <td className="p-4"><RiskBadge level={a.prediction?.riskLevel || 'low'} /></td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${a.status === 'REVIEWED' ? 'text-success' : 'text-warning'}`}>{a.status}</span>
                    </td>
                    <td className="p-4">
                      {a.status === 'PENDING' && <Button size="sm">Review</Button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
