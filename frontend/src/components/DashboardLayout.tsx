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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 z-40 flex items-center justify-between px-4 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-lg flex items-center justify-center ring-2 ring-white/10">
            <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <span className="font-display text-sm font-bold text-white block leading-tight">e-KuraNeza</span>
            <span className="text-[9px] text-slate-400 font-medium">Rwanda Health</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector className="scale-90 origin-right" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
            className="text-white hover:bg-white/10 h-10 w-10"
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
        className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 z-50 fixed lg:static inset-y-0 left-0 border-r border-slate-700/50 shadow-2xl ${
          collapsed ? "w-20" : "w-72"
        } ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 min-w-[2.75rem] rounded-xl bg-gradient-to-br from-primary via-teal-500 to-primary shadow-xl flex items-center justify-center ring-2 ring-white/20">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-6 w-6 object-contain" />
            </div>
            {(!collapsed || mobileMenuOpen) && (
              <div>
                <span className="font-display text-base font-bold text-white block leading-tight">e-KuraNeza</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider">Rwanda Health</span>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {(!collapsed || mobileMenuOpen) && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Navigation
              </span>
            </div>
          )}
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg shadow-primary/25"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-teal-600/20 animate-pulse" />
                )}
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}>
                    {item.icon}
                  </div>
                  {(!collapsed || mobileMenuOpen) && <span className="flex-1">{item.label}</span>}
                  {active && (!collapsed || mobileMenuOpen) && (
                    <div className="h-2 w-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Language Selection Sidebar Bottom */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          {(!collapsed || mobileMenuOpen) && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-3">
              {t('common.language', 'Language')}
            </span>
          )}
          <div className={collapsed && !mobileMenuOpen ? "flex justify-center" : ""}>
            <LanguageSelector className={collapsed && !mobileMenuOpen ? "" : "w-full"} />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-t border-slate-700/50 space-y-2 bg-gradient-to-b from-transparent to-slate-900">
          {(!collapsed || mobileMenuOpen) ? (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full px-4 py-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 hover:from-slate-800 hover:to-slate-700 border border-slate-700/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 group-hover:ring-primary/30 transition-all">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('nav.logged_in_as')}</p>
                  <p className="text-sm text-white font-bold truncate leading-tight mt-0.5">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium">
                <span className="px-2.5 py-1 bg-primary/20 text-primary-foreground rounded-lg border border-primary/30 font-bold">
                  {user.role}
                </span>
                <span className="flex items-center gap-1 text-slate-400 group-hover:text-primary transition-colors">
                  <span>{t('nav.edit_profile')}</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full h-12 flex items-center justify-center rounded-xl hover:bg-slate-800/50 text-white transition-all hover:shadow-lg border border-transparent hover:border-primary/30"
              title={t('nav.edit_profile')}
            >
              <User className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 ${
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
          className="hidden lg:flex p-3 border-t border-slate-700/50 justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-slate-800/50 group-hover:bg-slate-700 flex items-center justify-center transition-all">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </div>
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
