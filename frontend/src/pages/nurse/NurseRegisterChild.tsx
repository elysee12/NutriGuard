import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Search, AlertCircle, CheckCircle2, Pencil, Trash2, X } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { API_URL } from "@/lib/api";
import locationsData from "@/assets/rwanda_locations.json";
import { useTranslation } from "react-i18next";

interface LocationItem {
  type: string;
  name: string;
}

interface District extends LocationItem {
  sectors: Sector[];
}

interface Sector extends LocationItem {
  cells: Cell[];
}

interface Cell extends LocationItem {
  villages: string[];
}

interface Province extends LocationItem {
  districts: District[];
}

interface LocationData {
  items: Province[];
}

const typedLocations = locationsData as LocationData;

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
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    motherName: "",
    district: "Kicukiro",
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
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<number | null>(null);

  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [sectorsList, setSectorsList] = useState<string[]>([]);
  const [cellsList, setCellsList] = useState<string[]>([]);
  const [villagesList, setVillagesList] = useState<string[]>([]);
  const [availableCHWs, setAvailableCHWs] = useState<CHWRecord[]>([]);
  const [loadingCHWs, setLoadingCHWs] = useState(false);

  // Load all CHWs for the nurse's health center
  useEffect(() => {
    const loadCHWs = async () => {
      if (!token) return;
      setLoadingCHWs(true);
      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const allUsers: CHWRecord[] = await response.json();
          // Filter CHWs from the same health center
          const nurseHCId = user?.healthCenterId;
          const filteredCHWs = allUsers.filter(u => 
            u.role === 'CHW' && 
            u.healthCenter?.id === nurseHCId &&
            u.status === 'APPROVED'
          );
          setAvailableCHWs(filteredCHWs);
        }
      } catch (error) {
        console.error("Failed to load CHWs:", error);
      } finally {
        setLoadingCHWs(false);
      }
    };
    loadCHWs();
  }, [token, user?.healthCenterId]);

  // Initialize districts
  useEffect(() => {
    // Only Kicukiro for this project
    setDistrictsList(["Kicukiro"]);
  }, []);

  // Update sectors when district changes
  useEffect(() => {
    if (form.district) {
      const districtData = typedLocations.items
        .flatMap((p) => p.districts)
        .find((d) => d.name === form.district);
      setSectorsList(districtData ? districtData.sectors.map((s) => s.name).sort() : []);
    } else {
      setSectorsList([]);
    }
  }, [form.district]);

  // Update cells when sector changes
  useEffect(() => {
    if (form.district && form.sector) {
      const districtData = typedLocations.items
        .flatMap((p) => p.districts)
        .find((d) => d.name === form.district);
      const sectorData = districtData?.sectors.find((s) => s.name === form.sector);
      setCellsList(sectorData ? sectorData.cells.map((c) => c.name).sort() : []);
    } else {
      setCellsList([]);
    }
  }, [form.district, form.sector]);

  // Update villages when cell changes
  useEffect(() => {
    if (form.district && form.sector && form.cell) {
      const districtData = typedLocations.items
        .flatMap((p) => p.districts)
        .find((d) => d.name === form.district);
      const sectorData = districtData?.sectors.find((s) => s.name === form.sector);
      const cellData = sectorData?.cells.find((c) => c.name === form.cell);
      setVillagesList(cellData ? [...cellData.villages].sort() : []);
    } else {
      setVillagesList([]);
    }
  }, [form.district, form.sector, form.cell]);

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
          throw new Error(t('assessment.load_children_failed', 'Unable to load registered children'));
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
  }, [token, API_URL, t]);

  const handleEdit = (child: ChildRecord) => {
    setEditingChild(child);
    setForm({
      name: child.name,
      dob: new Date(child.dob).toISOString().split('T')[0],
      gender: child.gender,
      motherName: child.motherName,
      district: child.district,
      sector: child.sector,
      cell: child.cell,
      village: child.village,
      chwId: child.chw?.id || 0,
    });
    
    if (child.chw) {
      // Mock a CHW record for the selected state
      setSelectedChw({
        id: child.chw.id,
        name: child.chw.name,
        email: "",
        district: child.district,
        sector: child.sector,
        cell: child.cell,
        village: child.village,
        healthCenter: { id: 0, name: t('assessment.assigned_chw', "Assigned CHW") }
      });
    } else {
      setSelectedChw(null);
    }
    
    setIsEditDialogOpen(true);
  };

  // Search for CHWs when village is entered
  const searchChws = async () => {
    if (!form.district || !form.sector || !form.cell || !form.village) {
      toast.error(t('assessment.location_required_error', "Please enter District, Sector, Cell, and Village"));
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
        throw new Error(t('assessment.chw_search_failed', 'Unable to search CHWs'));
      }

      const data: CHWRecord[] = await response.json();
      setChws(data);

      if (data.length === 0) {
        toast.error(t('assessment.no_chws_location', "No CHWs are assigned to this location"));
      } else {
        toast.success(t('assessment.chws_found', { count: data.length }, `Found ${data.length} CHW(s) in this location`));
        if (data.length === 1) {
          setSelectedChw(data[0]);
          setForm((prev) => ({ ...prev, chwId: data[0].id }));
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('assessment.chw_search_failed', "Failed to search CHWs"));
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
        throw new Error(t('assessment.delete_child_failed', 'Failed to delete child'));
      }

      setChildren((prev) => prev.filter((c) => c.id !== childToDelete));
      toast.success(t('assessment.child_deleted_success', "Child record deleted successfully"));
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
      district: "Kicukiro",
      sector: "",
      cell: "",
      village: "",
      chwId: 0,
    });
    setSelectedChw(null);
    setChws([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t('assessment.name_required', "Child name is required"));
      return;
    }

    if (!form.dob) {
      toast.error(t('assessment.dob_required', "Date of birth is required"));
      return;
    }

    if (!form.motherName.trim()) {
      toast.error(t('assessment.mother_name_required', "Mother/Guardian name is required"));
      return;
    }

    if (!form.district.trim() || !form.sector.trim() || !form.cell.trim() || !form.village.trim()) {
      toast.error(t('assessment.location_all_required', "All location fields are required"));
      return;
    }

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
        throw new Error(data.message || t('assessment.register_failed', { action: editingChild ? 'update' : 'register' }, `Failed to ${editingChild ? 'update' : 'register'} child`));
      }

      if (editingChild) {
        setChildren((prev) => prev.map((c) => (c.id === editingChild.id ? data : c)));
        toast.success(t('assessment.child_updated_success', "Child record updated successfully!"));
        setEditingChild(null);
        setIsEditDialogOpen(false);
      } else {
        setChildren((prev) => [data, ...prev]);
        toast.success(t('assessment.child_registered_success', "Child registered successfully!"));
      }

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
          title={t('nav.register_child')} 
          description={t('assessment.register_child_desc', "Register a child and assign their CHW provider")}
        />

        {/* Main Form */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Registration Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-sm p-6 space-y-5">
              {/* Child Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">{t('assessment.child_info')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('assessment.full_name')}</Label>
                    <Input 
                      className="h-11" 
                      placeholder={t('assessment.enter_child_name', "Enter child's name")} 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('common.dob')}</Label>
                      <Input 
                        type="date" 
                        className="h-11" 
                        value={form.dob} 
                        onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('common.gender')}</Label>
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="M">{t('assessment.male')}</option>
                        <option value="F">{t('assessment.female')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('assessment.mother_name')}</Label>
                    <Input 
                      className="h-11" 
                      placeholder={t('assessment.enter_guardian_name', "Enter guardian name")} 
                      value={form.motherName} 
                      onChange={(e) => setForm({ ...form, motherName: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">{t('assessment.location_info')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('location.district')}</Label>
                    <select
                      className="flex h-11 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                      value={form.district}
                      disabled
                      required
                    >
                      <option value="Kicukiro">Kicukiro</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('location.sector')}</Label>
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.sector}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            sector: e.target.value,
                            cell: "",
                            village: "",
                          })
                        }
                        required
                        disabled={!form.district}
                      >
                        <option value="">{t('location.select_sector')}</option>
                        {sectorsList.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('location.cell')}</Label>
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={form.cell}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            cell: e.target.value,
                            village: "",
                          })
                        }
                        required
                        disabled={!form.sector}
                      >
                        <option value="">{t('location.select_cell')}</option>
                        {cellsList.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('location.village')}</Label>
                    <select
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={form.village}
                      onChange={(e) => setForm({ ...form, village: e.target.value })}
                      required
                      disabled={!form.cell}
                    >
                      <option value="">{t('location.select_village')}</option>
                      {villagesList.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-emerald-700 font-semibold">{t('assessment.assign_chw')}</Label>
                    <select
                      className="flex h-11 w-full rounded-lg border-2 border-emerald-100 bg-emerald-50/30 px-3 py-2 text-sm focus:border-emerald-500 transition-colors"
                      value={form.chwId}
                      onChange={(e) => setForm({ ...form, chwId: Number(e.target.value) })}
                      required
                    >
                      <option value="">{t('assessment.select_chw')}</option>
                      {availableCHWs.map((chw) => (
                        <option key={chw.id} value={chw.id}>
                          {chw.name} ({chw.sector}, {chw.cell}, {chw.village})
                        </option>
                      ))}
                    </select>
                    {loadingCHWs && <p className="text-xs text-muted-foreground animate-pulse">{t('common.loading')}</p>}
                    {!loadingCHWs && availableCHWs.length === 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {t('assessment.no_chws_found')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {t('assessment.register_button')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12" 
                  onClick={() => navigate("/nurse")}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Registered Children */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">{t('assessment.registered_children')}</h3>
          {loadingChildren ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : children.length === 0 ? (
            <p className="text-muted-foreground">{t('assessment.no_children')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {[
                      t('common.child'), t('common.dob'), t('common.gender'), t('location.village'), t('assessment.assign_chw'), t('common.registered', 'Registered'), t('common.actions')
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
                      <td className="p-3 text-sm">{child.gender === "M" ? t('assessment.male') : t('assessment.female')}</td>
                      <td className="p-3 text-sm">{child.village}</td>
                      <td className="p-3 text-sm">{child.chw?.name || t('common.not_assigned')}</td>
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('assessment.edit_child_title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('assessment.child_info')}</h3>
                <div className="space-y-2">
                  <Label>{t('assessment.full_name')}</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('common.dob')}</Label>
                    <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.gender')}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="M">{t('assessment.male')}</option>
                      <option value="F">{t('assessment.female')}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('assessment.mother_name')}</Label>
                  <Input value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} required />
                </div>
              </div>

              {/* Right Column: Location & CHW */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('assessment.location_info')}</h3>
                <div className="space-y-2">
                  <Label>{t('location.district')}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    value={form.district}
                    disabled
                    required
                  >
                    <option value="Kicukiro">Kicukiro</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('location.sector')}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.sector}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sector: e.target.value,
                          cell: "",
                          village: "",
                        })
                      }
                      required
                      disabled={!form.district}
                    >
                      <option value="">{t('location.select_sector')}</option>
                      {sectorsList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('location.cell')}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.cell}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cell: e.target.value,
                          village: "",
                        })
                      }
                      required
                      disabled={!form.sector}
                    >
                      <option value="">{t('location.select_cell')}</option>
                      {cellsList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('location.village')}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.village}
                    onChange={(e) => setForm({ ...form, village: e.target.value })}
                    required
                    disabled={!form.cell}
                  >
                    <option value="">{t('location.select_village')}</option>
                    {villagesList.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-emerald-700 font-semibold text-xs uppercase tracking-wider">{t('assessment.assign_chw')}</Label>
                  <select
                    className="flex h-10 w-full rounded-md border-2 border-emerald-100 bg-emerald-50/30 px-3 py-2 text-sm focus:border-emerald-500 transition-colors"
                    value={form.chwId}
                    onChange={(e) => setForm({ ...form, chwId: Number(e.target.value) })}
                    required
                  >
                    <option value="">{t('assessment.select_chw')}</option>
                    {availableCHWs.map((chw) => (
                      <option key={chw.id} value={chw.id}>
                        {chw.name} ({chw.village})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CHW Selection in Modal */}
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="font-semibold text-sm mb-3">{t('assessment.assign_chw')}</h3>
              {selectedChw ? (
                <div className="flex items-center justify-between bg-white p-3 rounded border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedChw.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedChw.healthCenter.name}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedChw(null); setForm({ ...form, chwId: 0 }); }}>
                    {t('common.edit')}
                  </Button>
                </div>
              ) : chws.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {chws.map(chw => (
                    <button
                      key={chw.id}
                      type="button"
                      onClick={() => handleSelectChw(chw)}
                      className="text-left p-2 text-xs border rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    >
                      <p className="font-semibold">{chw.name}</p>
                      <p className="text-muted-foreground truncate">{chw.email}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-2">
                  {searchingChws ? t('common.loading') : t('assessment.search_village_chw', "Search village to see available CHWs")}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={cancelEdit}>{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">{t('assessment.update_button')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        message={t('assessment.delete_confirm_msg')}
      />
    </DashboardLayout>
  );
}
