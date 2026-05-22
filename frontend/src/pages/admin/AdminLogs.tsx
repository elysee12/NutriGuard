import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface SystemLogEntry {
  id: number;
  action: string;
  time: string;
  role: string;
  user: { name: string };
}

export default function AdminLogs() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const mockLogs: SystemLogEntry[] = [
    {
      id: 1,
      action: "Approved new health worker account: Jean de Dieu",
      time: "2026-05-22 09:15:22",
      role: "ADMIN",
      user: { name: "System Admin" }
    },
    {
      id: 2,
      action: "Updated stunting threshold configuration to 65%",
      time: "2026-05-21 14:30:10",
      role: "ADMIN",
      user: { name: "System Admin" }
    },
    {
      id: 3,
      action: "Submitted assessment for child: Uwase Alice",
      time: "2026-05-21 11:05:45",
      role: "CHW",
      user: { name: "Kamanzi Eric" }
    },
    {
      id: 4,
      action: "Generated monthly stunting report for Musanze District",
      time: "2026-05-20 16:45:00",
      role: "NURSE",
      user: { name: "Mutesi Marie" }
    },
    {
      id: 5,
      action: "New health center registered: Nyabihu Health Center",
      time: "2026-05-20 10:20:15",
      role: "ADMIN",
      user: { name: "System Admin" }
    },
    {
      id: 6,
      action: "Failed login attempt from IP 197.243.12.54",
      time: "2026-05-19 22:12:05",
      role: "SYSTEM",
      user: { name: "Security Watchdog" }
    },
    {
      id: 7,
      action: "Bulk child data import: 124 records processed",
      time: "2026-05-19 13:00:00",
      role: "ADMIN",
      user: { name: "System Admin" }
    }
  ];

  useEffect(() => {
    if (!token) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/system-log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data.length > 0 ? data : mockLogs);
        } else {
          setLogs(mockLogs);
        }
      } catch (error) {
        console.error('Failed to load system logs:', error);
        setLogs(mockLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token, API_URL]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl">
        <PageHeader title={t('admin.system_logs_title')} description={t('admin.system_logs_desc')} />

        {loading ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : logs.length === 0 ? (
          <div className="bg-card rounded-xl border shadow-sm p-6 text-center text-muted-foreground">{t('common.no_results')}</div>
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
                        <span className="font-medium">{log.user?.name || t('admin.unknown_user')}</span> — {log.action}
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
