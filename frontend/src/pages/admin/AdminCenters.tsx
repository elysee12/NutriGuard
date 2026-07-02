import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Users, Baby } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface HealthCenter {
  id: number;
  name: string;
  location: string;
  _count: { users: number; children: number };
}

export default function AdminCenters() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterLocation, setNewCenterLocation] = useState("");
  const [editCenterName, setEditCenterName] = useState("");
  const [editCenterLocation, setEditCenterLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/health-center`);
      if (response.ok) {
        setCenters(await response.json());
      }
    } catch (error) {
      console.error('Failed to load health centers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [API_URL]);

  const openEditModal = (center: HealthCenter) => {
    setSelectedCenter(center);
    setEditCenterName(center.name);
    setEditCenterLocation(center.location);
    setIsEditDialogOpen(true);
  };

  const closeEditModal = () => {
    setIsEditDialogOpen(false);
    setSelectedCenter(null);
    setEditCenterName("");
    setEditCenterLocation("");
  };

  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterName.trim() || !newCenterLocation.trim()) {
      toast.error('Please provide both name and location.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/health-center`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: newCenterName.trim(),
          location: newCenterLocation.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.update_failed'));
      }

      toast.success(t('admin.center_added'));
      setIsDialogOpen(false);
      setNewCenterName("");
      setNewCenterLocation("");
      await fetchCenters();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('admin.update_failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;
    if (!editCenterName.trim() || !editCenterLocation.trim()) {
      toast.error('Please provide both name and location.');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/health-center/${selectedCenter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: editCenterName.trim(),
          location: editCenterLocation.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.update_failed'));
      }

      const updatedCenter = await response.json();
      setCenters((prev) => prev.map((center) =>
        center.id === updatedCenter.id
          ? { ...center, ...updatedCenter, _count: updatedCenter._count ?? center._count }
          : center,
      ));
      toast.success(t('admin.center_updated'));
      closeEditModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('admin.update_failed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCenter = async (id: number) => {
    if (!token) return;
    const shouldDelete = window.confirm(t('common.confirm_delete'));
    if (!shouldDelete) return;

    setDeleteLoadingId(id);
    try {
      const response = await fetch(`${API_URL}/health-center/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.delete_failed'));
      }

      setCenters((prev) => prev.filter((center) => center.id !== id));
      toast.success(t('admin.center_deleted'));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('admin.delete_failed'));
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-white/80" />
                  <span className="text-white/90 text-sm font-semibold tracking-wider">FACILITY MANAGEMENT</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {t('admin.health_centers_title', 'Health Centers')}
                </h1>
                <p className="text-white/90 text-lg">
                  {t('admin.health_centers_desc', 'Manage health center network and facility assignments')}
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 shadow-xl font-bold h-12 px-6 rounded-xl">
                    <Plus className="h-5 w-5 mr-2" /> {t('admin.add_center')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-700" />
                      </div>
                      <DialogTitle className="text-xl">{t('admin.add_center')}</DialogTitle>
                    </div>
                    <DialogDescription>
                      {t('admin.add_center_desc', 'Add a new health center to the system')}
                    </DialogDescription>
                  </DialogHeader>
                  <form className="grid gap-4 pt-4" onSubmit={handleCreateCenter}>
                    <div className="space-y-2">
                      <Label htmlFor="center-name" className="font-bold text-slate-900">{t('admin.center_name')}</Label>
                      <Input
                        id="center-name"
                        value={newCenterName}
                        onChange={(e) => setNewCenterName(e.target.value)}
                        placeholder="e.g. Kicukiro Health Center"
                        className="h-11 border-slate-300 focus-visible:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="center-location" className="font-bold text-slate-900">{t('admin.location')}</Label>
                      <Input
                        id="center-location"
                        value={newCenterLocation}
                        onChange={(e) => setNewCenterLocation(e.target.value)}
                        placeholder="e.g. Kicukiro, Kigali"
                        className="h-11 border-slate-300 focus-visible:ring-purple-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" type="button" className="h-11 rounded-xl font-bold">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={saving} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 rounded-xl font-bold">
                        {saving ? t('common.saving') : t('admin.save_center')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4 animate-pulse">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          ) : centers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t('common.no_results')}</p>
              <p className="text-slate-500 text-sm mt-1">No health centers registered yet</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {centers.map((center) => (
                <div key={center.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{center.name}</h3>
                        <p className="text-sm text-slate-600 mt-0.5">{center.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(center)}
                        className="h-9 rounded-lg font-bold border-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg font-bold border-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleDeleteCenter(center.id)}
                        disabled={deleteLoadingId === center.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteLoadingId === center.id ? t('common.deleting') : t('common.delete')}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('admin.users')}</p>
                        <p className="text-lg font-bold text-slate-900">{center._count.users}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{t('admin.children')}</p>
                        <p className="text-lg font-bold text-slate-900">{center._count.children}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          closeEditModal();
        } else if (selectedCenter) {
          setIsEditDialogOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-purple-700" />
              </div>
              <DialogTitle className="text-xl">{t('admin.edit_center')}</DialogTitle>
            </div>
            <DialogDescription>
              {t('admin.edit_center_desc', 'Update health center information')}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 pt-4" onSubmit={handleUpdateCenter}>
            <div className="space-y-2">
              <Label htmlFor="edit-center-name" className="font-bold text-slate-900">{t('admin.center_name')}</Label>
              <Input
                id="edit-center-name"
                value={editCenterName}
                onChange={(e) => setEditCenterName(e.target.value)}
                placeholder="e.g. Kicukiro Health Center"
                className="h-11 border-slate-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-center-location" className="font-bold text-slate-900">{t('admin.location')}</Label>
              <Input
                id="edit-center-location"
                value={editCenterLocation}
                onChange={(e) => setEditCenterLocation(e.target.value)}
                placeholder="e.g. Kicukiro, Kigali"
                className="h-11 border-slate-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button" className="h-11 rounded-xl font-bold">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={updating || !selectedCenter} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 rounded-xl font-bold">
                {updating ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
