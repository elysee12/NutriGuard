import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";

interface SystemLogEntry {
  id: number;
  action: string;
  time: string;
  role: string;
  user: { name: string };
}

export default function AdminLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/system-log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setLogs(await response.json());
        }
      } catch (error) {
        console.error('Failed to load system logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token, API_URL]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title="System Logs" description="Activity log across all users" />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">No system logs available.</div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {log.user?.name?.split(" ").map((w) => w[0]).join("") || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.user?.name || 'Unknown User'}</span> — {log.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  </div>
                  <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">{log.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
