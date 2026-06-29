import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRwandaLocations } from "@/hooks/useRwandaLocations";
import { LocationFields } from "@/components/LocationFields";
import { Search, AlertCircle, CheckCircle2, Pencil, Trash2, X, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { FaUser, FaCalendar, FaVenusMars, FaMapMarkerAlt, FaHome, FaBuilding, FaUserMd } from "react-icons/fa";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { API_URL } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { formatChildId } from "@/lib/utils";

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
  province: string;
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
    chwId: 0,
  });

  // Use Rwanda locations hook
  const location = useRwandaLocations();

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [chws, setChws] = useState<CHWRecord[]>([]);
  const [searchingChws, setSearchingChws] = useState(false);
  const [selectedChw, setSelectedChw] = useState<CHWRecord | null>(null);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const [availableCHWs, setAvailableCHWs] = useState<CHWRecord[]>([]);
  const [loadingCHWs, setLoadingCHWs] = useState(false);

  const [isDuplicate, setIsDuplicate] = useState(false);
  const [searchingDuplicates, setSearchingDuplicates] = useState(false);

  // Real-time duplicate check
  useEffect(() => {
    const checkDuplicate = async () => {
      if (form.name.length > 2 && form.motherName.length > 2) {
        setSearchingDuplicates(true);
        try {
          const response = await fetch(`${API_URL}/child/search?name=${encodeURIComponent(form.name)}&motherName=${encodeURIComponent(form.motherName)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const duplicateFound = data.some((child: any) => 
              child.name.toLowerCase() === form.name.toLowerCase() && 
              child.motherName.toLowerCase() === form.motherName.toLowerCase()
            );
            setIsDuplicate(duplicateFound);
          }
        } catch (error) {
          console.error("Duplicate check failed:", error);
        } finally {
          setSearchingDuplicates(false);
        }
      } else {
        setIsDuplicate(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [form.name, form.motherName, token]);

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
      chwId: child.chw?.id || 0,
    });

    // Set location data
    location.setLocation({
      province: child.province || "",
      district: child.district,
      sector: child.sector,
      cell: child.cell,
      village: child.village,
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
    if (!location.province || !location.district || !location.sector || !location.cell || !location.village) {
      toast.error(t('assessment.location_required_error', "Please select all location fields"));
      return;
    }

    setSearchingChws(true);
    setChws([]);
    setSelectedChw(null);

    try {
      const params = new URLSearchParams({
        district: location.district,
        sector: location.sector,
        cell: location.cell,
        village: location.village,
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
      chwId: 0,
    });
    location.resetLocation();
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

    if (!location.province.trim() || !location.district.trim() || !location.sector.trim() || !location.cell.trim() || !location.village.trim()) {
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
          province: location.province.trim(),
          district: location.district.trim(),
          sector: location.sector.trim(),
          cell: location.cell.trim(),
          village: location.village.trim(),
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
        setIsRegisterModalOpen(false);
      }

      // Reset form
      setForm((prev) => ({
        ...prev,
        name: "",
        dob: "",
        gender: "M",
        motherName: "",
        chwId: 0,
      }));
      setSelectedChw(null);
      setChws([]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.motherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredChildren.length / entriesPerPage);
  const currentEntries = filteredChildren.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <PageHeader 
            title={t('nav.register_child')} 
            description={t('assessment.register_child_desc', "Register a child and assign their CHW provider")}
          />
          <Button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 h-11 px-6 rounded-lg shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>{t('assessment.new_child', 'New Child')}</span>
          </Button>
        </div>

        {/* Registered Children */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden mb-8">
          <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-card-foreground">{t('assessment.registered_children')}</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('common.search', 'Search by name...')} 
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          {loadingChildren ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{searchTerm ? t('assessment.no_matches', 'No matching records found') : t('assessment.no_children')}</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Card List */}
              <div className="block sm:hidden divide-y">
                {currentEntries.map((child) => (
                  <div key={child.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                            {formatChildId(child.id)}
                          </span>
                          <p className="font-bold text-foreground text-base">{child.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('assessment.mother')}: {child.motherName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          DOB: {new Date(child.dob).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(child)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => confirmDelete(child.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold">{t('location.location_title')}</p>
                        <p className="font-medium truncate">{child.village}, {child.cell}</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground mb-1 uppercase tracking-tighter font-bold">{t('common.registered')}</p>
                        <p className="font-medium">{new Date(child.registeredAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="table-header">
                    <tr>
                      {[
                        'ID', t('common.child'), t('assessment.mother_name'), t('common.dob'), t('location.sector'), t('location.cell'), t('location.village'), t('assessment.assign_chw'), t('common.registered'), t('common.actions')
                      ].map((header) => (
                        <th key={header} className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentEntries.map((child) => (
                      <tr key={child.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-bold text-emerald-700">{formatChildId(child.id)}</td>
                        <td className="p-4 text-sm font-medium">{child.name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{child.motherName}</td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(child.dob).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-muted-foreground">{child.sector}</td>
                        <td className="p-4 text-sm text-muted-foreground">{child.cell}</td>
                        <td className="p-4 text-sm text-muted-foreground">{child.village}</td>
                        <td className="p-4 text-sm text-muted-foreground">{child.chw?.name || t('common.not_assigned')}</td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(child.registeredAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredChildren.length)} of {filteredChildren.length} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('common.previous', 'Previous')}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      {t('common.next', 'Next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Register Child Modal */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('nav.register_child')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FaUser className="h-4 w-4 text-primary" />
                  {t('assessment.child_info')}
                </h3>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FaUser className="h-3.5 w-3.5 text-primary" />
                    {t('assessment.full_name')}
                  </Label>
                  <Input 
                    icon={<FaUser className="h-4 w-4" />}
                    className={`h-11 ${isDuplicate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder={t('assessment.enter_child_name', "Enter child's name")}
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaCalendar className="h-3.5 w-3.5 text-primary" />
                      {t('common.dob')}
                    </Label>
                    <Input 
                      type="date" 
                      icon={<FaCalendar className="h-4 w-4" />}
                      className="h-11" 
                      value={form.dob} 
                      onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FaVenusMars className="h-3.5 w-3.5 text-primary" />
                      {t('common.gender')}
                    </Label>
                    <div className="relative">
                      <FaVenusMars className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm"
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="M">{t('assessment.male')}</option>
                        <option value="F">{t('assessment.female')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FaUser className="h-3.5 w-3.5 text-primary" />
                    {t('assessment.mother_name')}
                  </Label>
                  <Input 
                    icon={<FaUser className="h-4 w-4" />}
                    className={`h-11 ${isDuplicate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder={t('assessment.enter_guardian_name', "Enter guardian name")}
                    value={form.motherName} 
                    onChange={(e) => setForm({ ...form, motherName: e.target.value })} 
                    required 
                  />
                </div>

                {isDuplicate && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      {t('assessment.duplicate_error', 'A child with this name and mother name is already registered.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Location & CHW */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary" />
                  {t('assessment.location_info')}
                </h3>
                
                {/* Use LocationFields component */}
                <LocationFields
                  province={location.province}
                  district={location.district}
                  sector={location.sector}
                  cell={location.cell}
                  village={location.village}
                  provinces={location.provinces}
                  districts={location.districts}
                  sectors={location.sectors}
                  cells={location.cells}
                  villages={location.villages}
                  onProvinceChange={location.handleProvinceChange}
                  onDistrictChange={location.handleDistrictChange}
                  onSectorChange={location.handleSectorChange}
                  onCellChange={location.handleCellChange}
                  onVillageChange={location.handleVillageChange}
                  required={true}
                  showIcons={true}
                  className="space-y-4"
                />

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-primary border-primary hover:bg-primary/5"
                    onClick={searchChws}
                    disabled={!location.province || !location.district || !location.sector || !location.cell || !location.village || searchingChws}
                  >
                    {searchingChws ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        {t('common.searching')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaUserMd className="h-4 w-4" />
                        {t('assessment.search_chws')}
                      </div>
                    )}
                  </Button>
                </div>

                {/* CHW Selection */}
                {selectedChw && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm">{selectedChw.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedChw.healthCenter.name}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedChw(null);
                          setForm({ ...form, chwId: 0 });
                        }}
                        className="text-xs"
                      >
                        {t('common.change')}
                      </Button>
                    </div>
                  </div>
                )}

                {chws.length > 1 && !selectedChw && (
                  <div className="space-y-2">
                    <Label className="text-primary font-semibold flex items-center gap-2">
                      <FaUserMd className="h-3.5 w-3.5" />
                      {t('assessment.select_chw')}
                    </Label>
                    <div className="grid gap-2 max-h-32 overflow-y-auto">
                      {chws.map((chw) => (
                        <button
                          key={chw.id}
                          type="button"
                          onClick={() => handleSelectChw(chw)}
                          className="text-left p-3 border rounded-lg hover:bg-primary/5 hover:border-primary transition-colors"
                        >
                          <p className="font-medium text-sm">{chw.name}</p>
                          <p className="text-xs text-muted-foreground">{chw.email}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('common.cancel')}</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isDuplicate || searchingDuplicates}
              >
                {searchingDuplicates ? t('common.checking', 'Checking...') : t('assessment.register_button')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                
                {/* Use LocationFields component for editing */}
                <LocationFields
                  province={location.province}
                  district={location.district}
                  sector={location.sector}
                  cell={location.cell}
                  village={location.village}
                  provinces={location.provinces}
                  districts={location.districts}
                  sectors={location.sectors}
                  cells={location.cells}
                  villages={location.villages}
                  onProvinceChange={location.handleProvinceChange}
                  onDistrictChange={location.handleDistrictChange}
                  onSectorChange={location.handleSectorChange}
                  onCellChange={location.handleCellChange}
                  onVillageChange={location.handleVillageChange}
                  required={true}
                  showIcons={false}
                  className="space-y-4"
                />

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
