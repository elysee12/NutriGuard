import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { FaBaby, FaUserMd, FaChartLine } from "react-icons/fa";
import logo from "@/assets/logo.jpg";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { fetchPublicStats, PublicStats } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // toast already handled in AuthContext
    }
  };

  return (
    <div className="h-screen flex relative bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-teal-300/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Left panel - Premium Medical Hero */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-teal-600 to-primary/90 relative overflow-hidden flex-col justify-between p-8">
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        
        {/* Logo and Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-xl">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-white font-display text-lg font-bold">e-KuraNeza Kibondo</span>
          </div>
          <p className="text-white/80 text-xs ml-[60px]">Rwanda Health Platform</p>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 -mt-8">
          <h1 className="text-white font-display text-4xl font-bold leading-tight mb-4">
            Protecting Rwanda's<br />Future Generation
          </h1>
          <p className="text-white/90 text-base max-w-md leading-relaxed">
            AI-powered platform helping healthcare workers identify and prevent childhood malnutrition through intelligent data-driven assessments.
          </p>
        </div>
        
        {/* Premium Statistics Cards */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-3">
            {[
              { 
                n: stats ? (stats.totalChildren >= 1000 ? `${(stats.totalChildren / 1000).toFixed(1)}k+` : `${stats.totalChildren}+`) : "12.5k+", 
                l: "Children Monitored", 
                Icon: FaBaby 
              },
              { 
                n: stats ? stats.totalHealthWorkers.toLocaleString() : "340+", 
                l: "Health Workers", 
                Icon: FaUserMd 
              },
              { 
                n: stats ? stats.detectionRate : "95%", 
                l: "Early Detection", 
                Icon: FaChartLine 
              },
            ].map((s) => (
              <div key={s.l} className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-xl mb-1"><s.Icon className="text-white" /></div>
                <div className="text-white font-display text-xl font-bold mb-0.5">{s.n}</div>
                <div className="text-white/70 text-[10px] font-semibold leading-tight">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Premium Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-lg flex items-center justify-center ring-4 ring-primary/10">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-foreground block">e-KuraNeza Kibondo</span>
              <span className="text-xs text-muted-foreground">Rwanda Health Platform</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            {/* Login Card Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{t('auth.welcome_back')}</h2>
                <p className="text-xs text-muted-foreground">{t('auth.sign_in_desc')}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-bold text-foreground">
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-bold text-foreground">
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-primary"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  className="text-xs text-primary font-bold hover:underline transition-all"
                  onClick={() => navigate("/forgot")}
                >
                  {t('auth.forgot_password')}
                </button>
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-bold bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 shadow-lg hover:shadow-xl transition-all">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {t('auth.sign_in_button')}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] text-muted-foreground font-semibold">New to the platform?</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {/* Request Access */}
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-bold border-2 border-slate-200 hover:bg-slate-50 hover:border-primary transition-all"
              onClick={() => navigate("/register")}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {t('auth.request_access')}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[10px] text-slate-600 mt-4">
            © 2026 e-KuraNeza Kibondo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
