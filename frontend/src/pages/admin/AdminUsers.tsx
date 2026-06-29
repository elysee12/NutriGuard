import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, ShieldAlert } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  healthCenter?: { id: number; name: string };
  healthCenterId?: number | null;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}

interface HealthCenter {
  id: number;
  name: string;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    healthCenterId: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, centersRes] = await Promise.all([
          fetch(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/health-center`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
        if (centersRes.ok) {
          setHealthCenters(await centersRes.json());
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  const handleStatusChange = async (userId: number, status: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    setSubmittingUserId(userId);

    try {
      const response = await fetch(`${API_URL}/user/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t('admin.update_failed'));
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? data : user)));
      toast({
        title: status === 'APPROVED' ? t('admin.approve') : t('admin.reject'),
        description: t('admin.user_updated_desc'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || t('admin.update_failed'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingUserId(null);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      healthCenterId: user.healthCenterId?.toString() || "none",
      district: user.district || "",
      sector: user.sector || "",
      cell: user.cell || "",
      village: user.village || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !token) return;

    setUpdating(true);
    try {
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        district: editForm.district,
        sector: editForm.sector,
        cell: editForm.cell,
        village: editForm.village,
      };

      if (editForm.healthCenterId && editForm.healthCenterId !== "none") {
        updateData.healthCenterId = parseInt(editForm.healthCenterId);
      } else {
        updateData.healthCenterId = null;
      }

      const response = await fetch(`${API_URL}/user/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t('admin.update_failed'));
      }

      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? data : u)));
      setIsEditDialogOpen(false);
      toast({
        title: t('admin.user_updated'),
        description: t('admin.user_updated_desc'),
      });
    } catch (error: any) {
      toast({
        title: t('admin.update_failed'),
        description: error.message || t('admin.update_failed'),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !userToDelete) return;

    setDeleteLoadingId(userToDelete);
    try {
      const response = await fetch(`${API_URL}/user/${userToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('admin.delete_failed'));
      }

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      toast({
        title: t('admin.user_deleted'),
        description: t('admin.user_deleted_desc'),
      });
    } catch (error: any) {
      toast({
        title: t('admin.delete_failed'),
        description: error.message || t('admin.delete_failed'),
        variant: "destructive",
      });
    } finally {
      setDeleteLoadingId(null);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const confirmDeleteUser = (userId: number) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title={t('admin.user_management_title')} description={t('admin.user_management_desc')} />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : users.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.no_results')}</div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  {[t('common.name'), t('common.email'), t('common.role'), t('common.status'), t('common.health_center'), t('common.actions')].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{u.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'NURSE' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        u.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 
                        u.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{u.healthCenter?.name || t('common.na')}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700"
                              disabled={submittingUserId === u.id}
                              onClick={() => handleStatusChange(u.id, 'APPROVED')}
                            >
                              {t('admin.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-destructive border-destructive/20 hover:bg-destructive/5"
                              disabled={submittingUserId === u.id}
                              onClick={() => handleStatusChange(u.id, 'REJECTED')}
                            >
                              {t('admin.reject')}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:text-destructive"
                          disabled={deleteLoadingId === u.id}
                          onClick={() => confirmDeleteUser(u.id)}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.edit_user')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('admin.full_name')}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t('admin.email_address')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('admin.user_role')}</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.select_role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t('admin.administrator')}</SelectItem>
                    <SelectItem value="NURSE">{t('admin.nurse')}</SelectItem>
                    <SelectItem value="CHW">{t('admin.chw_worker')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('common.health_center')}</Label>
                <Select
                  value={editForm.healthCenterId}
                  onValueChange={(v) => setEditForm({ ...editForm, healthCenterId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.select_center')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('admin.no_center_assigned')}</SelectItem>
                    {healthCenters.map((hc) => (
                      <SelectItem key={hc.id} value={hc.id.toString()}>
                        {hc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-district">{t('location.district')}</Label>
                <Input
                  id="edit-district"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sector">{t('location.sector')}</Label>
                <Input
                  id="edit-sector"
                  value={editForm.sector}
                  onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cell">{t('location.cell')}</Label>
                <Input
                  id="edit-cell"
                  value={editForm.cell}
                  onChange={(e) => setEditForm({ ...editForm, cell: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-village">{t('location.village')}</Label>
                <Input
                  id="edit-village"
                  value={editForm.village}
                  onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={updating}>
                {updating ? t('admin.saving_changes') : t('admin.save_changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteUser}
        message={t('admin.delete_user_confirm')}
      />
    </DashboardLayout>
  );
}
