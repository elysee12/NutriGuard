import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

// simple helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const query = useQuery();
  const token = query.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { resetPassword } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: t('auth.passwords_dont_match'), variant: "destructive" });
      return;
    }
    resetPassword(token, password);
    toast({ title: t('auth.reset_password'), description: t('auth.password_reset_success') });
    navigate("/");
  };

  useEffect(() => {
    if (!token) {
      // no token provided, redirect
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Language Selector Overlay */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

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
            { n: "12,450+", l: t('home.stats_children') },
            { n: "340", l: t('home.stats_chw') },
            { n: "95%", l: t('home.stats_detection') },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-primary-foreground font-display text-2xl font-bold">{s.n}</div>
              <div className="text-primary-foreground/60 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <img src={logo} alt="NutriGuard logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">{t('home.title')}</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-1">{t('auth.reset_password')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('auth.reset_password_page_desc')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.new_password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">{t('auth.confirm_password')}</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-12"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold">
              {t('auth.change_password_button')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.remembered')}{' '}
              <span
                className="text-primary font-medium cursor-pointer hover:underline"
                onClick={() => navigate("/")}
              >
                {t('auth.sign_in')}
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
