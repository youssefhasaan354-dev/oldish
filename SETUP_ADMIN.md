# دليل إعداد وتشغيل لوحة إدارة أولديش (Oldish Admin Setup Guide)

مرحباً بك في نظام إدارة المحتوى المطور لمطعم ومقهى **Oldish Restaurant & Café (أولديش)**.
تم بناء هذا النظام ليعمل بسلاسة فائقة وفق البنية السحابية التالية:
1. **قاعدة البيانات ومصادقة المستخدمين**: **Firebase (Auth + Cloud Firestore)**.
2. **استضافة الصور والوسائط**: **Cloudinary CDN** مع دعم التحويل الآلي والتجاوب السريع (`f_auto,q_auto` و `srcset`).
3. **النشر الفوري لكافة الزوار**: نشر التعديلات في وثيقة مركزية واحدة `published/site` مع كاش محلي فائق السرعة لضمان أداء Lighthouse Mobile يتجاوز 90 نقطة.

---

## 1. البنية السحابية للنظام (Architecture)

1. **الزوار والعموم (Public Visitors)**:
   - يقرأ الزائر تلقائياً الوثيقة المنشورة `published/site` من Cloud Firestore مع التخزين المؤقت في `localStorage`.
   - لا يتم تحميل أي حزم برمجية خاصة بالمصادقة (Firebase Auth) للزائرين لضمان سرعة التحميل الأولى والأداء الاستثنائي.
   - يستطيع الزائر إرسال استفسار أو طلب حجز يُحفظ فوراً في مجموعة `inquiries` مع تحقق صارم من صحة الحقول وحماية Honeypot من السبام.

2. **لوحة الإدارة والمسودات (Admin & Drafts Flow)**:
   - تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور عبر Firebase Auth.
   - التحقق من الصلاحيات عبر مجموعة `admins/{uid}` (`owner`، `editor`، `viewer`).
   - تعديلات الإدارة تُحفظ كمسودة في `drafts/site` ولا تظهر لزوار الموقع حتى يقوم المدير بالنقر على **نشر التعديلات (Publish Site)**.
   - عند النشر: تُكتب لقطة كاملة في `published/site`، وتُسجل نسخة في `versions/{id}` مع حفظ آخر 20 نسخة احتياطية لإمكانية الاسترجاع في أي لحظة.

3. **إدارة الصور والوسائط (Cloudinary Integration)**:
   - يتم رفع الصور مباشرة من متصفح المدير إلى سحابة Cloudinary داخل مجلد `oldish`.
   - توقيع عملية الرفع يتم عبر دالة خادم سحابية (Vercel Serverless Function: `/api/sign-upload`) تتحقق أولاً من هوية المدير وصلاحياته في Firebase قبل منح التوقيع المشفر.
   - المفاتيح السرية (`CLOUDINARY_API_KEY` و `CLOUDINARY_API_SECRET`) محمية بالكامل على الخادم ولا تنكشف للمتصفح.
   - تخدم الصور بأحجام متجاوبة (`640w`، `800w`، `1024w`، `1600w`) بصيغة WebP الحديثة مع خاصية `f_auto,q_auto`.

---

## 2. خطوات تفعيل Firebase Console (قواعد الأمان بدون CLI)

لتفعيل قواعد الحماية في Firebase دون الحاجة لتثبيت أي أدوات برمجية (No CLI required):

### الخطوة 1: فتح وحدة تحكم Firebase (Firebase Console)
1. افتح الرابط: [https://console.firebase.google.com](https://console.firebase.google.com)
2. اختر مشروع أولديش: **`oldish-1`**.

### الخطوة 2: تطبيق قواعد أمان Firestore (Firestore Security Rules)
1. من القائمة الجانبية، اضغط على **Build** ثم اختر **Firestore Database**.
2. من التبويبات العلوية، اضغط على **Rules (القواعد)**.
3. احذف المحتوى الموجود كاملاً، والصق الكود التالي (الموجود في ملف `firestore.rules` بالمشروع):

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getAdminData() {
      return get(/databases/$(database)/documents/admins/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.uid == 'AeJXyph2xyXUZfQOWIs4gwrJrYT2' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }
    
    function isOwner() {
      return isAuthenticated() && (
        request.auth.uid == 'AeJXyph2xyXUZfQOWIs4gwrJrYT2' ||
        (exists(/databases/$(database)/documents/admins/$(request.auth.uid)) && getAdminData().role == 'owner')
      );
    }
    
    function isOwnerOrEditor() {
      return isAuthenticated() && (
        request.auth.uid == 'AeJXyph2xyXUZfQOWIs4gwrJrYT2' ||
        (exists(/databases/$(database)/documents/admins/$(request.auth.uid)) && 
          (getAdminData().role == 'owner' || getAdminData().role == 'editor'))
      );
    }

    // 1. المحتوى المنشور - متاح للقراءة لجميع الزوار، ومحصور في الكتابة للمالك والمحرر فقط
    match /published/{document=**} {
      allow read: if true;
      allow write: if isOwnerOrEditor();
    }

    // 2. المسودات - للمالك والمحرر فقط
    match /drafts/{document=**} {
      allow read, write: if isOwnerOrEditor();
    }

    // 3. سجل النسخ السابقة - للمالك والمحرر فقط
    match /versions/{versionId} {
      allow read, write: if isOwnerOrEditor();
    }

    // 4. حسابات المدراء والصلاحيات - قراءة لأي مدير معتمد، وتعديل للمالك فقط
    match /admins/{adminId} {
      allow read: if isAdmin();
      allow write: if isOwner();
    }

    // 5. استفسارات الزوار وحجوزات الطاولات
    // الكتابة محصورة بالسيرفر فقط عبر Firebase Admin SDK في (/api/submit-inquiry) لحماية Turnstile وتحديد المعدل
    // القراءة والتحديث والأرشفة محصورة بالمدراء المعتمدين فقط
    match /inquiries/{inquiryId} {
      allow create: if false; // Server-side only via Firebase Admin SDK
      allow read, update, delete: if isAdmin();
    }
  }
}
```

4. اضغط على زر **Publish (نشر)** في الزاوية العلوية لحفظ وتفعيل القواعد فوراً.

### الخطوة 3: التحقق من حساب المالك الأول
- المالك الأول مُعرف بالفعل في Firebase Auth بالمعرف UID:
  `AeJXyph2xyXUZfQOWIs4gwrJrYT2`
- في Firestore، داخل مجموعة `admins` توجد الوثيقة:
  `admins/AeJXyph2xyXUZfQOWIs4gwrJrYT2` = `{ role: "owner", email: "..." }`.

---

## 3. متغيرات البيئة على Vercel (Environment Variables)

في لوحة تحكم مشروع Vercel تحت تبويب **Settings -> Environment Variables**، يجب التأكد من ضبط المتغيرات التالية:

| اسم المتغير | نوع المتغير | الوصف |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Client (عام) | مفتاح واجهة برمجة تطبيقات Firebase الخاص بالمشروع |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client (عام) | نطاق المصادقة لمشروع `oldish-1.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Client (عام) | معرف المشروع `oldish-1` |
| `VITE_FIREBASE_APP_ID` | Client (عام) | معرف التطبيق Web App ID في Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Server-only (سري للغاية)** | محتوى مفتاح حساب الخدمة كاملاً بصيغة JSON لتمكين السيرفر من الكتابة الآمنة |
| `UPSTASH_REDIS_REST_URL` | **Server-only (سري)** | عنوان REST Endpoint الخاص بقاعدة Upstash Redis لتحديد المعدل الموزع |
| `UPSTASH_REDIS_REST_TOKEN` | **Server-only (سري)** | التوكن السري الخاص بـ Upstash Redis REST API |
| `VITE_CLOUDINARY_CLOUD_NAME`| Client (عام) | اسم السحابة في Cloudinary |
| `VITE_DEMO_MODE` | Client (عام) | يتم ضبطه على `false` في الإنتاج |
| `VITE_SITE_URL` | Client (عام) | رابط الموقع الرسمي مثل `https://oldish-chi.vercel.app` |
| `CLOUDINARY_API_KEY` | **Server-only (سري)** | مفتاح API الخاص بـ Cloudinary (لا يبدأ بـ VITE_) |
| `CLOUDINARY_API_SECRET` | **Server-only (سري)** | المفتاح السري الخاص بـ Cloudinary (لا يبدأ بـ VITE_) |
| `VITE_TURNSTILE_SITE_KEY` | Client (اختياري) | مفتاح موقع Cloudflare Turnstile لمنع السبام |
| `TURNSTILE_SECRET_KEY` | Server-only (اختياري) | المفتاح السري للتحقق من كابتشا Turnstile خادمياً |
| `TELEGRAM_BOT_TOKEN` | Server-only (اختياري) | توكن بوت تليجرام لإشعار المالك بالحجوزات الجديدة |
| `TELEGRAM_CHAT_ID` | Server-only (اختياري) | معرف محادثة تليجرام للمالك لاستلام الحجوزات فوراً |
| `RESEND_API_KEY` | Server-only (اختياري) | مفتاح خدمة Resend لإرسال إشعارات الحجز بالبريد |
| `OWNER_EMAIL` | Server-only (اختياري) | البريد الإلكتروني للمالك لاستلام الإشعارات |
| `VITE_SENTRY_DSN` | Client (اختياري) | مفتاح تتبع وتسجيل الأخطاء عبر Sentry (تحميل كسول) |
| `VITE_VERCEL_ANALYTICS` | Client (اختياري) | تفعيل تحليلات Vercel Web Analytics |
| `VITE_PLAUSIBLE_DOMAIN` | Client (اختياري) | نطاق تحليلات Plausible الخفيفة الصديقة للخصوصية |
| `VITE_PLAUSIBLE_API_HOST`| Client (اختياري) | عنوان استضافة Plausible مخصص (الافتراضي plausible.io) |

> **تحذير أمني هام**: لا تقم مطلقاً بوضع البادئة `VITE_` أمام مفاتيح `CLOUDINARY_API_KEY` أو `CLOUDINARY_API_SECRET` أو `TURNSTILE_SECRET_KEY` أو `TELEGRAM_BOT_TOKEN` أو `FIREBASE_SERVICE_ACCOUNT_JSON` أو `UPSTASH_REDIS_REST_TOKEN` حتى لا تظهر في حزم المتصفح. دوال الخادم تقرأها بأمان تام. جميع الميزات الاختيارية تتوقف تلقائياً دون أي تأثير في حال عدم إدخال مفاتيحها.

---

## 4. خطوات النشر الآمن بالترتيب الصحيح (Safe Deployment Order)

لضمان عدم انقطاع استقبال حجوزات الزوار وحماية قاعدة البيانات:

1. **الخطوة (أ) - دفع الكود إلى المستودع (Push Code)**:
   - دفع الكود المحدث الخاص بنقطة النهاية `/api/submit-inquiry` وحزمة `firebase-admin`.
2. **الخطوة (ب) - إضافة المتغيرات الجديدة في Vercel وإعادة النشر (Set Env & Redeploy)**:
   - افتح **Vercel -> Settings -> Environment Variables**.
   - أضف `FIREBASE_SERVICE_ACCOUNT_JSON` (محتوى ملف JSON لحساب الخدمة من Firebase Console -> Project Settings -> Service accounts -> Generate new private key).
   - أضف `UPSTASH_REDIS_REST_URL` و `UPSTASH_REDIS_REST_TOKEN` (من Upstash Console لقاعدة Redis REST).
   - قم بإعادة نشر أحدث Deployment (Redeploy) لتطبيق المتغيرات على الدوال السحابية.
3. **الخطوة (ج) - تجربة إرسال حجز اختباري (Test Reservation)**:
   - افتح الموقع وقم بتعبئة نموذج الحجز في قسم الحجوزات وتأكد من نجاح الإرسال وتوليد المعرف وظهوره في لوحة التحكم.
4. **الخطوة (د) - نشر قواعد الحماية الجديدة في Firebase Console (Publish Rules)**:
   - بعد التأكد من عمل السيرفر بنجاح، افتح Firebase Console -> Firestore Database -> Rules.
   - انسخ القواعد المحدثة من `firestore.rules` (التي تحظر إنشاء الاستفسارات من المتصفح `allow create: if false;`) واضغط **Publish**.

---

## 5. دورة العمل: التعديل، الحفظ كمسودة، والنشر الحي

1. ادخل إلى الرابط: `/admin/login` وسجل الدخول بحساب المالك أو المحرر.
2. ستظهر لوحة الإدارة ويعرض المؤشر العلوي شارة:
   - `🟢 Firebase Live` للدلالة على الاتصال بالسحابة.
   - `الموقع منشور ومحدث` في حال عدم وجود تعديلات معلقة.
3. عند إجراء أي تعديل (تغيير نص، استبدال صورة، إضافة صنف في المنيو):
   - تتبدل الشارة تلقائياً إلى: `🟡 تعديلات غير منشورة (مسودة)`.
   - يظهر زران في الشريط العلوي: **إلغاء المسودة (Discard)** و **نشر التعديلات (Publish Site)**.
4. اضغط على **نشر التعديلات**:
   - اكتب ملاحظة الإصدار (مثال: "تحديث صور السلايدر وإضافة مشروبات الصيف").
   - يتم رفع وحفظ اللقطة السحابية فوراً إلى `published/site` وإنشاء نسخة تاريخية.
   - أي زائر في العالم يفتح الموقع سيرى التعديلات والصور الجديدة فوراً دون الحاجة لمسح الذاكرة المؤقتة.

---

## 5. فحص الأداء والتحقق (Performance & Verification)

للتأكد من بناء المشروع والتحقق من التوافق البرمجي محلياً:
```bash
npm run build
npm run lint
```

- تم ضبط تقسيم الحزم (Rollup manualChunks) بحيث تُفصل حزم `vendor-firebase-firestore` و `vendor-firebase-auth` عن الحزم الأساسية، محققة نتائج سرعة واختبارات Lighthouse Mobile تتجاوز 90 نقطة على الصفحة الرئيسية `/` وصفحة المنيو `/menu`.
