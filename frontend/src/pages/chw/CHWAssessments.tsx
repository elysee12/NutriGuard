import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

interface ChildRecord {
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
}

const motherEducationOptions = [
  "Amashuri abanza",
  "Amashuri yisumbuye",
  "Amashuri makuru",
  "Ntago yize",
];

const occupationOptions = [
  "a) Ni umuhinzi udahingira abanda",
  "b) Ni Umuhinzi utunzwe no guhingira abanda",
  "c) Ni Umworozi",
  "d) Ni umushabitsi ushakisha ( umuzunguzayi, kudandaza utuntu duke kugira abashe kubona ibyo arya buri munsi)",
  "e) Umucuruzi ushobora kubona ibyatunga umuryango",
  "f) Umworozi",
  "g) Umwubatsi",
  "h) Umuyedi",
  "i) Umudozi",
  "j) Undi mwuga",
  "k) Akazi gahemba buri Kwezi cg buri Byumweru bibiri",
];

export default function CHWAssessments() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [prediction, setPrediction] = useState<{ result: string; risk: number; recommendation: string } | null>(null);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [form, setForm] = useState({
    childId: 0,
    childDob: "",
    gender: "M",
    height: "",
    weight: "",
    muac: "",
    umwana_afite_ababyeyi: "Yego",
    amashuri_mama_w_umwana_yiz: "Amashuri abanza",
    sick: "Oya",
    mmf: "Oya",
    fbf: "Oya",
    vup: "Oya",
    ese_haba_hari_amakimbirane: "Oya",
    icyo_umurera_akora: occupationOptions[0],
    water: "Oya",
    handwash: "Oya",
    toilet: "Oya",
  });

  useEffect(() => {
    const loadChildren = async () => {
      if (!token) return;
      setLoadingChildren(true);

      try {
        const response = await fetch(`${API_URL}/child`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Unable to load registered children');
        }

        const data: ChildRecord[] = await response.json();
        setChildren(data);

        if (data.length > 0) {
          const child = data[0];
          setForm((prev) => ({
            ...prev,
            childId: child.id,
            childDob: new Date(child.dob).toISOString().slice(0, 10),
            gender: child.gender || "M",
          }));
        }
      } catch (error) {
        console.error('Error loading children:', error);
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    };

    loadChildren();
  }, [API_URL, token]);

  const selectedChild = children.find((child) => child.id === form.childId);

  const ageDays = form.childDob
    ? Math.max(
        0,
        Math.floor(
          (new Date().setHours(0, 0, 0, 0) - new Date(form.childDob).setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : "";

  const handleChildChange = (childId: number) => {
    const child = children.find((item) => item.id === childId);
    if (!child) {
      setForm((prev) => ({ ...prev, childId: 0, childDob: "", gender: "M" }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      childId: child.id,
      childDob: new Date(child.dob).toISOString().slice(0, 10),
      gender: child.gender || prev.gender,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.childId) {
      toast.error('Please select a registered child first.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          childId: form.childId,
          height: parseFloat(form.height),
          weight: parseFloat(form.weight),
          muac: parseFloat(form.muac),
          motherEducation: form.amashuri_mama_w_umwana_yiz,
          caregiverOccupation: form.icyo_umurera_akora,
          hasBothParents: form.umwana_afite_ababyeyi === 'Yego',
          hasRecentIllness: form.sick === 'Yego',
          hasMinimumMealFrequency: form.mmf === 'Yego',
          hasExclusiveBF: form.fbf === 'Yego',
          hasVUP: form.vup === 'Yego',
          hasHouseholdConflict: form.ese_haba_hari_amakimbirane === 'Yego',
          hasSafeWater: form.water === 'Yego',
          hasHandwashingFacility: form.handwash === 'Yego',
          hasToilet: form.toilet === 'Yego',
          sex: form.gender,
          ageDays: typeof ageDays === 'number' ? ageDays : parseInt(ageDays, 10) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit assessment');
      }

      setPrediction({
        result: data.prediction,
        risk: data.riskScore,
        recommendation: data.recommendation,
      });
      setSubmitted(true);
      toast.success('Assessment submitted and ML prediction generated!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (submitted && prediction) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-2xl">
          <PageHeader title="Prediction Result" />
          <div
            className={`rounded-xl border-2 p-8 text-center ${
              prediction.result === "Stunted" ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5"
            }`}
          >
            {prediction.result === "Stunted" ? (
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            ) : (
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
            )}
            <h2 className="font-display text-2xl font-bold mb-2">{prediction.result}</h2>
            <p className="text-muted-foreground mb-4">Risk Score: {prediction.risk}%</p>
            <div className="w-full bg-muted rounded-full h-3 mb-6">
              <div
                className={`h-3 rounded-full transition-all ${
                  prediction.risk > 60 ? "bg-destructive" : prediction.risk > 30 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${prediction.risk}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{prediction.recommendation}</p>
            <Button
              className="mt-6"
              onClick={() => {
                setSubmitted(false);
                setPrediction(null);
                setForm({
                  childId: selectedChild?.id ?? 0,
                  childDob: selectedChild ? new Date(selectedChild.dob).toISOString().slice(0, 10) : "",
                  gender: selectedChild?.gender || "M",
                  height: "",
                  weight: "",
                  muac: "",
                  umwana_afite_ababyeyi: "Yego",
                  amashuri_mama_w_umwana_yiz: "Amashuri abanza",
                  sick: "Oya",
                  mmf: "Oya",
                  fbf: "Oya",
                  vup: "Oya",
                  ese_haba_hari_amakimbirane: "Oya",
                  icyo_umurera_akora: occupationOptions[0],
                  water: "Oya",
                  handwash: "Oya",
                  toilet: "Oya",
                });
              }}
            >
              New Assessment
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadingChildren) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl">
          <PageHeader title="Submit Assessment" description="Loading registered children..." />
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading children...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <PageHeader
          title="Submit Assessment"
          description="Select a registered child and submit assessment details for ML prediction"
        />
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <Label>Child</Label>
            <select
              className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.childId}
              onChange={(e) => handleChildChange(Number(e.target.value))}
              required
            >
              <option value={0}>Select child</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} — {child.district}/{child.sector}/{child.cell}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sex</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                className="h-12"
                value={form.childDob}
                onChange={(e) => setForm({ ...form, childDob: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Age (days)</Label>
              <Input
                type="text"
                className="h-12"
                value={ageDays !== "" ? `${ageDays} days` : "Enter date of birth"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Mother's Education</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.amashuri_mama_w_umwana_yiz}
                onChange={(e) => setForm({ ...form, amashuri_mama_w_umwana_yiz: e.target.value })}
              >
                {motherEducationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Caregiver Occupation</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.icyo_umurera_akora}
                onChange={(e) => setForm({ ...form, icyo_umurera_akora: e.target.value })}
              >
                {occupationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-12"
                placeholder="e.g. 78.0"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-12"
                placeholder="e.g. 9.2"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>MUAC (mm)</Label>
              <Input
                type="number"
                step="0.1"
                className="h-12"
                placeholder="e.g. 140"
                value={form.muac}
                onChange={(e) => setForm({ ...form, muac: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Both parents present?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.umwana_afite_ababyeyi}
                onChange={(e) => setForm({ ...form, umwana_afite_ababyeyi: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Recent illness?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.sick}
                onChange={(e) => setForm({ ...form, sick: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Minimum meal frequency?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.mmf}
                onChange={(e) => setForm({ ...form, mmf: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Exclusive breastfeeding?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.fbf}
                onChange={(e) => setForm({ ...form, fbf: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Participating in VUP?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.vup}
                onChange={(e) => setForm({ ...form, vup: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Household conflict?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.ese_haba_hari_amakimbirane}
                onChange={(e) => setForm({ ...form, ese_haba_hari_amakimbirane: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Safe water?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.water}
                onChange={(e) => setForm({ ...form, water: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Handwashing facility?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.handwash}
                onChange={(e) => setForm({ ...form, handwash: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Toilet access?</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.toilet}
                onChange={(e) => setForm({ ...form, toilet: e.target.value })}
              >
                <option value="Yego">Yego</option>
                <option value="Oya">Oya</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 font-semibold">Submit Assessment</Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => navigate("/chw")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
