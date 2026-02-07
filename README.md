# مشروع حملة السحب - Mister Chicken Raffle

## نظرة عامة
نظام متكامل لحملة سحب 100 شيكل مع نظام كوبونات خصم 10% ومتجر بسيط لطلب الوجبات.

---

## 📁 هيكل المشروع

```
raffle/
├── backend/
│   ├── server.js                 # نقطة دخول السيرفر
│   ├── package.json              # Dependencies
│   ├── .env.example              # مثال للمتغيرات البيئية
│   ├── db/
│   │   ├── schema.sql            # هيكل قاعدة البيانات
│   │   └── connection.js         # اتصال PostgreSQL
│   ├── routes/
│   │   ├── registrations.js      # تسجيل المستخدمين
│   │   ├── orders.js             # الطلبات
│   │   └── admin.js              # لوحة الإدارة
│   ├── middleware/
│   │   └── security.js           # فحص IP وDevice Fingerprint
│   └── utils/
│       └── couponGenerator.js    # توليد الكوبونات
│
└── frontend/
    ├── index.html                # الصفحة الرئيسية
    ├── register.html             # التسجيل
    ├── success.html              # نجاح التسجيل
    ├── store.html                # المتجر (قريباً)
    ├── admin/
    │   ├── login.html            # تسجيل دخول الإدارة (قريباً)
    │   └── dashboard.html        # لوحة التحكم (قريباً)
    ├── styles/
    │   ├── main.css              # CSS عام
    │   ├── landing.css           # صفحة الهبوط
    │   ├── register.css          # صفحة التسجيل
    │   └── success.css           # صفحة النجاح
    └── js/
        ├── app.js                # وظائف عامة + ترجمة
        ├── landing.js            # صفحة الهبوط
        ├── register.js           # صفحة التسجيل
        └── success.js            # صفحة النجاح
```

---

## 🚀 خطوات التشغيل المحلي

### Backend

1. **تثبيت Dependencies:**
```bash
cd raffle/backend
npm install
```

2. **إعداد قاعدة البيانات:**
   - أنشئ قاعدة بيانات PostgreSQL على Neon
   - نفذ ملف `db/schema.sql`
   - انسخ `.env.example` إلى `.env` وعدّل القيم

3. **تشغيل السيرفر:**
```bash
npm run dev
```

السيرفر سيعمل على: `http://localhost:3000`

### Frontend

1. افتح ببساطة `index.html` في المتصفح
2. أو استخدم Live Server في VS Code

---

## 🌐 النشر على الإنترنت

### 1. قاعدة البيانات (Neon PostgreSQL)

1. اذهب إلى [neon.tech](https://neon.tech)
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد
4. نفذ ملف `backend/db/schema.sql`
5. احفظ Connection String

### 2. Backend (Render)

1. اذهب إلى [render.com](https://render.com)
2. أنشئ Web Service جديد
3. اربطه بمستودع Git أو ارفع الملفات
4. إعدادات:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     DATABASE_URL=<نون_connection_string>
     JWT_SECRET=<سر_عشوائي_قوي>
     FRONTEND_URL=<رابط_netlify>
     ```
5. انشر!

### 3. Frontend (Netlify)

1. اذهب إلى [netlify.com](https://netlify.com)
2. اسحب مجلد `frontend` إلى Netlify Drop
3. بعد النشر، عدّل `frontend/js/app.js`:
   - غير `API_BASE_URL` إلى رابط Render الخاص بك
4. أعد النشر

---

## ⚙️ الإعدادات المطلوبة

### متغيرات البيئة (Backend)

```env
DATABASE_URL=postgresql://...         # من Neon
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key            # أنشئ سر قوي
FRONTEND_URL=https://your-app.netlify.app
WHATSAPP_NUMBER=+970567811812
INSTAGRAM_URL=https://www.instagram.com/chicken_master26/
FACEBOOK_URL=https://www.facebook.com/profile.php?id=61587454410215
```

### إعداد Admin (أول مرة)

كلمة المرور الافتراضية في schema.sql مشفرة لـ `admin123`.

لتغييرها:
```javascript
const bcrypt = require('bcrypt');
const newPassword = 'your-secure-password';
const hash = await bcrypt.hash(newPassword, 10);
console.log(hash); // استخدم هذا في SQL
```

---

## 📖 استخدام الـ API

### تسجيل مستخدم جديد
```http
POST /api/registrations
Content-Type: application/json

{
  "name": "محمد أحمد",
  "phone": "0599123456",
  "deviceFingerprint": "base64_string"
}
```

### الحصول على كوبون برقم الجوال
```http
GET /api/registrations/phone/+970599123456
```

### إنشاء طلب
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "محمد",
  "customerPhone": "+970599123456",
  "items": [...],
  "couponCode": "CHICK-ABC123",
  "totalBeforeDiscount": 100,
  "deliveryType": "delivery",
  "customerLocation": "رام الله..."
}
```

---

## 🔒 الأمان

- ✅ فحص IP Address
- ✅ Device Fingerprinting
- ✅ Rate Limiting
- ✅ Helmet.js للأمان
- ✅ JWT للإدارة
- ✅ bcrypt لتشفير كلمات المرور

---

## 🌍 اللغات المدعومة

- العربية (افتراضي)
- الإنجليزية

التبديل تلقائي عبر الأزرار في أعلى الصفحة.

---

## 📱 المميزات

- ✅ تسجيل مع كوبونات فريدة
- ✅ تكامل WhatsApp تلقائي
- ✅ نظام حماية من التكرار
- ✅ تصميم responsive
- ✅ دعم RTL/LTR
- ✅ متجر بسيط (قريباً)
- ✅ لوحة إدارة (قريباً)
- ✅ سحب عشوائي

---

## 🆘 المشاكل الشائعة

**المشكلة**: "Cannot connect to database"
**الحل**: تأكد من `DATABASE_URL` صحيح و SSL enabled

**المشكلة**: "CORS error"
**الحل**: تأكد من `FRONTEND_URL` في `.env` يطابق رابط Netlify

**المشكلة**: "Render server sleeps"
**الحل**: هذا طبيعي في Free Tier. أول طلب بعد خمول يأخذ ~30 ثانية

---

## 📞 الدعم

للأسئلة أو المساعدة، تواصل عبر WhatsApp: +970567811812
