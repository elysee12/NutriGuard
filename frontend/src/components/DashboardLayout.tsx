import { ReactNode, useState, useEffect, useMemo } from "react";
import logo from "@/assets/logo.jpg";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./LanguageSelector";
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navByRole = useMemo((): Record<UserRole, NavItem[]> => ({
    ADMIN: [
      { label: t("nav.dashboard"), icon: <LayoutDashboard className="h-5 w-5" />, path: "/admin" },
      { label: t("nav.approve_users", "Approve Users"), icon: <UserCheck className="h-5 w-5" />, path: "/admin/users" },
      { label: t("nav.health_centers", "Health Centers"), icon: <Building2 className="h-5 w-5" />, path: "/admin/centers" },
      { label: t("nav.reports", "System Reports"), icon: <FileText className="h-5 w-5" />, path: "/admin/reports" },
      { label: t("nav.statistics", "Statistics"), icon: <BarChart3 className="h-5 w-5" />, path: "/admin/statistics" },
      { label: t("nav.system_logs", "System Logs"), icon: <Activity className="h-5 w-5" />, path: "/admin/logs" },
      { label: t("nav.settings", "Settings"), icon: <Settings className="h-5 w-5" />, path: "/admin/settings" },
    ],
    NURSE: [
      { label: t("nav.dashboard"), icon: <LayoutDashboard className="h-5 w-5" />, path: "/nurse" },
      { label: t("nav.register_child"), icon: <Baby className="h-5 w-5" />, path: "/nurse/register-child" },
      { label: t("nav.assessments"), icon: <ClipboardList className="h-5 w-5" />, path: "/nurse/assessments" },
      { label: t("nav.chw_monitoring"), icon: <Users className="h-5 w-5" />, path: "/nurse/chw" },
      { label: t("nav.reports"), icon: <FileText className="h-5 w-5" />, path: "/nurse/reports" },
      { label: t("nav.statistics", "Statistics"), icon: <BarChart3 className="h-5 w-5" />, path: "/nurse/statistics" },
    ],
    CHW: [
      { label: t("nav.dashboard"), icon: <LayoutDashboard className="h-5 w-5" />, path: "/chw" },
      { label: t("nav.register_child"), icon: <Baby className="h-5 w-5" />, path: "/chw/register" },
      { label: t("nav.assessments"), icon: <ClipboardList className="h-5 w-5" />, path: "/chw/assessments" },
      { label: t("nav.results", "Results"), icon: <BarChart3 className="h-5 w-5" />, path: "/chw/results" },
    ],
  }), [t]);

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
          <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-base font-bold text-sidebar-primary-foreground">e-KuraNeza Kibondo</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector className="scale-75 origin-right" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
            className="text-sidebar-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Sidebar / Mobile Drawer */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50 fixed lg:static inset-y-0 left-0 border-r border-sidebar-border ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-sidebar-primary to-info shadow-lg flex items-center justify-center">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-6 w-6 object-contain" />
            </div>
            {(!collapsed || mobileMenuOpen) && (
              <span className="font-display text-base font-bold text-sidebar-primary-foreground">e-KuraNeza Kibondo</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
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
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-sidebar-primary to-info text-white shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {(!collapsed || mobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Language Selection Sidebar Bottom */}
        <div className="p-4 border-t border-sidebar-border flex flex-col gap-2">
          {(!collapsed || mobileMenuOpen) && (
            <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2">
              {t('common.language', 'Language')}
            </span>
          )}
          <LanguageSelector className={collapsed && !mobileMenuOpen ? "flex-col" : ""} />
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {(!collapsed || mobileMenuOpen) ? (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full px-3 py-3 rounded-xl bg-gradient-to-br from-sidebar-primary/20 to-info/10 hover:from-sidebar-primary/30 hover:to-info/20 border border-sidebar-primary/30 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sidebar-primary to-info flex items-center justify-center text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <p className="text-xs text-sidebar-primary font-bold uppercase tracking-tight truncate">{t('nav.logged_in_as')}</p>
                  <p className="text-sm text-sidebar-foreground font-bold truncate leading-tight">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/60 font-medium">
                <span className="px-2 py-0.5 bg-sidebar-accent rounded-md">{user.role}</span>
                <span className="flex items-center gap-0.5 hover:text-sidebar-primary transition-colors">
                  {t('nav.edit_profile')}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full h-11 flex items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
              title={t('nav.edit_profile')}
            >
              <User className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 ${
              collapsed && !mobileMenuOpen ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5" />
            {(!collapsed || mobileMenuOpen) && <span>{t('nav.sign_out')}</span>}
          </button>
        </div>

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-3 border-t border-sidebar-border justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
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
