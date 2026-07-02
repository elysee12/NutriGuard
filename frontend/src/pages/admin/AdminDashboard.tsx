import DashboardLayout from "@/components/DashboardLayout";
import { Users, Building2, BarChart3, AlertTriangle, CheckCircle, XCircle, Clock, Sparkles, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  healthCenter?: { name: string };
}

interface HealthCenter {
  id: number;
  name: string;
  location: string;
  _count: { users: number; children: number };
  users: { name: string; role: string }[];
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, centersRes] = await Promise.all([
          fetch(`${API_URL}/stats/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/health-center`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) {
          const users = await usersRes.json();
          setPendingUsers(users.filter((u: any) => u.status === 'PENDING'));
        }
        if (centersRes.ok) setHealthCenters(await centersRes.json());
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    if (token) fetchAdminData();
  }, [token]);

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

      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NURSE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CHW':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">{getGreeting()}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                Welcome, {user?.name?.split(' ')[0] || 'Admin'}.
              </h1>
              <p className="text-white/90 text-lg">
                National Health System Dashboard — Rwanda Ministry of Health
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                {stats?.pendingUsers > 0 && (
                  <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                    +{stats.pendingUsers} {t('admin.pending')}
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('admin.total_users')}</p>
            </div>

            {/* Health Centers */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Network
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalHealthCenters || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('admin.health_centers')}</p>
            </div>

            {/* Children Screened */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  Active
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalChildren || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('admin.children_screened')}</p>
            </div>

            {/* High Risk Cases */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold">
                  Alert
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats?.highRiskCount || 0}</p>
              <p className="text-sm text-slate-600 font-medium">{t('admin.high_risk_cases')}</p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('admin.pending_approvals')}</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Review and approve user access requests</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-lg">
                  {pendingUsers.length}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[t('common.name'), t('common.email'), t('common.role'), t('common.health_center'), t('common.date'), t('common.actions')].map((h) => (
                      <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingUsers.map((u) => (
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
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getRoleBadgeStyles(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{u.healthCenter?.name || t('common.na')}</td>
                      <td className="p-4 text-sm text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16">
                        <div className="text-center">
                          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-emerald-600" />
                          </div>
                          <p className="text-slate-600 font-semibold text-lg">{t('dashboard.no_pending_reviews')}</p>
                          <p className="text-slate-500 text-sm mt-1">All user requests have been processed</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Health Centers */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('admin.health_centers')}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">Manage health center assignments and staff</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[t('common.name'), t('admin.location'), "Assigned Nurse", t('admin.users'), t('admin.children')].map((h) => (
                      <th key={h} className="text-left p-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {healthCenters.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-700" />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{c.location}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {c.users?.find(u => u.role === 'NURSE')?.name || (
                          <span className="text-amber-600 italic font-medium">{t('common.not_assigned')}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                          {c._count.users}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">
                          {c._count.children}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
