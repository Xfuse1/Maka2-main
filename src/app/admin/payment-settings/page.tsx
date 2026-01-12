"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, Key, CreditCard } from "lucide-react";

interface KashierSettings {
  kashier_merchant_id: string;
  kashier_api_key: string;
  kashier_test_mode: boolean;
  kashier_webhook_secret: string;
  kashier_enabled: boolean;
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<KashierSettings>({
    kashier_merchant_id: "",
    kashier_api_key: "",
    kashier_test_mode: true,
    kashier_webhook_secret: "",
    kashier_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payment-settings");
      if (!response.ok) throw new Error("Failed to load settings");
      
      const data = await response.json();
      setSettings({
        kashier_merchant_id: data.kashier_merchant_id || "",
        kashier_api_key: data.kashier_api_key || "",
        kashier_test_mode: data.kashier_test_mode ?? true,
        kashier_webhook_secret: data.kashier_webhook_secret || "",
        kashier_enabled: data.kashier_enabled ?? false,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "فشل تحميل الإعدادات" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validation
      if (settings.kashier_enabled && !settings.kashier_merchant_id) {
        setMessage({ type: "error", text: "يرجى إدخال Merchant ID" });
        return;
      }
      if (settings.kashier_enabled && !settings.kashier_api_key) {
        setMessage({ type: "error", text: "يرجى إدخال API Key" });
        return;
      }

      const response = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح ✅" });
      
      // Reload to get potentially encrypted data
      await loadSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: error.message || "فشل حفظ الإعدادات" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          إعدادات بوابة الدفع
        </h1>
        <p className="text-muted-foreground mt-2">
          إدارة إعدادات Kashier Payment Gateway الخاصة بمتجرك
        </p>
      </div>

      {/* Alert Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Kashier Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Kashier Configuration
          </CardTitle>
          <CardDescription>
            قم بإدخال بيانات حساب Kashier الخاص بمتجرك. يمكنك الحصول عليها من{" "}
            <a
              href="https://merchants.kashier.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              لوحة تحكم Kashier
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Kashier */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label className="text-base font-medium">تفعيل Kashier</Label>
              <p className="text-sm text-muted-foreground mt-1">
                تفعيل بوابة الدفع Kashier لقبول المدفوعات
              </p>
            </div>
            <Switch
              checked={settings.kashier_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, kashier_enabled: checked })
              }
            />
          </div>

          {/* Merchant ID */}
          <div className="space-y-2">
            <Label htmlFor="merchant_id" className="flex items-center gap-2">
              Merchant ID (MID)
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="merchant_id"
              type="text"
              placeholder="MID-XXX-XXX"
              value={settings.kashier_merchant_id}
              onChange={(e) =>
                setSettings({ ...settings, kashier_merchant_id: e.target.value })
              }
              disabled={!settings.kashier_enabled}
            />
            <p className="text-xs text-muted-foreground">
              معرف التاجر الخاص بك من Kashier
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key" className="flex items-center gap-2">
              API Key (Secret Key)
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                placeholder="••••••••••••••••••••"
                value={settings.kashier_api_key}
                onChange={(e) =>
                  setSettings({ ...settings, kashier_api_key: e.target.value })
                }
                disabled={!settings.kashier_enabled}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={!settings.kashier_enabled}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              المفتاح السري للـ API (يتم تشفيره عند الحفظ)
            </p>
          </div>

          {/* Test Mode */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Test Mode (Sandbox)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                استخدام بيئة الاختبار بدلاً من الإنتاج
              </p>
            </div>
            <Switch
              checked={settings.kashier_test_mode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, kashier_test_mode: checked })
              }
              disabled={!settings.kashier_enabled}
            />
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook_secret" className="flex items-center gap-2">
              Webhook Secret
              <span className="text-muted-foreground text-xs font-normal">(اختياري)</span>
            </Label>
            <div className="relative">
              <Input
                id="webhook_secret"
                type={showWebhookSecret ? "text" : "password"}
                placeholder="••••••••••••••••••••"
                value={settings.kashier_webhook_secret}
                onChange={(e) =>
                  setSettings({ ...settings, kashier_webhook_secret: e.target.value })
                }
                disabled={!settings.kashier_enabled}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={!settings.kashier_enabled}
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              مفتاح التحقق من Webhooks (للأمان الإضافي)
            </p>
          </div>

          {/* Info Alert */}
          {settings.kashier_test_mode && settings.kashier_enabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>وضع الاختبار مفعّل:</strong> جميع المدفوعات ستتم في بيئة Sandbox.
                لا يتم خصم أموال حقيقية.
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={saving || loading}
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">كيفية الحصول على بيانات Kashier؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>قم بتسجيل الدخول إلى <a href="https://merchants.kashier.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">لوحة تحكم Kashier</a></li>
            <li>اذهب إلى Settings → API Keys</li>
            <li>انسخ Merchant ID (MID) و Secret Key</li>
            <li>اختر Test Mode إذا كنت في مرحلة التجربة</li>
            <li>الصق البيانات هنا واحفظ</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
