import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ReportRecord {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

export default function NurseReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadReports = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Unable to load reports');
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Failed to load reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [API_URL, token]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title="Reports" description="Export and view health center reports" />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">No reports available.</div>
        ) : (
          <div className="grid gap-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-card rounded-xl border shadow-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.type} • Generated {new Date(r.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
