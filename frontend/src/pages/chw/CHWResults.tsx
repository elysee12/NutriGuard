import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChildDetailsModal from "@/components/ChildDetailsModal";
import { API_URL } from "@/lib/api";
import { groupWithRowspan, getLatestPerChild } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedChildName, setSelectedChildName] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/assessment`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(t('assessment.load_results_failed', "Unable to load prediction results"));
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
  }, [API_URL, token, user?.id, user?.role, t]);

  // Only keep the latest assessment per child for the main view
  const latestResults = useMemo(() => {
    return getLatestPerChild(results);
  }, [results]);

  const processedResults = useMemo(() => {
    return latestResults.map(r => ({ ...r, isFirst: true, rowspan: 1 }));
  }, [latestResults]);

  const calculateAge = (dob: string) => {
    const diff = new Date().getTime() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    return `${months} ${t('dashboard.months')}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title={t('nav.results')} description={t('assessment.view_all_results', "View all ML prediction results for your children")} />
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Mobile View: Card List */}
          <div className="block sm:hidden divide-y">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">{t('common.loading')}</div>
            ) : processedResults.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('dashboard.no_assessments')}</div>
            ) : (
              processedResults.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{r.child.name}</p>
                      <p className="text-xs text-muted-foreground">{calculateAge(r.child.dob)} • {new Date(r.date).toLocaleDateString()}</p>
                    </div>
                    <RiskBadge level={r.prediction?.riskLevel || 'low'} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
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
                    <span className="text-xs font-bold text-muted-foreground">{Math.round(r.prediction?.riskScore || 0)}% {t('dashboard.score')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${r.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary font-bold"
                      onClick={() => {
                        setSelectedChildId(r.child.id);
                        setSelectedChildName(r.child.name);
                        setSelectedAssessmentId(r.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t('dashboard.details')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  {[t('dashboard.child'), t('dashboard.age'), t('common.date'), t('dashboard.risk_level'), t('dashboard.score'), t('common.status'), t('common.actions')].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : processedResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {t('dashboard.no_assessments')}
                    </td>
                  </tr>
                ) : (
                  processedResults.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground align-top">
                        {r.child.name}
                      </td>
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
                          {r.status === 'REVIEWED' ? t('dashboard.reviewed') : t('dashboard.pending')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChildId(r.child.id);
                            setSelectedChildName(r.child.name);
                            setSelectedAssessmentId(r.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('dashboard.details')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedChildId && token && (
        <ChildDetailsModal
          key={`${selectedChildId}-${selectedAssessmentId}`}
          token={token}
          apiUrl={API_URL}
          childId={selectedChildId}
          childName={selectedChildName}
          assessmentId={selectedAssessmentId}
          onClose={() => {
            setSelectedChildId(null);
            setSelectedChildName("");
            setSelectedAssessmentId(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
