import { ReactNode, useState, useEffect } from "react";
import logo from "@/assets/logo.jpg";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Heart, LayoutDashboard, Users, Baby, ClipboardList,
  FileText, Settings, LogOut, Building2, BarChart3,
  UserCheck, Activity, ChevronLeft, ChevronRight, User,
  Menu, X
} from "lucide-react";
import ProfileUpdateModal from "./ProfileUpdateModal";
import Footer from "./Footer";
import { Button } from "./ui/button";

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
    { label: "Register Child", icon: <Baby className="h-5 w-5" />, path: "/nurse/register-child" },
    { label: "Assessments", icon: <ClipboardList className="h-5 w-5" />, path: "/nurse/assessments" },
    { label: "CHW Monitoring", icon: <Users className="h-5 w-5" />, path: "/nurse/chw" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;
  const items = navByRole[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NutriGuard logo" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-lg font-bold text-sidebar-primary-foreground">NutriGuard</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setMobileMenuOpen(true)}
          className="text-sidebar-foreground"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar / Mobile Drawer */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50 fixed lg:static inset-y-0 left-0 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 min-w-[2.25rem] rounded-lg bg-sidebar-primary flex items-center justify-center">
              <img src={logo} alt="NutriGuard logo" className="h-5 w-5 object-contain" />
            </div>
            {(!collapsed || mobileMenuOpen) && (
              <span className="font-display text-lg font-bold text-sidebar-primary-foreground">NutriGuard</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
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
                {(!collapsed || mobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {(!collapsed || mobileMenuOpen) ? (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 border border-emerald-200 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700/70">Logged in as</p>
                  <p className="text-sm font-bold text-emerald-900 truncate drop-shadow-sm">{user.name}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-medium text-left">Edit Profile</p>
            </button>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors flex justify-center"
              title="Edit Profile"
            >
              <User className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            {(!collapsed || mobileMenuOpen) && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-3 border-t border-sidebar-border justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background pt-16 lg:pt-0">
        <div className="flex flex-col min-h-full">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <ProfileUpdateModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}
