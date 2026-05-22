import { useState } from "react";
import { X, Eye, EyeOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface ProfileUpdateModalProps {
  onClose: () => void;
}

export default function ProfileUpdateModal({ onClose }: ProfileUpdateModalProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "password">("basic");

  const handleBasicUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.name_empty_error'),
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.email_empty_error'),
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    if (!email.includes("@")) {
      toast({
        title: t('common.error'),
        description: t('auth.email_invalid_error'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/${user?.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('auth.profile_update_failed'));
      }

      toast({
        title: t('common.success'),
        description: t('auth.profile_updated_success'),
      });

      // Update local storage with new user data
      localStorage.setItem("auth_user", JSON.stringify({
        ...user,
        name: data.name,
        email: data.email,
      }));

      // Close modal after successful update
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.profile_update_failed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.current_password_empty_error'),
        variant: "destructive",
      });
      return;
    }

    if (!newPassword.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.new_password_empty_error'),
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

    if (currentPassword === newPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.password_same_error'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/${user?.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('auth.update_failed'));
      }

      toast({
        title: t('common.success'),
        description: t('auth.password_updated_success'),
      });

      // Reset fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close modal and logout after successful password change
      setTimeout(() => {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.update_failed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4 border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex items-center justify-between border-b">
          <h2 className="text-xl font-bold">{t('common.update_profile')}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === "basic"
                ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t('common.basic_info')}
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === "password"
                ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t('auth.password')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <form onSubmit={handleBasicUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  {t('auth.full_name')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {t('auth.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">
                  {t('common.email_change_warning')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 border-gray-300"
                  onClick={onClose}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ {t('common.password_change_warning')}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
                  {t('common.current_password')}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                  {t('common.new_password')}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{t('common.min_6_chars')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  {t('common.confirm_new_password')}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 border-gray-300"
                  onClick={onClose}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('common.update_button', 'Update Password')
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
