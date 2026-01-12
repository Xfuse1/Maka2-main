# دليل النشر والإعداد
# Deployment & Setup Guide

---

## 🚀 النشر الأوتوماتيكي (الطريقة الموصى بها)

### الطريقة 1: سكريبت أوتوماتيكي كامل ⚡

```powershell
# خطوة واحدة فقط!
pnpm run deploy:auto
```

هذا السكريبت سيقوم بـ:
- ✅ بناء المشروع والتحقق من عدم وجود أخطاء
- ✅ إعداد Git Repository
- ✅ ربط مع GitHub (أو إرشادك لإنشاء repo)
- ✅ رفع الكود إلى GitHub
- ✅ تسجيل الدخول إلى Vercel
- ✅ نشر المشروع على Vercel

### الطريقة 2: إعداد متغيرات البيئة أوتوماتيكياً

```powershell
# إعداد جميع متغيرات البيئة ورفعها لـ Vercel
pnpm run env:setup
```

سيطلب منك:
- Supabase URL & Keys
- Kashier API Keys
- Perplexity API Key
- ثم يرفعها تلقائياً إلى Vercel

### الطريقة 3: GitHub Actions (نشر تلقائي عند كل Push)

1. **إعداد Secrets في GitHub:**
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

2. **أضف Secrets التالية:**
   ```
   VERCEL_TOKEN            # من Vercel > Settings > Tokens
   VERCEL_ORG_ID           # شغل: pnpm vercel:link ثم افتح .vercel/project.json
   VERCEL_PROJECT_ID       # من نفس الملف
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Push إلى GitHub:**
   ```powershell
   git add .
   git commit -m "Deploy automatically"
   git push
   ```

   **النشر سيتم أوتوماتيكياً! 🎉**

---

## 🗄️ إعداد قاعدة البيانات على Supabase

### الطريقة 1: باستخدام Supabase Dashboard (الأسهل)

1. **افتح مشروعك في Supabase:**
   - اذهب إلى [supabase.com](https://supabase.com)
   - افتح مشروعك

2. **SQL Editor:**
   - من القائمة الجانبية، اختر "SQL Editor"
   - انسخ محتوى الملف `scripts/multi-tenant/01-stores-table.sql`
   - الصقه في المحرر واضغط "Run"
   - كرر العملية لباقي الملفات بالترتيب

3. **التحقق:**
   ```sql
   -- تحقق من إنشاء الجداول
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### الطريقة 2: باستخدام Supabase CLI

```powershell
# 1. تثبيت Supabase CLI
npm install -g supabase

# 2. تسجيل الدخول
supabase login

# 3. ربط المشروع
supabase link --project-ref your-project-ref
# ستجد project-ref في Settings > General > Reference ID

# 4. تنفيذ جميع Migration files
supabase db push

# أو تنفيذ ملف محدد
supabase db execute -f scripts/multi-tenant/01-stores-table.sql
```

### الطريقة 3: باستخدام Node.js Script

```powershell
# 1. تثبيت المكتبات المطلوبة
pnpm add -D pg dotenv

# 2. إضافة DATABASE_URL إلى .env.local
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 3. تشغيل السكربت
node scripts/setup-database-pg.js
```

### الحصول على DATABASE_URL من Supabase:

1. اذهب إلى **Settings** > **Database**
2. في قسم **Connection string**، اختر **URI**
3. انسخ الرابط (سيكون بهذا الشكل):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. استبدل `[YOUR-PASSWORD]` بكلمة المرور الخاصة بقاعدة البيانات

### الحصول على SUPABASE_SERVICE_ROLE_KEY:

1. اذهب إلى **Settings** > **API**
2. في قسم **Project API keys**
3. انسخ **service_role** key (⚠️ احتفظ به سرياً!)

---

## 🚀 النشر على Vercel

### الطريقة 1: من خلال Vercel Dashboard (الأسهل)

#### الخطوة 1: ربط المشروع بـ GitHub

```powershell
# إذا لم يكن مشروعك على GitHub بعد
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/maka-store.git
git push -u origin main
```

#### الخطوة 2: استيراد المشروع في Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **"Add New"** > **"Project"**
3. اختر **"Import Git Repository"**
4. اختر الريبو الخاص بك من GitHub
5. اضغط **"Import"**

#### الخطوة 3: إعدادات المشروع

```
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm run build
Output Directory: .next
Install Command: pnpm install
```

#### الخطوة 4: إضافة Environment Variables

في صفحة الإعدادات، أضف المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
KASHIER_API_KEY=your-kashier-key
NEXT_PUBLIC_KASHIER_MERCHANT_ID=your-merchant-id
PERPLEXITY_API_KEY=your-perplexity-key
```

5. اضغط **"Deploy"**

### الطريقة 2: باستخدام Vercel CLI

```powershell
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. تسجيل الدخول
vercel login

# 3. ربط المشروع (أول مرة فقط)
vercel link

# 4. إضافة Environment Variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... باقي المتغيرات

# أو استيراد من ملف
vercel env pull .env.local

# 5. نشر نسخة تجريبية
vercel

# 6. نشر نسخة إنتاج
vercel --prod
```

### الطريقة 3: باستخدام السكربت الجاهز

```powershell
# نشر نسخة تجريبية
pnpm run deploy

# نشر نسخة إنتاج
pnpm run deploy:prod
```

---

## 🔧 إعداد CI/CD تلقائي

### GitHub Actions للنشر التلقائي

قم بإنشاء ملف `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build project
        run: pnpm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### إضافة Secrets في GitHub:

1. اذهب إلى **Settings** > **Secrets and variables** > **Actions**
2. أضف:
   - `VERCEL_TOKEN` (من Vercel > Settings > Tokens)
   - `VERCEL_ORG_ID` (من .vercel/project.json بعد `vercel link`)
   - `VERCEL_PROJECT_ID` (من .vercel/project.json)
   - جميع متغيرات البيئة الأخرى

---

## 🔄 سكريبتات مفيدة

```powershell
# نشر أوتوماتيكي كامل
pnpm run deploy:auto

# إعداد متغيرات البيئة
pnpm run env:setup

# ربط مع Vercel
pnpm run vercel:link

# سحب متغيرات البيئة من Vercel
pnpm run vercel:env

# نشر نسخة تجريبية
pnpm run deploy:preview

# نشر نسخة إنتاج
pnpm run deploy:prod

# إعداد Git Repository
pnpm run github:setup
```

---

## 📋 Checklist للنشر الأوتوماتيكي

### قبل البدء:
- [ ] تأكد من تثبيت Git
- [ ] قم بإنشاء حساب على GitHub
- [ ] قم بإنشاء حساب على Vercel
- [ ] قم بإنشاء مشروع على Supabase

### خطوة واحدة:
```powershell
pnpm run deploy:auto
```

### بعد النشر:
- [ ] افتح Vercel Dashboard
- [ ] تحقق من Environment Variables
- [ ] اختبر الموقع
- [ ] أضف Custom Domain (اختياري)

---

## 🎯 مقارنة الطرق

| الميزة | يدوي | سكريبت أوتوماتيكي | GitHub Actions |
|--------|------|-------------------|----------------|
| الوقت المطلوب | 30-60 دقيقة | 5-10 دقائق | إعداد مرة واحدة |
| سهولة الاستخدام | متوسط | سهل جداً | سهل |
| نشر تلقائي | ❌ | ❌ | ✅ |
| للمبتدئين | ❌ | ✅ | ✅ |

**الموصى به:** استخدم السكريبت الأوتوماتيكي للنشر الأول، ثم فعّل GitHub Actions للتحديثات التلقائية.

---

## 🐛 حل المشاكل الشائعة

### مشكلة: "vercel: command not found"

```powershell
npm install -g vercel
```

### مشكلة: "Git not initialized"

```powershell
pnpm run github:setup
```

### مشكلة: فشل رفع Environment Variables

```powershell
# سحبها من Vercel
pnpm run vercel:env

# أو رفعها من جديد
pnpm run env:setup
```

---

## 📞 الدعم

### مشاكل في النشر؟
1. تأكد من تشغيل `pnpm run build` بنجاح محلياً
2. راجع logs في Vercel Dashboard
3. تحقق من GitHub Actions logs

### حاجة مساعدة؟
- 📧 افتح Issue على GitHub
- 💬 راجع Documentation

---

**تم التحديث:** 7 يناير 2026
