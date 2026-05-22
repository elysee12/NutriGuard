import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Building2, Plus } from "lucide-react";
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
      <div className="p-6 lg:p-8 max-w-7xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <PageHeader
              title={t('admin.health_centers_title')}
              description={t('admin.health_centers_desc')}
            />
          </div>
          <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> {t('admin.add_center')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('admin.add_center')}</DialogTitle>
                  <DialogDescription>
                    {t('admin.add_center_desc')}
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 pt-4" onSubmit={handleCreateCenter}>
                  <div className="space-y-2">
                    <Label htmlFor="center-name">{t('admin.center_name')}</Label>
                    <Input
                      id="center-name"
                      value={newCenterName}
                      onChange={(e) => setNewCenterName(e.target.value)}
                      placeholder="e.g. Kicukiro Health Center"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="center-location">{t('admin.location')}</Label>
                    <Input
                      id="center-location"
                      value={newCenterLocation}
                      onChange={(e) => setNewCenterLocation(e.target.value)}
                      placeholder="e.g. Kicikiro, Kigali"
                      className="h-12"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={saving}>
                      {saving ? t('common.saving') : t('admin.save_center')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              if (!open) {
                closeEditModal();
              } else if (selectedCenter) {
                setIsEditDialogOpen(true);
              }
            }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('admin.edit_center')}</DialogTitle>
                  <DialogDescription>
                    {t('admin.edit_center_desc')}
                  </DialogDescription>
                </DialogHeader>
                <form className="grid gap-4 pt-4" onSubmit={handleUpdateCenter}>
                  <div className="space-y-2">
                    <Label htmlFor="edit-center-name">{t('admin.center_name')}</Label>
                    <Input
                      id="edit-center-name"
                      value={editCenterName}
                      onChange={(e) => setEditCenterName(e.target.value)}
                      placeholder="e.g. Kicukiro Health Center"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-center-location">{t('admin.location')}</Label>
                    <Input
                      id="edit-center-location"
                      value={editCenterLocation}
                      onChange={(e) => setEditCenterLocation(e.target.value)}
                      placeholder="e.g. Kicikiro, Kigali"
                      className="h-12"
                    />
                  </div>
                  <div className="flex justify-between gap-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={updating || !selectedCenter}>
                      {updating ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : centers.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.no_results')}</div>
        ) : (
          <div className="grid gap-4">
            {centers.map((center) => (
              <div key={center.id} className="bg-card rounded-xl border shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{center.name}</h3>
                      <p className="text-sm text-muted-foreground">{center.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(center)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteCenter(center.id)}
                        disabled={deleteLoadingId === center.id}
                      >
                        {deleteLoadingId === center.id ? t('common.deleting') : t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.users')}</p>
                    <p className="text-sm font-medium text-foreground">{center._count.users}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.children')}</p>
                    <p className="text-sm font-medium text-foreground">{center._count.children}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
