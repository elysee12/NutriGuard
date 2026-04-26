import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, RiskBadge } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`${API_URL}/assessment/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setAssessment(await response.json());
        } else {
          toast.error("Failed to load assessment details.");
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
        toast.error("An error occurred while fetching the assessment.");
      } finally {
        setLoading(false);
      }
    };

    if (token && id) fetchAssessment();
  }, [id, token, API_URL]);

  const handleReviewSubmit = async (status: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`${API_URL}/assessment/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Assessment has been ${status.toLowerCase()}.`);
        navigate("/nurse/assessments");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update status.");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  if (!assessment) return <DashboardLayout><div className="p-8">Assessment not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <PageHeader
          title={`Review Assessment for ${assessment.child.name}`}
          description={`Submitted by ${assessment.chw.name} on ${new Date(assessment.date).toLocaleDateString()}`}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Child & Prediction */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Child Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Name:</strong> {assessment.child.name}</p>
                <p><strong>Gender:</strong> {assessment.child.gender}</p>
                <p><strong>DoB:</strong> {new Date(assessment.child.dob).toLocaleDateString()}</p>
                <p><strong>Mother:</strong> {assessment.child.motherName}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">ML Prediction & Recommendation</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ML Result:</span>
                  <span className="font-bold text-lg">{assessment.prediction.result}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <RiskBadge level={assessment.prediction.riskLevel} score={assessment.prediction.riskScore} />
                </div>
                <div className="pt-2">
                  <p className="text-muted-foreground font-semibold mb-1">Recommendation:</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{assessment.prediction.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Vitals & Action */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Vitals</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Height:</strong> {assessment.height} cm</p>
                <p><strong>Weight:</strong> {assessment.weight} kg</p>
                <p><strong>MUAC:</strong> {assessment.muac} mm</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Action</h3>
              <p className="text-sm text-muted-foreground mb-4">Review the details and approve or reject this assessment.</p>
              <div className="flex flex-col gap-3">
                <Button size="lg" onClick={() => handleReviewSubmit("APPROVED")}>Approve</Button>
                <Button size="lg" variant="destructive" onClick={() => handleReviewSubmit("REJECTED")}>Reject</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
