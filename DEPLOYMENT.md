# دليل النشر الشامل - Mister Chicken Raffle

## 📋 قائمة التحقق قبل النشر

- [ ] قاعدة البيانات Neon جاهزة
- [ ] Backend على Render جاهز
- [ ] Frontend على Netlify جاهز
- [ ] جميع المتغيرات البيئية مضبوطة
- [ ] تم اختبار النظام محلياً

---

## 1️⃣ إعداد قاعدة البيانات على Neon

### الخطوات:

1. **إنشاء حساب:**
   - اذهب إلى https://neon.tech
   - سجل دخول بحساب GitHub أو Google
   - اختر الخطة المجانية (Free Tier)

2. **إنشاء مشروع جديد:**
   - اضغط "New Project"
   - اسم المشروع: `chicken-master-raffle`
   - المنطقة: اختر الأقرب (Europe أو US East)
   - PostgreSQL Version: 15 (الافتراضي)

3. **الحصول على Connection String:**
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
   احفظه! ستحتاجه لاحقاً

4. **تنفيذ Schema:**
   - في لوحة Neon، اذهب إلى "SQL Editor"
   - افتح ملف `backend/db/schema.sql`
   - انسخ والصق كل المحتوى
   - اضغط "Run"

5. **التحقق:**
   ```sql
   SELECT * FROM registrations;
   SELECT * FROM admin_users;
   ```
   يجب أن ترى الجداول فارغة

---

## 2️⃣ نشر Backend على Render

### الخطوات:

1. **رفع الكود إلى GitHub:**
   ```bash
   cd raffle/backend
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **إنشاء Web Service على Render:**
   - اذهب إلى https://render.com
   - سجل دخول
   - اضغط "New +" → "Web Service"
   - اربط GitHub repository
   - اختر repository الخاص بك

3. **إعدادات:**
   - **Name:** `chicken-master-api`
   - **Region:** Frankfurt (أقرب لفلسطين)
   - **Branch:** `main`
   - **Root Directory:** `backend` (إذا كان Backend في مجلد فرعي)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **متغيرات البيئة:**
   اضغط "Environment" وأضف:
   ```
   DATABASE_URL=<نسخ_من_neon>
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<انشئ_سر_قوي_عشوائي>
   FRONTEND_URL=https://your-app.netlify.app
   WHATSAPP_NUMBER=+970567811812
   INSTAGRAM_URL=https://www.instagram.com/chicken_master26/
   FACEBOOK_URL=https://www.facebook.com/profile.php?id=61587454410215
   RAFFLE_END_DATE=2026-03-29T23:59:59
   ```

5. **انشر:**
   - اضغط "Create Web Service"
   - انتظر 2-3 دقائق
   - احصل على الرابط: `https://chicken-master-api.onrender.com`

6. **اختبار:**
   - زر `https://chicken-master-api.onrender.com/health`
   - يجب أن ترى: `{"success": true, "message": "Server is running"}`

---

## 3️⃣ نشر Frontend على Netlify

### الطريقة 1: Netlify Drop (الأسهل)

1. **تحديث API URL:**
   - افتح `frontend/js/app.js`
   - غيّر السطر:
   ```javascript
   const API_BASE_URL = 'https://chicken-master-api.onrender.com/api';
   ```

2. **النشر:**
   - اذهب إلى https://netlify.com
   - اسحب مجلد `frontend` إلى المنطقة
   - انتظر ثواني
   - احصل على الرابط: `https://random-name.netlify.app`

3. **تخصيص الدومين (اختياري):**
   - Site Settings → Domain Management
   - Change site name: `chicken-master-raffle`
   - الرابط الجديد: `https://chicken-master-raffle.netlify.app`

### الطريقة 2: GitHub (احترافية)

1. **رفع الكود:**
   ```bash
   cd raffle/frontend
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **على Netlify:**
   - New site from Git
   - Connect to GitHub
   - اختر repository
   - Build settings:
     - Build command: (اتركه فارغاً)
     - Publish directory: `.`

---

## 4️⃣ ربط Frontend مع البيakend

1. **حدّث Render Environment Variables:**
   - ارجع إلى Render
   - Environment → Edit `FRONTEND_URL`
   - ضع رابط Netlify الجديد
   - Save

2. **إعادة نشر Backend:**
   - في Render، اضغط "Manual Deploy" → "Deploy latest commit"

3. **اختبار:**
   - افتح `https://your-app.netlify.app`
   - جرب التسجيل
   - تحقق من رسالة WhatsApp

---

## 5️⃣ إعداد Admin

### تغيير كلمة المرور:

1. **محلياً:**
   ```bash
   npm install bcrypt --save
   node
   ```

2. **في Node REPL:**
   ```javascript
   const bcrypt = require('bcrypt');
   const password = 'your-secure-password-here';
   bcrypt.hash(password, 10).then(hash => console.log(hash));
   ```

3. **في Neon SQL Editor:**
   ```sql
   UPDATE admin_users 
   SET password_hash = '<الـhash_من_الخطوة_السابقة>'
   WHERE username = 'admin';
   ```

4. **تسجيل دخول:**
   - `https://your-app.netlify.app/admin/login.html`
   - Username: `admin`
   - Password: `your-secure-password-here`

---

## 6️⃣ اختبار شامل

### ✅ قائمة الاختبار:

- [ ] الصفحة الرئيسية تفتح
- [ ] العد التنازلي يعمل
- [ ] تبديل اللغة يعمل
- [ ] روابط السوشال ميديا صحيحة
- [ ] صفحة التسجيل تفتح
- [ ] التسجيل يعمل ويولد كوبون
- [ ] رسالة WhatsApp تفتح تلقائياً
- [ ] صفحة النجاح تعرض الكوبون
- [ ] زر النسخ يعمل
- [ ] صفحة المتجر: استرجاع الكوبون يعمل
- [ ] Admin Login يعمل
- [ ] Dashboard يعرض إحصائيات
- [ ] السحب العشوائي يعمل

---

## 7️⃣ مشاكل شائعة وحلولها

### مشكلة: "Failed to fetch" في Frontend

**السبب:** CORS أو Backend معطل

**الحل:**
```javascript
// في backend/server.js، تأكد من:
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### مشكلة: Render يقول "Build failed"

**السبب:** Dependencies ناقصة

**الحل:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### مشكلة: Database connection timeout

**السبب:** SSL configuration

**الحل:**
```javascript
// في db/connection.js
ssl: { rejectUnauthorized: false }
```

### مشكلة: Render يدخل في Sleep

**السبب:** Free Tier يوقف بعد 15 دقيقة

**الحل:** أول طلب سيأخذ ~30 ثانية (Cold Start). هذا طبيعي.

---

## 8️⃣ متابعة ومراقبة

### Render Logs:
- Dashboard → Your Service → Logs
- راقب الأخطاء في الوقت الفعلي

### Netlify Logs:
- Site → Deploys → Deploy log
- تحقق من نجاح النشر

### Neon Monitoring:
- Project → Monitoring
- راقب استخدام قاعدة البيانات

---

## 9️⃣ النسخ الاحتياطي

### قاعدة البيانات:

```sql
-- تصدير البيانات
COPY registrations TO '/tmp/registrations.csv' DELIMITER ',' CSV HEADER;
COPY orders TO '/tmp/orders.csv' DELIMITER ',' CSV HEADER;
COPY raffle_entries TO '/tmp/raffle_entries.csv' DELIMITER ',' CSV HEADER;
```

### أو استخدم Neon Backup:
- Project Settings → Backups
- يحفظ تلقائياً

---

## 🎉 تم النشر!

الآن لديك نظام كامل جاهز للإنتاج:

- ✅ Frontend: `https://your-app.netlify.app`
- ✅ Backend: `https://chicken-master-api.onrender.com`
- ✅ Database: Neon PostgreSQL
- ✅ Admin: `https://your-app.netlify.app/admin`

**ملاحظة:** شارك رابط التسجيل في إعلاناتك:
```
https://your-app.netlify.app/register.html
```

---

## 📞 دعم

لأي مساعدة، راجع README.md أو تواصل معنا.

حظاً موفقاً في الحملة! 🚀🍗
