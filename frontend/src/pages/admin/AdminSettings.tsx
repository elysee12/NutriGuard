import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/DashboardComponents";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
      <div className="p-6 lg:p-8 max-w-4xl">
        <PageHeader title={t('admin.system_settings_title')} description={t('admin.system_settings_desc')} />

        <div className="grid gap-6 mt-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.general_settings')}</CardTitle>
              <CardDescription>Basic system identity and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="system-name">{t('admin.system_name')}</Label>
                <Input id="system-name" defaultValue="e-KuraNeza Kibondo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-email">{t('admin.support_email')}</Label>
                <Input id="support-email" type="email" defaultValue="support@ekuraneza.gov.rw" />
              </div>
            </CardContent>
          </Card>

          {/* ML Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.ml_config')}</CardTitle>
              <CardDescription>Adjust machine learning model parameters and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="threshold">{t('admin.stunting_threshold')}</Label>
                <div className="flex items-center gap-4">
                  <Input id="threshold" type="number" defaultValue="65" className="w-24" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('admin.stunting_threshold_desc')}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('admin.auto_approve_assessments')}</Label>
                  <p className="text-xs text-muted-foreground">Automatically mark low-risk assessments as reviewed.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.notifications')}</CardTitle>
              <CardDescription>Configure how the system alerts users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('admin.email_notifications')}</Label>
                  <p className="text-xs text-muted-foreground">Send email updates for high-risk cases.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('admin.sms_alerts')}</Label>
                  <p className="text-xs text-muted-foreground">Send SMS alerts to CHWs for urgent follow-ups.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('admin.save_settings')}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

