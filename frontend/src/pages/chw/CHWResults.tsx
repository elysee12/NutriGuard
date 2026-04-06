import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChildDetailsModal from "@/components/ChildDetailsModal";

interface ResultRecord {
  id: number;
  child: { id: number; name: string; dob: string };
  date: string;
  prediction?: { riskLevel: "low" | "moderate" | "high"; riskScore: number };
  status: string;
  chw?: { id: number };
}

export default function CHWResults() {
  const { token, user } = useAuth();
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const loadResults = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/assessment`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Unable to load prediction results");
        }

        const data: ResultRecord[] = await response.json();
        const filtered = user?.role === "CHW"
          ? data.filter((record) => record.chw?.id === user.id)
          : data;
        setResults(filtered);
      } catch (error) {
        console.error("Failed to load results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [API_URL, token, user?.id, user?.role]);

  const calculateAge = (dob: string) => {
    const diff = new Date().getTime() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    return `${months} months`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title="Prediction Results" description="View all ML prediction results for your children" />
        <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {["Child", "Age", "Date", "Risk Level", "Score", "Review Status", "Actions"].map((h) => (
                  <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading prediction results…
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No prediction results found.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{r.child.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{calculateAge(r.child.dob)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <RiskBadge level={r.prediction?.riskLevel || 'low'} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (r.prediction?.riskScore || 0) > 60
                                ? 'bg-destructive'
                                : (r.prediction?.riskScore || 0) > 30
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}
                            style={{ width: `${r.prediction?.riskScore ?? 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{Math.round(r.prediction?.riskScore || 0)}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${r.status === 'REVIEWED' ? 'text-success' : 'text-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedChildId(r.child.id);
                          setSelectedChildName(r.child.name);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedChildId && token && (
        <ChildDetailsModal
          token={token}
          apiUrl={API_URL}
          childId={selectedChildId}
          childName={selectedChildName}
          onClose={() => {
            setSelectedChildId(null);
            setSelectedChildName("");
          }}
        />
      )}
    </DashboardLayout>
  );
}
