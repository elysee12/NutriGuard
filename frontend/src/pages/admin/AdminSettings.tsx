import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings, Globe, Brain, Bell } from "lucide-react";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: t('common.success'),
        description: t('admin.user_updated_desc'), // Reusing a success message
      });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-white/80" />
                <span className="text-white/90 text-sm font-semibold tracking-wider">CONFIGURATION</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {t('admin.system_settings_title', 'System Settings')}
              </h1>
              <p className="text-white/90 text-lg">
                {t('admin.system_settings_desc', 'Configure system parameters and preferences')}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* General Settings */}
            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('admin.general_settings', 'General Settings')}</CardTitle>
                    <CardDescription>Basic system identity and contact information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-2">
                  <Label htmlFor="system-name" className="font-bold text-slate-900">{t('admin.system_name', 'System Name')}</Label>
                  <Input id="system-name" defaultValue="e-KuraNeza Kibondo" className="h-11 border-slate-300 focus-visible:ring-purple-500" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-email" className="font-bold text-slate-900">{t('admin.support_email', 'Support Email')}</Label>
                  <Input id="support-email" type="email" defaultValue="support@ekuraneza.gov.rw" className="h-11 border-slate-300 focus-visible:ring-purple-500" />
                </div>
              </CardContent>
            </Card>

            {/* ML Configuration */}
            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('admin.ml_config', 'ML Configuration')}</CardTitle>
                    <CardDescription>Adjust machine learning model parameters and thresholds</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-2">
                  <Label htmlFor="threshold" className="font-bold text-slate-900">{t('admin.stunting_threshold', 'Stunting Threshold')}</Label>
                  <div className="flex items-center gap-4">
                    <Input id="threshold" type="number" defaultValue="65" className="w-24 h-11 border-slate-300 focus-visible:ring-purple-500" />
                    <span className="text-sm font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-xs text-slate-500">{t('admin.stunting_threshold_desc', 'Confidence threshold for stunting predictions')}</p>
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="font-bold text-slate-900">{t('admin.auto_approve_assessments', 'Auto-Approve Low Risk')}</Label>
                    <p className="text-xs text-slate-500">Automatically mark low-risk assessments as reviewed.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{t('admin.notifications', 'Notifications')}</CardTitle>
                    <CardDescription>Configure how the system alerts users</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="font-bold text-slate-900">{t('admin.email_notifications', 'Email Notifications')}</Label>
                    <p className="text-xs text-slate-500">Send email updates for high-risk cases.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="font-bold text-slate-900">{t('admin.sms_alerts', 'SMS Alerts')}</Label>
                    <p className="text-xs text-slate-500">Send SMS alerts to CHWs for urgent follow-ups.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" className="h-11 rounded-xl font-bold">{t('common.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 rounded-xl font-bold">
                {saving ? t('common.saving') : t('admin.save_settings', 'Save Settings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}