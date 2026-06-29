import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectWithIcon } from "@/components/ui/select-with-icon";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRwandaLocations } from "@/hooks/useRwandaLocations";
import { LocationFields } from "@/components/LocationFields";
import { API_URL } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { formatChildId } from "@/lib/utils";
import { 
  Pencil, 
  Trash2, 
  X, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  User,
  Calendar,
  Users2,
  MapPin,
  Home,
  Building2
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface ChildRecord {
  id: number;
  name: string;
  dob: string;
  gender: string;
  motherName: string;
  healthCenter: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  registeredAt: string;
}

export default function RegisterChild() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    motherName: "",
    healthCenter: user?.healthCenter || "",
  });

  // Use Rwanda locations hook
  const location = useRwandaLocations();

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

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
            // If any exact match is found
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

  // Initialize location from user data
  useEffect(() => {
    if (user && !editingChild) {
      setForm((prev) => ({
        ...prev,
        healthCenter: user.healthCenter || "",
      }));
      
      // Set location from user data if available
      if (user.province || user.district || user.sector || user.cell || user.village) {
        location.setLocation({
          province: user.province || "",
          district: user.district || "",
          sector: user.sector || "",
          cell: user.cell || "",
          village: user.village || "",
        });
      }
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
  }, [token, API_URL]);

  const handleEdit = (child: ChildRecord) => {
    setEditingChild(child);
    setForm({
      name: child.name,
      dob: new Date(child.dob).toISOString().split('T')[0],
      gender: child.gender,
      motherName: child.motherName,
      healthCenter: child.healthCenter,
    });

    // Set location data
    location.setLocation({
      province: child.province || "",
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
    });
    
    // Reset location to user defaults
    location.resetLocation();
    if (user && (user.province || user.district || user.sector || user.cell || user.village)) {
      location.setLocation({
        province: user.province || "",
        district: user.district || "",
        sector: user.sector || "",
        cell: user.cell || "",
        village: user.village || "",
      });
    }
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

      setForm((prev) => ({
        ...prev,
        name: "",
        dob: "",
        gender: "M",
        motherName: "",
      }));
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
            description={t('assessment.add_child_desc', "Add a new child under 5 to the system")} 
          />
          <Button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 h-11 px-6 rounded-lg shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>{t('assessment.new_child', 'New Child')}</span>
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-emerald-100 shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-emerald-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              {t('assessment.registered_children')}
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <Input 
                placeholder={t('common.search', 'Search by name...')} 
                className="pl-10 h-11 border-emerald-200 focus-visible:ring-emerald-500"
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
                  <thead>
                    <tr className="border-b-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
                      {[
                        'ID', t('common.child'), t('assessment.mother_name'), t('common.dob'), t('location.sector'), t('location.cell'), t('location.village'), t('common.registered'), t('common.actions')
                      ].map((header) => (
                        <th key={header} className="p-4 text-sm font-bold text-emerald-900 uppercase tracking-tight">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentEntries.map((child, index) => (
                      <tr key={child.id} className={`border-b last:border-0 transition-all hover:bg-emerald-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="p-4 text-sm font-bold text-emerald-700">{formatChildId(child.id)}</td>
                        <td className="p-4 text-sm font-semibold text-slate-900">{child.name}</td>
                        <td className="p-4 text-sm text-slate-600">{child.motherName}</td>
                        <td className="p-4 text-sm text-slate-600">{new Date(child.dob).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-slate-600">{child.sector}</td>
                        <td className="p-4 text-sm text-slate-600">{child.cell}</td>
                        <td className="p-4 text-sm text-slate-600">{child.village}</td>
                        <td className="p-4 text-sm text-slate-600">{new Date(child.registeredAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                              onClick={() => handleEdit(child)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
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
                <div className="p-4 border-t bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Showing <span className="font-bold text-emerald-700">{(currentPage - 1) * entriesPerPage + 1}</span> to <span className="font-bold text-emerald-700">{Math.min(currentPage * entriesPerPage, filteredChildren.length)}</span> of <span className="font-bold text-emerald-700">{filteredChildren.length}</span> entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 h-9 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
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
                          className={`w-9 h-9 p-0 ${currentPage === page ? 'shadow-md' : 'border-emerald-200 hover:bg-emerald-50'}`}
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
                      className="flex items-center gap-1 h-9 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('nav.register_child')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                {t('assessment.full_name')}
              </Label>
              <Input 
                icon={<User className="h-4 w-4" />}
                className={`h-11 ${isDuplicate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder={t('assessment.enter_child_name', "Enter child's name")} 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  {t('common.dob')}
                </Label>
                <Input 
                  type="date" 
                  icon={<Calendar className="h-4 w-4" />}
                  className="h-11" 
                  value={form.dob} 
                  onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-emerald-600" />
                  {t('common.gender')}
                </Label>
                <SelectWithIcon
                  icon={<Users2 className="h-4 w-4" />}
                  className="h-11"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="M">{t('assessment.male')}</option>
                  <option value="F">{t('assessment.female')}</option>
                </SelectWithIcon>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                {t('assessment.mother_name')}
              </Label>
              <Input 
                icon={<User className="h-4 w-4" />}
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

            {/* Location Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {t('assessment.location_info')}
              </h3>
              
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
                className="space-y-3"
              />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-11">{t('common.cancel')}</Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="h-11 px-6"
                disabled={isDuplicate || searchingDuplicates}
              >
                <Plus className="h-4 w-4" />
                {searchingDuplicates ? t('common.checking', 'Checking...') : t('assessment.register_button')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Child Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('assessment.edit_child_title')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                {t('assessment.full_name')}
              </Label>
              <Input 
                icon={<User className="h-4 w-4" />}
                className="h-11" 
                placeholder="Enter child's name" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  {t('common.dob')}
                </Label>
                <Input 
                  type="date" 
                  icon={<Calendar className="h-4 w-4" />}
                  className="h-11" 
                  value={form.dob} 
                  onChange={(e) => setForm({ ...form, dob: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-emerald-600" />
                  {t('common.gender')}
                </Label>
                <SelectWithIcon
                  icon={<Users2 className="h-4 w-4" />}
                  className="h-11"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="M">{t('assessment.male')}</option>
                  <option value="F">{t('assessment.female')}</option>
                </SelectWithIcon>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                {t('assessment.mother_name')}
              </Label>
              <Input 
                icon={<User className="h-4 w-4" />}
                className="h-11" 
                placeholder="Enter guardian name" 
                value={form.motherName} 
                onChange={(e) => setForm({ ...form, motherName: e.target.value })} 
                required 
              />
            </div>

            {/* Location Fields for Edit */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('assessment.location_info')}</h3>
              
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
                className="space-y-3"
              />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={cancelEdit} className="h-11">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" className="h-11 px-6">
                <Pencil className="h-4 w-4" />
                {t('assessment.update_button')}
              </Button>
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
