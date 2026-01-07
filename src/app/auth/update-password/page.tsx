"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setReady(true);
      } else {
        setError("الرابط غير صالح أو منتهي الصلاحية. برجاء طلب رابط جديد.");
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("حدث خطأ أثناء تحديث كلمة المرور. حاول مرة أخرى");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/auth");
    }, 2000);
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 relative" dir="rtl">
       <Button 
        variant="outline" 
        className="absolute top-4 right-4 rounded-full shadow-sm"
        onClick={() => router.back()}
      >
        <ArrowRight className="h-4 w-4 ml-2" />
        العودة للخلف
      </Button>
      <div className="w-full max-w-md space-y-6 p-8 bg-card shadow-lg rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">تعيين كلمة مرور جديدة</h1>
          <p className="text-sm text-muted-foreground">أدخل كلمة المرور الجديدة</p>
        </div>

        {!ready && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جارٍ التحقق من الرابط...</p>
          </div>
        )}

        {error && !success && (
          <div className="space-y-4">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm text-center">
              {error}
            </div>
            <Button 
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full rounded-lg"
              variant="outline"
            >
              طلب رابط جديد
            </Button>
          </div>
        )}

        {success && (
          <div className="bg-primary/10 text-primary p-4 rounded-lg text-sm text-center">
            تم تحديث كلمة المرور بنجاح. جاري التحويل...
          </div>
        )}

        {ready && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="text-right rounded-lg"
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="text-right rounded-lg"
                placeholder="أعد إدخال كلمة المرور"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 rounded-lg" 
              disabled={loading}
            >
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>
          </form>
        )}

        {ready && !success && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              <a href="/auth/forgot-password" className="text-primary underline">
                طلب رابط جديد
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
