import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";

interface CHWRecord {
  id: number;
  name: string;
  email: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  healthCenter: {
    id: number;
    name: string;
  };
}

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
  chw?: {
    id: number;
    name: string;
  };
}

export default function NurseRegisterChild() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    motherName: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    chwId: 0,
  });

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [chws, setChws] = useState<CHWRecord[]>([]);
  const [searchingChws, setSearchingChws] = useState(false);
  const [selectedChw, setSelectedChw] = useState<CHWRecord | null>(null);

  // Load registered children
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
  }, [token, API_URL]);

  // Search for CHWs when village is entered
  const searchChws = async () => {
    if (!form.district || !form.sector || !form.cell || !form.village) {
      toast.error("Please enter District, Sector, Cell, and Village");
      return;
    }

    setSearchingChws(true);
    setChws([]);
    setSelectedChw(null);

    try {
      const params = new URLSearchParams({
        district: form.district,
        sector: form.sector,
        cell: form.cell,
        village: form.village,
      });

      const response = await fetch(`${API_URL}/user/chw/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to search CHWs');
      }

      const data: CHWRecord[] = await response.json();
      setChws(data);

      if (data.length === 0) {
        toast.error("No CHWs are assigned to this location");
      } else {
        toast.success(`Found ${data.length} CHW(s) in this location`);
        if (data.length === 1) {
          setSelectedChw(data[0]);
          setForm((prev) => ({ ...prev, chwId: data[0].id }));
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search CHWs");
    } finally {
      setSearchingChws(false);
    }
  };

  const handleSelectChw = (chw: CHWRecord) => {
    setSelectedChw(chw);
    setForm((prev) => ({
      ...prev,
      chwId: chw.id,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Child name is required");
      return;
    }

    if (!form.dob) {
      toast.error("Date of birth is required");
      return;
    }

    if (!form.motherName.trim()) {
      toast.error("Mother/Guardian name is required");
      return;
    }

    if (!form.district.trim() || !form.sector.trim() || !form.cell.trim() || !form.village.trim()) {
      toast.error("All location fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name.trim(),
          dob: form.dob,
          gender: form.gender,
          motherName: form.motherName.trim(),
          district: form.district.trim(),
          sector: form.sector.trim(),
          cell: form.cell.trim(),
          village: form.village.trim(),
          chwId: form.chwId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register child');
      }

      setChildren((prev) => [data, ...prev]);
      toast.success("Child registered successfully!");

      // Reset form
      setForm((prev) => ({
        ...prev,
        name: "",
        dob: "",
        gender: "M",
        motherName: "",
        village: "",
        chwId: 0,
      }));
      setSelectedChw(null);
      setChws([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <PageHeader 
          title="Register Child" 
          description="Register a child and assign their CHW provider by location"
        />

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Registration Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
              {/* Child Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Child Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Child's Full Name</Label>
                    <Input 
                      className="h-11" 
                      placeholder="Enter child's name" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input 
                        type="date" 
                        className="h-11" 
                        value={form.dob} 
                        onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
                    <Input 
                      className="h-11" 
                      placeholder="Enter guardian name" 
                      value={form.motherName} 
                      onChange={(e) => setForm({ ...form, motherName: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Location Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Input 
                      className="h-11" 
                      placeholder="E.g., Kigali, Huye, Muhanga" 
                      value={form.district} 
                      onChange={(e) => setForm({ ...form, district: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Input 
                        className="h-11" 
                        placeholder="E.g., Ruhunga" 
                        value={form.sector} 
                        onChange={(e) => setForm({ ...form, sector: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cell</Label>
                      <Input 
                        className="h-11" 
                        placeholder="E.g., Ruhunga" 
                        value={form.cell} 
                        onChange={(e) => setForm({ ...form, cell: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Village</Label>
                    <div className="flex gap-2">
                      <Input 
                        className="h-11 flex-1" 
                        placeholder="Enter village name" 
                        value={form.village} 
                        onChange={(e) => setForm({ ...form, village: e.target.value })} 
                        required 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4"
                        onClick={searchChws}
                        disabled={searchingChws || !form.district || !form.sector || !form.cell || !form.village}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Register Child
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12" 
                  onClick={() => navigate("/nurse")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Right: CHW Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">CHW Assignment</h3>

              {selectedChw ? (
                <div className="bg-white rounded-lg p-4 border-2 border-emerald-500 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedChw.name}</p>
                      <p className="text-sm text-gray-600">{selectedChw.email}</p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 bg-gray-50 rounded p-2">
                    <p><span className="font-medium">Health Center:</span> {selectedChw.healthCenter.name}</p>
                    <p><span className="font-medium">Location:</span> {selectedChw.village}, {selectedChw.cell}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm"
                    onClick={() => {
                      setSelectedChw(null);
                      setForm((prev) => ({ ...prev, chwId: 0 }));
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              ) : chws.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chws.map((chw) => (
                    <button
                      key={chw.id}
                      type="button"
                      onClick={() => handleSelectChw(chw)}
                      className="w-full text-left bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <p className="font-medium text-gray-900 group-hover:text-blue-600">{chw.name}</p>
                      <p className="text-xs text-gray-500">{chw.email}</p>
                      <p className="text-xs text-gray-600 mt-1">{chw.healthCenter.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {searchingChws 
                      ? "Searching CHWs..." 
                      : "Enter location details and click Search to find CHWs"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registered Children */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Children</h3>
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
                      "Child", "DOB", "Gender", "Village", "CHW Provider", "Registered"
                    ].map((header) => (
                      <th key={header} className="p-3 text-sm font-medium text-muted-foreground">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{child.name}</td>
                      <td className="p-3 text-sm">{new Date(child.dob).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">{child.gender === "M" ? "Male" : "Female"}</td>
                      <td className="p-3 text-sm">{child.village}</td>
                      <td className="p-3 text-sm">{child.chw?.name || "Unassigned"}</td>
                      <td className="p-3 text-sm">{new Date(child.registeredAt).toLocaleDateString()}</td>
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
