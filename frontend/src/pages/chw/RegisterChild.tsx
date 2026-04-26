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
import { Pencil, Trash2, X } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

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
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (user && !editingChild) {
      setForm((prev) => ({
        ...prev,
        healthCenter: user.healthCenter || "",
        district: user.district || "",
        sector: user.sector || "",
        cell: user.cell || "",
        village: user.village || "",
      }));
    }
  }, [user, editingChild]);

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

  const handleEdit = (child: ChildRecord) => {
    setEditingChild(child);
    setForm({
      name: child.name,
      dob: new Date(child.dob).toISOString().split('T')[0],
      gender: child.gender,
      motherName: child.motherName,
      healthCenter: child.healthCenter,
      district: child.district,
      sector: child.sector,
      cell: child.cell,
      village: child.village,
    });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (id: number) => {
    setChildToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!childToDelete) return;
    try {
      const response = await fetch(`${API_URL}/child/${childToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete child');
      }

      setChildren((prev) => prev.filter((c) => c.id !== childToDelete));
      toast.success("Child record deleted successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleteDialogOpen(false);
      setChildToDelete(null);
    }
  };

  const cancelEdit = () => {
    setEditingChild(null);
    setIsEditDialogOpen(false);
    setForm({
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingChild ? `${API_URL}/child/${editingChild.id}` : `${API_URL}/child`;
      const method = editingChild ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        throw new Error(data.message || `Failed to ${editingChild ? 'update' : 'register'} child`);
      }

      if (editingChild) {
        setChildren((prev) => prev.map((c) => (c.id === editingChild.id ? data : c)));
        toast.success("Child record updated successfully!");
        setEditingChild(null);
        setIsEditDialogOpen(false);
      } else {
        setChildren((prev) => [data, ...prev]);
        toast.success("Child registered successfully!");
      }

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
        <PageHeader 
          title="Register Child" 
          description="Add a new child under 5 to the system" 
        />
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
            <Button type="submit" className="flex-1 h-12 font-semibold">
              Register Child
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={() => navigate("/chw")}>
              Cancel
            </Button>
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
                      "Child", "DOB", "Sector", "Cell", "Village", "Registered", "Actions"
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
                      <td className="p-3 text-sm">{child.sector}</td>
                      <td className="p-3 text-sm">{child.cell}</td>
                      <td className="p-3 text-sm">{child.village}</td>
                      <td className="p-3 text-sm">{new Date(child.registeredAt).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(child)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => confirmDelete(child.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Child Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Child Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Child's Full Name</Label>
              <Input className="h-11" placeholder="Enter child's name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" className="h-11" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
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
              <Input className="h-11" placeholder="Enter guardian name" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>District</Label>
                <Input className="h-11" value={form.district} disabled />
              </div>
              <div className="space-y-2">
                <Label>Health Center</Label>
                <Input className="h-11" value={form.healthCenter} disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input className="h-11" value={form.sector} disabled />
              </div>
              <div className="space-y-2">
                <Label>Cell</Label>
                <Input className="h-11" value={form.cell} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Village</Label>
              <Input
                className="h-11"
                placeholder="Enter village"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Update Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this child record?"
      />
    </DashboardLayout>
  );
}
