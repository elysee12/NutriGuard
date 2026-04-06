import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  healthCenter?: { name: string };
}

export default function AdminUsers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setUsers(await response.json());
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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

      setUsers((prev) => prev.map((user) => (user.id === userId ? data : user)));
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
        <PageHeader title="User Management" description="Approve, reject, and manage user accounts" />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">No users found.</div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Name", "Email", "Role", "Status", "Registered", "Health Center", "Actions"].map((h) => (
                    <th key={h} className="text-left p-4 text-sm font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{u.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-4"><span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">{u.role}</span></td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        u.status === 'APPROVED' ? 'risk-low' : 'risk-moderate'
                      }`}>{u.status}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.healthCenter?.name || 'N/A'}</td>
                    <td className="p-4">
                      {u.status === 'PENDING' ? (
                        <div className="flex gap-2">
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
                            className="text-destructive"
                            disabled={submittingUserId === u.id}
                            onClick={() => handleStatusChange(u.id, 'REJECTED')}
                          >
                            {submittingUserId === u.id ? 'Rejecting…' : 'Reject'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
