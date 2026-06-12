import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Heart, Shield, Stethoscope, Users } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { API_URL, fetchPublicStats, PublicStats } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

// health centers in Kicukiro district (fallback)
const chwLocationConfig = {
  "Gahanga": {
    cells: ["Gahanga", "Kagasa", "Murambi"],
    villages: {
      "Gahanga": ["Gahanga", "Gatare", "Gatovu", "Karinini", "Rwinanka", "Ubumwe"],
      "Kagasa": ["Kabeza", "Kabidandi", "Kagasa", "Kagera", "Kamanu", "Muhororo", "Rugarama"],
      "Murambi": ["Butereri", "Butirabura", "Kabatwa", "Murambi", "Nunga", "Rurambo"]
    }
  },
  "Gatenga": {
    cells: ["Gatenga", "Karambo", "Nyanza"],
    villages: {
      "Gatenga": ["Gatenga I", "Gatenga II", "Kigina", "Marembo", "Murambi", "Nyabisindu", "Ruherezo"],
      "Karambo": ["Gatare", "Icyerekezo", "Karambo", "Rinda", "Rusizi"],
      "Nyanza": ["Akabeneza", "Akamatamu", "Gashyekero", "Icyenyerere", "Kagunga", "Muremera", "Nyanza", "Rebero"]
    }
  },
  "Gikondo": {
    cells: ["Kagunga", "Kanserege", "Mburabuturo"],
    villages: {
      "Kagunga": ["Gikondo", "Kagunga I", "Kagunga II", "Kanserege", "Katabaro", "Marembo", "Ruganwa I", "Ruganwa II"],
      "Kanserege": ["Kabutare", "Kanserege", "Kigarama", "Rugano"],
      "Mburabuturo": ["Gatare", "Mburabuturo", "Rebero", "Taba"]
    }
  },
  "Kagarama": {
    cells: ["Kagarama", "Muyange", "Rukatsa"],
    villages: {
      "Kagarama": ["Kagarama", "Kanserege", "Kigabiro"],
      "Muyange": ["Gako", "Icyuzuzo", "Kabeza", "Mayange", "Muyange"],
      "Rukatsa": ["Bugifi", "Gashyushya", "Kabuga", "Rukatsa"]
    }
  },
  "Kanombe": {
    cells: ["Busanza", "Kabeza", "Karama", "Rubirizi"],
    villages: {
      "Busanza": ["Gashyushya", "Kabugondo", "Karama", "Marembo", "Nyandungu", "Rinda"],
      "Kabeza": ["Kabeza", "Karisimbi", "Uruhuha"],
      "Karama": ["Agasaro", "Gatarama", "Icyatwa", "Karama", "Ubutunzi"],
      "Rubirizi": ["Giporoso I", "Giporoso II", "Itaba", "Kanserege", "Rubirizi"]
    }
  },
  "Kicukiro": {
    cells: ["Kicukiro", "Ngoma"],
    villages: {
      "Kicukiro": ["Icyizere", "Kicukiro", "Rukiri"],
      "Ngoma": ["Gatare", "Ihuriro", "Isangano", "Ngoma"]
    }
  },
  "Kigarama": {
    cells: ["Bwerankori", "Karugira", "Kigarama", "Nyarurama", "Rwampara"],
    villages: {
      "Bwerankori": ["Bwerankori I", "Bwerankori II", "Icyerekezo", "Imena", "Inshuti", "Rugunga"],
      "Karugira": ["Isano", "Ituze", "Karugira", "Kigina"],
      "Kigarama": ["Icyerekezo", "Kigarama", "Rurembo"],
      "Nyarurama": ["Gatovu", "Kigali", "Marembo", "Nyarurama", "Ruganwa"],
      "Rwampara": ["Gatare", "Ihuriro", "Ingenzi", "Rwampara"]
    }
  },
  "Masaka": {
    cells: ["Cyiteranyi", "Gako", "Gitaraga", "Masaka", "Rweru"],
    villages: {
      "Cyiteranyi": ["Cyiteranyi", "Kageyo", "Masezero", "Nyagacaca"],
      "Gako": ["Agatare", "Gako", "Gatare", "Karushya", "Kayenziraba", "Kigarama", "Murambi"],
      "Gitaraga": ["Gitaraga", "Kigufi", "Mubuga", "Rukombe"],
      "Masaka": ["Gisenga", "Icyenyerere", "Kabeza", "Kagaso", "Mbabe", "Umutara"],
      "Rweru": ["Kacyiru", "Kanyinya", "Rweru"]
    }
  },
  "Niboye": {
    cells: ["Gatare", "Niboye", "Nyakabanda"],
    villages: {
      "Gatare": ["Gatare I", "Gatare II", "Ihuriro"],
      "Niboye": ["Gasharu", "Kigarama", "Niboye", "Taba"],
      "Nyakabanda": ["Gasave", "Kimenyi", "Nyakabanda"]
    }
  },
  "Nyarugunga": {
    cells: ["Kamashashi", "Nonko", "Rwimbogo"],
    villages: {
      "Kamashashi": ["Kamashashi", "Katabaro", "Rwabutazi", "Umutara"],
      "Nonko": ["Kajevuba", "Nonko"],
      "Rwimbogo": ["Bisambu", "Isangano", "Rwimbogo"]
    }
  }
};

const district = "Kicukiro";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "admin", label: "Admin", icon: <Shield className="h-5 w-5" />, desc: "System administrator" },
    { value: "nurse", label: "Nurse", icon: <Stethoscope className="h-5 w-5" />, desc: "Health center staff" },
    { value: "chw", label: "CHW", icon: <Users className="h-5 w-5" />, desc: "Community health worker" },
  ];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("chw");
  const [healthCenters, setHealthCenters] = useState<{id: number, name: string}[]>([]);
  const [healthCenterId, setHealthCenterId] = useState<number | string>("");
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [healthCenterError, setHealthCenterError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(console.error);
  }, []);

  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  useEffect(() => {
    if (selectedRole !== "chw") {
      setSector("");
      setCell("");
      setVillage("");
      return;
    }

    // Default to first sector if not set
    if (!sector) {
      setSector(Object.keys(chwLocationConfig)[0]);
    }
  }, [selectedRole]);

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

  // For CHW, try to find a health center that matches the selected sector name
  useEffect(() => {
    if (selectedRole === "chw" && sector && healthCenters.length > 0) {
      const matchingCenter = healthCenters.find(
        hc => hc.name.toLowerCase().includes(sector.toLowerCase()) || 
              sector.toLowerCase().includes(hc.name.toLowerCase())
      );
      if (matchingCenter) {
        setHealthCenterId(matchingCenter.id);
      }
    }
  }, [selectedRole, sector, healthCenters]);

  useEffect(() => {
    if (selectedRole !== "chw" || !sector) {
      return;
    }
    const sectorConfig = chwLocationConfig[sector as keyof typeof chwLocationConfig];
    if (!sectorConfig) return;

    const firstCell = sectorConfig.cells[0] || "";
    setCell((prevCell) => {
      if (!prevCell || !sectorConfig.cells.includes(prevCell)) return firstCell;
      return prevCell;
    });
  }, [selectedRole, sector]);

  useEffect(() => {
    if (selectedRole !== "chw" || !sector || !cell) {
      return;
    }
    const sectorConfig = chwLocationConfig[sector as keyof typeof chwLocationConfig];
    if (!sectorConfig) return;

    const villages = sectorConfig.villages[cell as keyof typeof sectorConfig.villages] || [];
    const firstVillage = villages[0] || "";
    setVillage((prevVillage) => {
      if (!prevVillage || !villages.includes(prevVillage)) return firstVillage;
      return prevVillage;
    });
  }, [selectedRole, sector, cell]);

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
          role: selectedRole.toUpperCase(),
          healthCenterId: healthCenterId ? Number(healthCenterId) : null,
          district,
          sector,
          cell,
          village,
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
    <div className="min-h-screen flex relative">
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector />
      </div>
      
      {/* Left visual panel from login, reuse layout */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <img src={logo} alt="NutriGuard logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-primary-foreground font-display text-xl font-bold">{t('home.title')}</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-primary-foreground font-display text-4xl font-bold leading-tight mb-4">
            {t('home.hero_title').split(' ').slice(0, 3).join(' ')}<br />{t('home.hero_title').split(' ').slice(3).join(' ')}
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[
            { n: stats ? `${stats.totalChildren.toLocaleString()}+` : "12,450+", l: t('home.stats_children') },
            { n: stats ? stats.totalHealthWorkers.toLocaleString() : "340", l: t('home.stats_chw') },
            { n: stats ? stats.detectionRate : "95%", l: t('home.stats_detection') },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-primary-foreground font-display text-2xl font-bold">{s.n}</div>
              <div className="text-primary-foreground/60 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <img src={logo} alt="NutriGuard logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">{t('home.title')}</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-1">{t('auth.create_account')}</h2>
          <p className="text-muted-foreground mb-8">{t('auth.request_access_desc')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.full_name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email_address')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t('auth.select_role')}</Label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedRole === r.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {r.icon}
                    <span className="text-sm font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedRole === "nurse" && (
              <div className="space-y-2">
                <Label htmlFor="healthCenter">{t('common.health_center')}</Label>
                <select
                  id="healthCenter"
                  className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={healthCenterId}
                  onChange={(e) => setHealthCenterId(e.target.value)}
                  required
                >
                  {healthCenters.length > 0 ? (
                    healthCenters.map((hc) => (
                      <option key={hc.id} value={hc.id}>{hc.name}</option>
                    ))
                  ) : (
                    <option value="">{t('common.no_centers')}</option>
                  )}
                </select>
                {healthCenterError ? (
                  <p className="text-xs text-destructive">{healthCenterError}</p>
                ) : loadingCenters ? (
                  <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
                ) : null}
              </div>
            )}

            {selectedRole === "chw" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('location.district')}</Label>
                  <Input className="h-12 bg-muted cursor-not-allowed" value="Kicukiro" disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('location.sector')}</Label>
                  <select
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    required
                  >
                    <option value="">{t('location.select_sector')}</option>
                    {Object.keys(chwLocationConfig).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('location.cell')}</Label>
                  <select
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={cell}
                    onChange={(e) => setCell(e.target.value)}
                    required
                    disabled={!sector}
                  >
                    <option value="">{t('location.select_cell')}</option>
                    {(chwLocationConfig[sector as keyof typeof chwLocationConfig]?.cells || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('location.village')}</Label>
                  <select
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    required
                    disabled={!cell}
                  >
                    <option value="">{t('location.select_village')}</option>
                    {(chwLocationConfig[sector as keyof typeof chwLocationConfig]?.villages[cell as keyof any] || []).map((v: string) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="chwHealthCenter">{t('common.health_center')}</Label>
                  <select
                    id="chwHealthCenter"
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={healthCenterId}
                    onChange={(e) => setHealthCenterId(e.target.value)}
                    required
                  >
                    {healthCenters.length > 0 ? (
                      healthCenters.map((hc) => (
                        <option key={hc.id} value={hc.id}>{hc.name}</option>
                      ))
                    ) : (
                      <option value="">{t('common.no_centers')}</option>
                    )}
                  </select>
                  {healthCenterError ? (
                    <p className="text-xs text-destructive">{healthCenterError}</p>
                  ) : loadingCenters ? (
                    <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
                  ) : null}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? t('common.loading') : t('auth.request_button')}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                {t('auth.already_have_account')}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-primary font-bold hover:underline"
                >
                  {t('auth.back_to_login')}
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
