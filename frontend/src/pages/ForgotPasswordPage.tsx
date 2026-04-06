import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Eye, EyeOff, Loader } from "lucide-react";
import logo from "@/assets/logo.jpg";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("otp");
      toast({
        title: "Success",
        description: "OTP has been sent to your email",
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
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "OTP must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setStep("password");
    toast({
      title: "OTP Verified",
      description: "Now please set your new password",
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast({
        title: "Success",
        description: "Password has been reset successfully",
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
            <span className="text-primary-foreground font-display text-xl font-bold">NutriGuard</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-primary-foreground font-display text-4xl font-bold leading-tight mb-4">
            Early Detection of<br />Stunting in Children
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            ML-powered platform helping Rwanda's healthcare workers identify and prevent childhood stunting through data-driven assessments.
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[
            { n: "12,450+", l: "Children Screened" },
            { n: "340", l: "Health Workers" },
            { n: "95%", l: "Detection Rate" },
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
            <span className="font-display text-xl font-bold text-foreground">NutriGuard</span>
          </div>

          {/* Header */}
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Enter OTP"}
            {step === "password" && "Set New Password"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {step === "email" && "Enter the email associated with your account and we'll send you an OTP to reset your password."}
            {step === "otp" && "Enter the 6-digit OTP we sent to your email to verify your identity."}
            {step === "password" && "Create a new password for your account. Make sure it's strong and secure."}
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
                <Label htmlFor="email">Email Address</Label>
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
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  Sign in
                </span>
              </p>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  We sent a 6-digit code to <strong>{email}</strong>
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
                Verify OTP
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("email")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleEmailSubmit}
                  disabled={loading}
                >
                  {loading ? "Resending..." : "Resend OTP"}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  Sign in
                </span>
              </p>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
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
                  At least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("otp")}
                disabled={loading}
              >
                Back
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <span
                  className="text-primary font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/")}
                >
                  Sign in
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
