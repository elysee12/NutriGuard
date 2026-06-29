import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AssessmentDetails {
  id: number;
  child: { name: string; dob: string; gender: string; motherName: string };
  chw: { name: string };
  date: string;
  height: number;
  weight: number;
  muac: number;
  prediction: { result: string; riskScore: number; riskLevel: "low" | "moderate" | "high"; recommendation: string };
  status: string;
}

export default function NurseAssessmentView() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`${API_URL}/assessment/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setAssessment(await response.json());
        } else {
          toast.error(t('assessment.load_failed'));
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    if (token && id) fetchAssessment();
  }, [id, token, API_URL, t]);

  const handleReviewSubmit = async (status: "APPROVED" | "REJECTED") => {
    setSubmittingStatus(status);
    try {
      const response = await fetch(`${API_URL}/assessment/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(status === "APPROVED" ? t('assessment.approved_msg') : t('assessment.rejected_msg'));
        navigate("/nurse/assessments");
      } else {
        const data = await response.json();
        throw new Error(data.message || t('admin.update_failed'));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingStatus(null);
    }
  };

  if (loading) return <DashboardLayout><div className="p-8">{t('common.loading')}</div></DashboardLayout>;
  if (!assessment) return <DashboardLayout><div className="p-8">{t('dashboard.no_assessments')}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <PageHeader
          title={t('assessment.review_title', { name: assessment.child.name })}
          description={t('assessment.submitted_by_on', { chw: assessment.chw.name, date: new Date(assessment.date).toLocaleDateString() })}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Child & Prediction */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">{t('assessment.child_info')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>{t('common.name')}:</strong> {assessment.child.name}</p>
                <p><strong>{t('common.gender')}:</strong> {assessment.child.gender === 'M' ? t('assessment.male') : t('assessment.female')}</p>
                <p><strong>{t('common.dob')}:</strong> {new Date(assessment.child.dob).toLocaleDateString()}</p>
                <p><strong>{t('assessment.mother_name')}:</strong> {assessment.child.motherName}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">{t('assessment.ml_result')} & {t('assessment.recommendation')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('assessment.ml_result')}:</span>
                  <span className="font-bold text-lg">{assessment.prediction.result}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('assessment.risk_score')}:</span>
                  <RiskBadge level={assessment.prediction.riskLevel} score={assessment.prediction.riskScore} />
                </div>
                <div className="pt-2">
                  <p className="text-muted-foreground font-semibold mb-1">{t('assessment.recommendation')}:</p>
                  <p className="text-sm bg-muted/50 p-4 rounded-lg border border-border whitespace-pre-wrap break-words leading-relaxed w-full">{assessment.prediction.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Vitals & Action */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">{t('assessment.vitals')}</h3>
              <div className="space-y-2 text-sm">
                <p><strong>{t('assessment.height_cm')}:</strong> {assessment.height} cm</p>
                <p><strong>{t('assessment.weight_kg')}:</strong> {assessment.weight} kg</p>
                <p><strong>{t('assessment.muac_mm')}:</strong> {assessment.muac} mm</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">{t('assessment.action')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('assessment.review_desc')}</p>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  disabled={submittingStatus !== null}
                  onClick={() => handleReviewSubmit("APPROVED")}
                >
                  {submittingStatus === "APPROVED" ? t('assessment.processing') : t('admin.approve')}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={submittingStatus !== null}
                  onClick={() => handleReviewSubmit("REJECTED")}
                >
                  {submittingStatus === "REJECTED" ? t('assessment.processing') : t('admin.reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
