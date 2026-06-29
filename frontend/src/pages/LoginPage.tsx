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
    <div className="min-h-screen flex relative bg-background">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSelector />
      </div>

      {/* Left panel - Premium Medical Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden flex-col justify-between p-12">
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full bg-white blur-3xl" />
        </div>
        
        {/* Logo and Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-xl">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-white font-display text-xl font-bold">e-KuraNeza Kibondo</span>
          </div>
          <p className="text-white/80 text-sm ml-[68px]">Rwanda Health Platform</p>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10">
          <h1 className="text-white font-display text-5xl font-bold leading-tight mb-6">
            Early Detection of<br />Stunting in Children
          </h1>
          <p className="text-white/90 text-xl max-w-lg leading-relaxed">
            ML-powered platform helping Rwanda's healthcare workers identify and prevent childhood stunting through data-driven assessments.
          </p>
        </div>
        
        {/* Premium Statistics Cards */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: stats ? (stats.totalChildren >= 1000 ? `${(stats.totalChildren / 1000).toFixed(1)}k+` : `${stats.totalChildren}+`) : "0+", l: "Children Screened", Icon: FaBaby },
              { n: stats ? stats.totalHealthWorkers.toLocaleString() : "340", l: "Health Workers", Icon: FaUserMd },
              { n: stats ? stats.detectionRate : "95%", l: "Detection Rate", Icon: FaChartLine },
            ].map((s) => (
              <div key={s.l} className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-2xl mb-1"><s.Icon className="text-white" /></div>
                <div className="text-white font-display text-2xl font-bold mb-1">{s.n}</div>
                <div className="text-white/70 text-xs font-semibold">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Premium Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <img src={logo} alt="e-KuraNeza Kibondo logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-foreground block">e-KuraNeza Kibondo</span>
              <span className="text-xs text-muted-foreground">Rwanda Health Platform</span>
            </div>
          </div>

          {/* Login Card with Icon */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{t('auth.welcome_back')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.sign_in_desc')}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-foreground">
                {t('auth.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 bg-muted/50 border-border focus:bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-foreground">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-11 pr-12 bg-muted/50 border-border focus:bg-background"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-primary font-bold hover:underline transition-all"
                onClick={() => navigate("/forgot")}
              >
                {t('auth.forgot_password')}
              </button>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {t('auth.sign_in_button')}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-xs text-muted-foreground font-semibold">New to mHealth?</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          {/* Request Access */}
          <Button
            variant="outline"
            className="w-full h-12 text-base font-bold border-2"
            onClick={() => navigate("/register")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {t('auth.request_access')}
          </Button>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 e-KuraNeza Kibondo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
