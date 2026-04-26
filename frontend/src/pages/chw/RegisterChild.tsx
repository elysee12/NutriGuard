import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

interface ChildRecord {
  id: number;
  name: string;
  dob: string;
  gender: string;
  motherName: string;
  healthCenter: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  registeredAt: string;
}

export default function RegisterChild() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    motherName: "",
    healthCenter: user?.healthCenter || "",
    district: user?.district || "",
    sector: user?.sector || "",
    cell: user?.cell || "",
    village: user?.village || "",
  });

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        healthCenter: user.healthCenter || "",
        district: user.district || "",
        sector: user.sector || "",
        cell: user.cell || "",
        village: user.village || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadChildren = async () => {
      if (!token) {
        setChildren([]);
        setLoadingChildren(false);
        return;
      }

      setLoadingChildren(true);
      try {
        const response = await fetch(`${API_URL}/child`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load registered children');
        }

        const data: ChildRecord[] = await response.json();
        setChildren(data);
      } catch (error) {
        console.error(error);
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    };

    loadChildren();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: form.name,
          dob: form.dob,
          gender: form.gender,
          motherName: form.motherName,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          village: form.village,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register child');
      }

      setChildren((prev) => [data, ...prev]);
      toast.success("Child registered successfully!");

      setForm((prev) => ({
        ...prev,
        name: "",
        dob: "",
        gender: "M",
        motherName: "",
        village: "",
      }));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <PageHeader title="Register Child" description="Add a new child under 5 to the system" />
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <Label>Child's Full Name</Label>
            <Input className="h-12" placeholder="Enter child's name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" className="h-12" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mother/Guardian Name</Label>
            <Input className="h-12" placeholder="Enter guardian name" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>District</Label>
              <Input className="h-12" value={form.district} disabled />
            </div>
            <div className="space-y-2">
              <Label>Health Center</Label>
              <Input className="h-12" value={form.healthCenter} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sector</Label>
              <Input className="h-12" value={form.sector} disabled />
            </div>
            <div className="space-y-2">
              <Label>Cell</Label>
              <Input className="h-12" value={form.cell} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Village</Label>
            <Input
              className="h-12"
              placeholder="Enter village"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 font-semibold">Register Child</Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => navigate("/chw")}>Cancel</Button>
          </div>
        </form>

        <div className="mt-8 bg-card rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Children (CHW)</h3>
          {loadingChildren ? (
            <p className="text-muted-foreground">Loading registered children...</p>
          ) : children.length === 0 ? (
            <p className="text-muted-foreground">No children registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {[
                      "Child", "DOB", "Sector", "Cell", "Village", "Registered"
                    ].map((header) => (
                      <th key={header} className="p-3 text-sm font-medium text-muted-foreground">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{child.name}</td>
                      <td className="p-3 text-sm">{child.dob}</td>
                      <td className="p-3 text-sm">{child.sector}</td>
                      <td className="p-3 text-sm">{child.cell}</td>
                      <td className="p-3 text-sm">{child.village}</td>
                      <td className="p-3 text-sm">{child.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
