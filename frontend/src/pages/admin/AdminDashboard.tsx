import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, PageHeader } from "@/components/DashboardComponents";
import { Users, Building2, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

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
  const { token } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
        throw new Error(data.message || 'Failed to update user status');
      }

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
      toast({
        title: `User ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
        description: `The user request has been ${status === 'APPROVED' ? 'approved' : 'rejected'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error?.message || 'Unable to update user status.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingUserId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title="Admin Dashboard" description="National overview — NutriGuard System" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-6 w-6" />} change={`+${stats?.pendingUsers || 0} pending`} changeType="neutral" />
          <StatCard title="Health Centers" value={stats?.totalHealthCenters || 0} icon={<Building2 className="h-6 w-6" />} />
          <StatCard title="Children Screened" value={stats?.totalChildren || 0} icon={<BarChart3 className="h-6 w-6" />} changeType="positive" />
          <StatCard title="High Risk Cases" value={stats?.highRiskCount || 0} icon={<AlertTriangle className="h-6 w-6" />} changeType="negative" />
        </div>

        {/* Pending Approvals */}
        <div className="bg-card rounded-xl border shadow-sm mb-6">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-card-foreground">Pending User Approvals</h2>
            <span className="bg-warning/10 text-warning text-xs font-bold px-2.5 py-1 rounded-full">{pendingUsers.length} pending</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Name", "Email", "Role", "Health Center", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{u.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-4"><span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">{u.role}</span></td>
                    <td className="p-4 text-sm text-muted-foreground">{u.healthCenter?.name || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 flex gap-2">
                      <Button
                        size="sm"
                        disabled={submittingUserId === u.id}
                        onClick={() => handleStatusChange(u.id, 'APPROVED')}
                      >
                        {submittingUserId === u.id ? 'Approving…' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={submittingUserId === u.id}
                        onClick={() => handleStatusChange(u.id, 'REJECTED')}
                      >
                        {submittingUserId === u.id ? 'Rejecting…' : 'Reject'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No pending approvals found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Centers */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="font-display text-lg font-semibold text-card-foreground">Health Centers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Name", "Location", "Assigned Nurse", "CHWs", "Children"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthCenters.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.location}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {c.users?.find(u => u.role === 'NURSE')?.name || 'Not Assigned'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{c._count.users}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c._count.children}</td>
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
