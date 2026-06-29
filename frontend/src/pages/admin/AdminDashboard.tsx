import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, PageHeader } from "@/components/DashboardComponents";
import { Users, Building2, BarChart3, AlertTriangle } from "lucide-react";
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

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'Admin'}.`} description="Admin Dashboard" />

        {/* Premium Stats Grid */}
        <div className="data-grid mb-8">
          <StatCard 
            title={t('admin.total_users')} 
            value={stats?.totalUsers || 0} 
            icon={<Users className="h-7 w-7" />} 
            change={`+${stats?.pendingUsers || 0} ${t('admin.pending')}`} 
            changeType="neutral" 
          />
          <StatCard 
            title={t('admin.health_centers')} 
            value={stats?.totalHealthCenters || 0} 
            icon={<Building2 className="h-7 w-7" />} 
          />
          <StatCard 
            title={t('admin.children_screened')} 
            value={stats?.totalChildren || 0} 
            icon={<BarChart3 className="h-7 w-7" />} 
            changeType="positive" 
          />
          <StatCard 
            title={t('admin.high_risk_cases')} 
            value={stats?.highRiskCount || 0} 
            icon={<AlertTriangle className="h-7 w-7" />} 
            changeType="negative" 
          />
        </div>

        {/* Pending Approvals - Premium Card */}
        <div className="professional-card mb-8 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-warning/5 via-background to-background border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-card-foreground">{t('admin.pending_approvals')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Review and approve user access requests</p>
              </div>
            </div>
            <div className="premium-badge bg-warning/10 text-warning border-warning/20">
              {pendingUsers.length} {t('admin.pending')}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  {[t('common.name'), t('common.email'), t('common.role'), t('common.health_center'), t('common.date'), t('common.actions')].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">{u.name[0]}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <span className="premium-badge bg-secondary text-foreground border-border">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{u.healthCenter?.name || t('common.na')}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 flex gap-2">
                      <Button
                        size="sm"
                        disabled={submittingUserId === u.id}
                        onClick={() => handleStatusChange(u.id, 'APPROVED')}
                        className="h-9"
                      >
                        {submittingUserId === u.id ? t('admin.approving') : t('admin.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground h-9"
                        disabled={submittingUserId === u.id}
                        onClick={() => handleStatusChange(u.id, 'REJECTED')}
                      >
                        {submittingUserId === u.id ? t('admin.rejecting') : t('admin.reject')}
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground font-semibold">{t('dashboard.no_pending_reviews')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Centers - Premium Card */}
        <div className="professional-card overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary/5 via-background to-background border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-card-foreground">{t('admin.health_centers')}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage health center assignments and staff</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  {[t('common.name'), t('admin.location'), "Assigned Nurse", t('admin.users'), t('admin.children')].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-bold text-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthCenters.map((c) => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-info" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{c.location}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {c.users?.find(u => u.role === 'NURSE')?.name || (
                        <span className="text-warning italic font-medium">{t('common.not_assigned')}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-9 px-3 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                        {c._count.users}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-9 px-3 bg-success/10 text-success rounded-lg text-sm font-bold">
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
    </DashboardLayout>
  );
}
