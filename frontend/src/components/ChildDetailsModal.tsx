import { useEffect, useState } from "react";
import { X, Calendar, User, MapPin, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/DashboardComponents";

interface ChildProfileData {
  id: number;
  name: string;
  dob: string;
  gender: string;
  motherName: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  registeredAt: string;
  chw?: { id: number; name: string; email: string };
  healthCenter?: { id: number; name: string };
  assessments: Array<{
    id: number;
    date: string;
    height: number;
    weight: number;
    muac: number;
    motherEducation: string;
    caregiverOccupation: string;
    hasBothParents: boolean;
    hasRecentIllness: boolean;
    hasMinimumMealFrequency: boolean;
    hasExclusiveBF: boolean;
    hasVUP: boolean;
    hasHouseholdConflict: boolean;
    hasSafeWater: boolean;
    hasHandwashingFacility: boolean;
    hasToilet: boolean;
    status: string;
    reviewedBy?: string;
    reviewedAt?: string;
    prediction?: {
      result: string;
      riskLevel: "low" | "moderate" | "high";
      riskScore: number;
      recommendation: string;
      createdAt: string;
    };
  }>;
}

interface ChildDetailsModalProps {
  childId: number;
  childName: string;
  onClose: () => void;
  token: string;
  apiUrl: string;
}

export default function ChildDetailsModal({
  childId,
  childName,
  onClose,
  token,
  apiUrl,
}: ChildDetailsModalProps) {
  const [child, setChild] = useState<ChildProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChildDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/child/${childId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to load child details");
        }

        const data = await response.json();
        setChild(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadChildDetails();
  }, [childId, token, apiUrl]);

  if (!token) return null;

  const calculateAge = (dob: string) => {
    const diff = new Date().getTime() - new Date(dob).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    return `${months} months`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 flex items-center justify-between border-b">
          <div>
            <h2 className="text-2xl font-bold">{childName}</h2>
            <p className="text-primary-foreground/80 text-sm">Child Profile & Assessment History</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-muted-foreground">Loading child details...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
              <p className="font-medium">Error: {error}</p>
            </div>
          ) : child ? (
            <>
              {/* Child Profile Section */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Child Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-foreground font-semibold">{child.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-foreground font-semibold">{new Date(child.dob).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{calculateAge(child.dob)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    <p className="text-foreground font-semibold">{child.gender === "M" ? "Male" : "Female"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Mother/Guardian</p>
                    <p className="text-foreground font-semibold">{child.motherName}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Registered</p>
                    <p className="text-foreground font-semibold">
                      {new Date(child.registeredAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-foreground font-semibold">
                        {[child.district, child.sector, child.cell, child.village].filter(Boolean).join(" / ")}
                      </p>
                    </div>
                  </div>

                  {child.chw && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">CHW</p>
                      <p className="text-foreground font-semibold">{child.chw.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{child.chw.email}</p>
                    </div>
                  )}

                  {child.healthCenter && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Health Center</p>
                      <p className="text-foreground font-semibold">{child.healthCenter.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment History Section */}
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                  Assessment History ({child.assessments.length})
                </h3>

                {child.assessments.length === 0 ? (
                  <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">
                    No assessments conducted yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {child.assessments.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow space-y-4"
                      >
                        {/* Assessment Header */}
                        <div className="flex items-start justify-between gap-4 pb-3 border-b">
                          <div>
                            <p className="font-medium text-foreground">
                              {new Date(assessment.date).toLocaleDateString()} at{" "}
                              {new Date(assessment.date).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                assessment.status === "REVIEWED"
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {assessment.status}
                            </span>
                            {assessment.reviewedBy && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                Reviewed: {assessment.reviewedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Anthropometric Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3">Anthropometric Measurements</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground block">Height</span>
                              <p className="font-semibold text-foreground text-lg">{assessment.height} cm</p>
                            </div>
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground block">Weight</span>
                              <p className="font-semibold text-foreground text-lg">{assessment.weight} kg</p>
                            </div>
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground block">MUAC</span>
                              <p className="font-semibold text-foreground text-lg">{assessment.muac} mm</p>
                            </div>
                          </div>
                        </div>

                        {/* Sociodemographic Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3">Sociodemographic Information</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground">Mother&apos;s Education</span>
                              <p className="font-medium text-foreground">{assessment.motherEducation || "N/A"}</p>
                            </div>
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground">Caregiver Occupation</span>
                              <p className="font-medium text-foreground">{assessment.caregiverOccupation || "N/A"}</p>
                            </div>
                            <div className="bg-muted/40 rounded p-3">
                              <span className="text-xs text-muted-foreground">Both Parents Present</span>
                              <p className={`font-medium ${assessment.hasBothParents ? "text-success" : "text-destructive"}`}>
                                {assessment.hasBothParents ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Health and Nutrition Practices */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3">Health & Nutrition Practices</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasExclusiveBF ? "bg-success/10" : "bg-muted/40"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasExclusiveBF ? "bg-success" : "bg-muted-foreground"}`} />
                              <span className="text-foreground">Exclusive Breastfeeding</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasMinimumMealFrequency ? "bg-success/10" : "bg-muted/40"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasMinimumMealFrequency ? "bg-success" : "bg-muted-foreground"}`} />
                              <span className="text-foreground">Min. Meal Frequency</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasVUP ? "bg-success/10" : "bg-muted/40"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasVUP ? "bg-success" : "bg-muted-foreground"}`} />
                              <span className="text-foreground">VUP Beneficiary</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${!assessment.hasRecentIllness ? "bg-success/10" : "bg-warning/10"}`}>
                              <div className={`w-3 h-3 rounded-full ${!assessment.hasRecentIllness ? "bg-success" : "bg-warning"}`} />
                              <span className="text-foreground">{assessment.hasRecentIllness ? "Has Recent Illness" : "No Recent Illness"}</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${!assessment.hasHouseholdConflict ? "bg-success/10" : "bg-warning/10"}`}>
                              <div className={`w-3 h-3 rounded-full ${!assessment.hasHouseholdConflict ? "bg-success" : "bg-warning"}`} />
                              <span className="text-foreground">{assessment.hasHouseholdConflict ? "Has Household Conflict" : "No Household Conflict"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Water, Sanitation & Hygiene */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3">Water, Sanitation & Hygiene</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasSafeWater ? "bg-success/10" : "bg-destructive/10"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasSafeWater ? "bg-success" : "bg-destructive"}`} />
                              <span className="text-foreground">Safe Water</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasHandwashingFacility ? "bg-success/10" : "bg-destructive/10"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasHandwashingFacility ? "bg-success" : "bg-destructive"}`} />
                              <span className="text-foreground">Handwashing</span>
                            </div>
                            <div className={`rounded p-3 flex items-center gap-2 ${assessment.hasToilet ? "bg-success/10" : "bg-destructive/10"}`}>
                              <div className={`w-3 h-3 rounded-full ${assessment.hasToilet ? "bg-success" : "bg-destructive"}`} />
                              <span className="text-foreground">Toilet Access</span>
                            </div>
                          </div>
                        </div>

                        {/* ML Prediction & Clinical Assessment */}
                        {assessment.prediction && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">ML Prediction & Clinical Assessment</h4>
                            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 space-y-3 border border-primary/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm text-muted-foreground">Prediction Result:</span>
                                  <p className="font-semibold text-foreground text-lg">{assessment.prediction.result}</p>
                                </div>
                                <RiskBadge level={assessment.prediction.riskLevel} />
                              </div>

                              <div>
                                <span className="text-sm text-muted-foreground block mb-2">Risk Score</span>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-muted rounded-full h-3">
                                    <div
                                      className={`h-3 rounded-full transition-all ${
                                        assessment.prediction.riskScore > 60
                                          ? "bg-destructive"
                                          : assessment.prediction.riskScore > 30
                                          ? "bg-warning"
                                          : "bg-success"
                                      }`}
                                      style={{ width: `${assessment.prediction.riskScore}%` }}
                                    />
                                  </div>
                                  <span className="text-lg font-bold text-foreground w-12">
                                    {Math.round(assessment.prediction.riskScore)}%
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="text-sm font-medium text-muted-foreground block mb-2">Clinical Recommendation:</span>
                                <p className="text-foreground bg-white/50 rounded p-3 border border-primary/10">
                                  {assessment.prediction.recommendation}
                                </p>
                              </div>

                              <div className="text-xs text-muted-foreground pt-2 border-t border-primary/20">
                                Prediction generated: {new Date(assessment.prediction.createdAt).toLocaleDateString()} at{" "}
                                {new Date(assessment.prediction.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-muted/50 border-t p-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
