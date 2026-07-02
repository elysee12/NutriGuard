import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, ShieldAlert, Users, CheckCircle, XCircle } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">USER MANAGEMENT</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('admin.user_management_title', 'User Management')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('admin.user_management_desc', 'Manage system users, approve registrations, and assign roles')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4 animate-pulse">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t('common.no_results')}</p>
              <p className="text-slate-500 text-sm mt-1">No users found in the system</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">System Users</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Showing {users.length} registered user{users.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {[t('common.name'), t('common.email'), t('common.role'), t('common.status'), t('common.health_center'), t('common.actions')].map((h) => (
                        <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                              <span className="text-purple-700 font-bold text-sm">{u.name[0]}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{u.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.role === 'NURSE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                            u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            u.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{u.healthCenter?.name || t('common.na')}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {u.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={submittingUserId === u.id}
                                  onClick={() => handleStatusChange(u.id, 'APPROVED')}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg shadow-md h-9"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {submittingUserId === u.id ? t('admin.approving') : t('admin.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={submittingUserId === u.id}
                                  onClick={() => handleStatusChange(u.id, 'REJECTED')}
                                  className="border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg h-9"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {submittingUserId === u.id ? t('admin.rejecting') : t('admin.reject')}
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 hover:bg-purple-50 hover:text-purple-700"
                              onClick={() => openEditDialog(u)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-700"
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
            </div>
          )}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-purple-700" />
              </div>
              <DialogTitle className="text-xl">{t('admin.edit_user')}</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="font-bold text-slate-900">{t('admin.full_name')}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="font-bold text-slate-900">{t('admin.email_address')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-900">{t('admin.user_role')}</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger className="h-11 border-slate-300 focus:ring-purple-500">
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
                <Label className="font-bold text-slate-900">{t('common.health_center')}</Label>
                <Select
                  value={editForm.healthCenterId}
                  onValueChange={(v) => setEditForm({ ...editForm, healthCenterId: v })}
                >
                  <SelectTrigger className="h-11 border-slate-300 focus:ring-purple-500">
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
                <Label htmlFor="edit-district" className="font-bold text-slate-900">{t('location.district')}</Label>
                <Input
                  id="edit-district"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sector" className="font-bold text-slate-900">{t('location.sector')}</Label>
                <Input
                  id="edit-sector"
                  value={editForm.sector}
                  onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cell" className="font-bold text-slate-900">{t('location.cell')}</Label>
                <Input
                  id="edit-cell"
                  value={editForm.cell}
                  onChange={(e) => setEditForm({ ...editForm, cell: e.target.value })}
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-village" className="font-bold text-slate-900">{t('location.village')}</Label>
                <Input
                  id="edit-village"
                  value={editForm.village}
                  onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                  className="h-11 border-slate-300 focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-11 rounded-xl font-bold">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={updating} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 rounded-xl font-bold">
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
