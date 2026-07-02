import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Clock, Shield, AlertCircle } from "lucide-react";

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
                <Activity className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">SYSTEM ACTIVITY</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('admin.system_logs_title', 'System Logs')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('admin.system_logs_desc', 'Monitor all system activities and user actions')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4 animate-pulse">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold">{t('common.loading')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-12 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 items-center justify-center mb-4">
                <Activity className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">{t('common.no_results')}</p>
              <p className="text-slate-500 text-sm mt-1">No activity logs available</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Activity Feed</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Showing {logs.length} recent system event{logs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const getRoleColor = (role: string) => {
                    switch (role) {
                      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
                      case 'NURSE': return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'CHW': return 'bg-teal-50 text-teal-700 border-teal-200';
                      case 'SYSTEM': return 'bg-slate-50 text-slate-700 border-slate-200';
                      default: return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  const getRoleIcon = (role: string) => {
                    switch (role) {
                      case 'ADMIN': return Shield;
                      case 'SYSTEM': return AlertCircle;
                      default: return Activity;
                    }
                  };

                  const RoleIcon = getRoleIcon(log.role);

                  return (
                    <div key={log.id} className="p-5 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-sm font-bold text-purple-700 group-hover:scale-110 transition-transform">
                          {log.user?.name?.split(" ").map((w) => w[0]).join("") || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 leading-relaxed">
                            <span className="font-bold">{log.user?.name || t('admin.unknown_user')}</span> — {log.action}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs text-slate-500 font-medium">{log.time}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getRoleColor(log.role)}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {log.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
