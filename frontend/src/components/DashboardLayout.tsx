import { ReactNode } from "react";
import logo from "@/assets/logo.jpg";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Heart, LayoutDashboard, Users, Baby, ClipboardList,
  FileText, Settings, LogOut, Building2, BarChart3,
  UserCheck, Activity, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/admin" },
    { label: "Approve Users", icon: <UserCheck className="h-5 w-5" />, path: "/admin/users" },
    { label: "Health Centers", icon: <Building2 className="h-5 w-5" />, path: "/admin/centers" },
    { label: "Statistics", icon: <BarChart3 className="h-5 w-5" />, path: "/admin/stats" },
    { label: "System Logs", icon: <Activity className="h-5 w-5" />, path: "/admin/logs" },
    { label: "Settings", icon: <Settings className="h-5 w-5" />, path: "/admin/settings" },
  ],
  NURSE: [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/nurse" },
    { label: "CHW Monitoring", icon: <Users className="h-5 w-5" />, path: "/nurse/chw" },
    { label: "Assessments", icon: <ClipboardList className="h-5 w-5" />, path: "/nurse/assessments" },
    { label: "Reports", icon: <FileText className="h-5 w-5" />, path: "/nurse/reports" },
  ],
  CHW: [
    { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, path: "/chw" },
    { label: "Register Child", icon: <Baby className="h-5 w-5" />, path: "/chw/register" },
    { label: "Assessments", icon: <ClipboardList className="h-5 w-5" />, path: "/chw/assessments" },
    { label: "Results", icon: <BarChart3 className="h-5 w-5" />, path: "/chw/results" },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const items = navByRole[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-9 w-9 min-w-[2.25rem] rounded-lg bg-sidebar-primary flex items-center justify-center">
            <img src={logo} alt="NutriGuard logo" className="h-5 w-5 object-contain" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold text-sidebar-primary-foreground">NutriGuard</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent">
              <p className="text-xs text-sidebar-foreground/60">Logged in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-primary capitalize">{user.role === "CHW" ? "CHW" : user.role.toLowerCase()}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-sidebar-border flex justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
