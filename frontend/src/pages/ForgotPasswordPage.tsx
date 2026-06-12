import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import { fetchPublicStats, PublicStats } from "@/lib/api";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forgotPassword, resetPassword } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(console.error);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.enter_email_error'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("otp");
      toast({
        title: t('common.success'),
        description: t('auth.otp_sent'),
      });
    } catch (error) {
      console.error("Failed to send OTP:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.enter_otp_error'),
        variant: "destructive",
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: t('common.error'),
        description: t('auth.otp_digits_error'),
        variant: "destructive",
      });
      return;
    }

    setStep("password");
    toast({
      title: t('auth.otp_verified'),
      description: t('auth.set_new_password_now'),
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.enter_new_password_error'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.password_min_length_error'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwords_dont_match'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast({
        title: t('common.success'),
        description: t('auth.password_reset_success'),
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Failed to reset password:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Language Selector Overlay */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Left Panel */}
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <img src={logo} alt="NutriGuard logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">{t('home.title')}</span>
          </div>

          {/* Header */}
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {step === "email" && t('auth.forgot_password')}
            {step === "otp" && t('auth.enter_otp')}
            {step === "password" && t('auth.set_new_password')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {step === "email" && t('auth.forgot_password_desc')}
            {step === "otp" && t('auth.enter_otp_desc')}
            {step === "password" && t('auth.set_new_password_desc')}
          </p>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`h-2 flex-1 rounded-full transition-colors ${step === "email" || step === "otp" || step === "password" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step === "otp" || step === "password" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full transition-colors ${step === "password" ? "bg-primary" : "bg-muted"}`} />
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email_address')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.sending_otp')}
                  </>
                ) : (
                  t('auth.send_otp')
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.remember_password')}{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  {t('auth.sign_in')}
                </span>
              </p>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">{t('auth.enter_otp')}</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('auth.otp_sent_to', { email: <strong>{email}</strong> })}
                </p>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading || otp.length !== 6}>
                {t('auth.verify_otp')}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("email")}
                >
                  {t('auth.back')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleEmailSubmit}
                  disabled={loading}
                >
                  {loading ? t('auth.resending') : t('auth.resend_otp')}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.remember_password')}{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  {t('auth.sign_in')}
                </span>
              </p>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.new_password')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('auth.password_min_length_error')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.resetting')}
                  </>
                ) : (
                  t('auth.reset_password')
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("otp")}
                disabled={loading}
              >
                {t('auth.back')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.remember_password')}{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  {t('auth.sign_in')}
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
