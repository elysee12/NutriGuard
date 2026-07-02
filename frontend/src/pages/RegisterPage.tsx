import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectWithIcon } from "@/components/ui/select-with-icon";
import { useToast } from "@/components/ui/use-toast";
import { useRwandaLocations } from "@/hooks/useRwandaLocations";
import { LocationFields } from "@/components/LocationFields";
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Stethoscope, 
  Users, 
  User,
  Mail,
  Lock,
  Building2,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { API_URL, fetchPublicStats, PublicStats } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "ADMIN", label: "Admin", icon: <Shield className="h-5 w-5" />, desc: "System administrator" },
    { value: "NURSE", label: "Nurse", icon: <Stethoscope className="h-5 w-5" />, desc: "Health center staff" },
    { value: "CHW", label: "CHW", icon: <Users className="h-5 w-5" />, desc: "Community health worker" },
  ];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("CHW");
  const [healthCenters, setHealthCenters] = useState<{id: number, name: string}[]>([]);
  const [healthCenterId, setHealthCenterId] = useState<number | string>("");
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [healthCenterError, setHealthCenterError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  // Use Rwanda locations hook for full hierarchy
  const location = useRwandaLocations();

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    const loadHealthCenters = async () => {
      setLoadingCenters(true);
      setHealthCenterError(null);
      try {
        const response = await fetch(`${API_URL}/health-center`);
        if (!response.ok) {
          throw new Error('Unable to load centers');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setHealthCenters(data);
          // Auto-select first center if none selected
          if (!healthCenterId) {
            setHealthCenterId(data[0].id);
          }
        }
      } catch (error) {
        console.error(error);
        setHealthCenterError('Unable to load health centers.');
      } finally {
        setLoadingCenters(false);
      }
    };

    loadHealthCenters();
  }, []);

  // Reset location when role changes (for non-CHW roles)
  useEffect(() => {
    if (selectedRole !== "CHW") {
      location.resetLocation();
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: selectedRole,
          healthCenterId: healthCenterId ? Number(healthCenterId) : null,
          province: location.province,
          district: location.district,
          sector: location.sector,
          cell: location.cell,
          village: location.village,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast({
        title: "Request submitted",
        description: data.message || "Your access request has been recorded. An administrator will contact you soon.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── LEFT BRANDING PANEL ── */}
      <div className="hidden lg:flex lg:w-[36%] xl:w-[34%] flex-col justify-between bg-primary relative overflow-hidden p-6 xl:p-8 flex-shrink-0 h-full">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
            <img src={logo} alt="e-KuraNeza Kibondo" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">e-KuraNeza Kibondo</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-3 -mt-12">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-white/90 text-[10px] font-medium tracking-wide uppercase">Rwanda Ministry of Health</span>
          </div>
          <h1 className="text-white font-bold text-3xl xl:text-4xl leading-[1.1] tracking-tight">
            {t('home.hero_title')}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Stats row */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { n: stats ? `${stats.totalChildren.toLocaleString()}+` : "12,450+", l: t('home.stats_children') },
              { n: stats ? stats.totalHealthWorkers.toLocaleString() : "340+", l: t('home.stats_chw') },
              { n: stats ? stats.detectionRate : "95%", l: t('home.stats_detection') },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5">
                <div className="text-white font-bold text-xl">{s.n}</div>
                <div className="text-white/60 text-[10px] mt-0.5 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>
          {/* Trust badge */}
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex -space-x-1.5">
              {["bg-emerald-400","bg-teal-300","bg-cyan-400","bg-green-300"].map((c,i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-primary flex items-center justify-center`}>
                  <Users className="h-3 w-3 text-white" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Trusted by health workers</p>
              <p className="text-white/60 text-[10px]">across all provinces of Rwanda</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col bg-slate-50/60 overflow-y-auto h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <img src={logo} alt="e-KuraNeza Kibondo" className="h-4.5 w-4.5 object-contain" />
            </div>
            <span className="font-bold text-sm text-primary">e-KuraNeza Kibondo</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.back_to_login')}
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start justify-center px-4 py-6">
          <div className="w-full max-w-xl">
            {/* Heading */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 mb-0.5">{t('auth.create_account')}</h2>
              <p className="text-slate-500 text-xs">{t('auth.request_access_desc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── SECTION 1: Account Details ── */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold">1</span>
                    Account Details
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        {t('auth.full_name')}
                      </Label>
                      <Input id="name" type="text" icon={<User className="h-3.5 w-3.5" />}
                        placeholder="John Doe" value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-primary" />
                        {t('auth.email_address')}
                      </Label>
                      <Input id="email" type="email" icon={<Mail className="h-3.5 w-3.5" />}
                        placeholder="your@email.rw" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-primary" />
                      {t('auth.password')}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <Input id="password" type={showPassword ? "text" : "password"}
                        placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 pl-9 pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm" required />
                      <button type="button" aria-label="Toggle password"
                        className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-primary transition-colors"
                        onClick={() => setShowPassword((v) => !v)}>
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: Role ── */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold">2</span>
                    {t('auth.select_role')}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    {roles.map((role) => (
                      <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 group ${
                          selectedRole === role.value
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                        }`}>
                        <div className={`p-2 rounded-lg transition-colors ${
                          selectedRole === role.value ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          {role.icon}
                        </div>
                        <span className={`text-xs font-semibold ${selectedRole === role.value ? "text-primary" : "text-slate-700"}`}>
                          {role.label}
                        </span>
                        <p className="text-[10px] text-slate-400 text-center leading-tight">{role.desc}</p>
                        {selectedRole === role.value && (
                          <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: Role-Specific ── */}
              {selectedRole === "NURSE" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold">3</span>
                      Workplace Information
                    </h3>
                  </div>
                  <div className="p-4 space-y-1">
                    <Label htmlFor="healthCenter" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-primary" />
                      {t('common.health_center')}
                    </Label>
                    <SelectWithIcon id="healthCenter" icon={<Building2 className="h-3.5 w-3.5" />}
                      className="h-9 bg-slate-50 border-slate-200 text-sm" value={healthCenterId}
                      onChange={(e) => setHealthCenterId(e.target.value)} required>
                      <option value="">Select a health center</option>
                      {healthCenters.map((hc) => (
                        <option key={hc.id} value={hc.id}>{hc.name}</option>
                      ))}
                    </SelectWithIcon>
                    {healthCenterError && <p className="text-[10px] text-destructive">{healthCenterError}</p>}
                  </div>
                </div>
              )}

              {selectedRole === "CHW" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold">3</span>
                      Service Area &amp; Workplace
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <LocationFields
                      province={location.province} district={location.district}
                      sector={location.sector} cell={location.cell} village={location.village}
                      provinces={location.provinces} districts={location.districts}
                      sectors={location.sectors} cells={location.cells} villages={location.villages}
                      onProvinceChange={location.handleProvinceChange}
                      onDistrictChange={location.handleDistrictChange}
                      onSectorChange={location.handleSectorChange}
                      onCellChange={location.handleCellChange}
                      onVillageChange={location.handleVillageChange}
                      required={true} showIcons={true} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                    />
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <Label htmlFor="chwHealthCenter" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-primary" />
                        {t('common.health_center')}
                      </Label>
                      <SelectWithIcon id="chwHealthCenter" icon={<Building2 className="h-3.5 w-3.5" />}
                        className="h-9 bg-slate-50 border-slate-200 text-sm" value={healthCenterId}
                        onChange={(e) => setHealthCenterId(e.target.value)} required>
                        <option value="">Select a health center</option>
                        {healthCenters.map((hc) => (
                          <option key={hc.id} value={hc.id}>{hc.name}</option>
                        ))}
                      </SelectWithIcon>
                      {healthCenterError && <p className="text-[10px] text-destructive">{healthCenterError}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SUBMIT ── */}
              <div className="space-y-3">
                <Button type="submit"
                  className="w-full h-10 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : t('auth.request_button')}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  {t('auth.already_have_account')}{" "}
                  <button type="button" onClick={() => navigate("/")}
                    className="text-primary font-semibold hover:underline">
                    {t('auth.back_to_login')}
                  </button>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
