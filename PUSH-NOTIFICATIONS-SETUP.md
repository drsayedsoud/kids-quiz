# 📲 Web Push Notifications - دليل الإعداد الكامل

## 🎯 ما تم إضافته:

### ✅ الملفات الجديدة:
1. **service-worker.js** - خدمة تعمل في الخلفية لاستقبال الإشعارات
2. **push-notifications.js** - وحدة إرسال الإشعارات
3. **firebase-init.js** (محدّث) - تسجيل Service Worker

### ✅ الملفات المحدّثة:
1. **awards-calc.js** - إرسال إشعارات عند فوز اللاعب
2. **service-worker.js** - استقبال الإشعارات وعرضها

---

## 🔧 إعدادات Firebase المطلوبة:

### 1️⃣ تفعيل Cloud Messaging:
```
Firebase Console → Your Project → Cloud Messaging
```

**الخطوات:**
- اذهب إلى https://console.firebase.google.com
- اختر مشروعك (newclinic1-f25d4)
- الانتقل إلى: **Cloud Messaging** (في القائمة الجانبية)
- انسخ: **Server Key** (مثلاً: AAAAB1234567...)

### 2️⃣ حفظ المفاتيح في متغيرات البيئة:

```bash
# في server/config.js أو .env
FIREBASE_SERVER_KEY=AAAAB1234567...
FIREBASE_SENDER_ID=399508085232
```

### 3️⃣ نموذج بيانات Firebase:

#### الهيكل الحالي (موجود):
```
players/{userId}/
  ├── name
  ├── photo
  ├── points
  └── medals/{date}/
      ├── medal: "🏆"
      ├── label: "الأعلى نقاطاً"
      ├── type: "daily_award"
      └── at: timestamp

notifications/{userId}/{timestamp}/
  ├── type: "daily_award" | "weekly_award"
  ├── medal: "🏆"
  ├── label: "الأعلى نقاطاً"
  ├── message: "🎉 أنت الأعلى نقاطاً! 250 نقطة"
  ├── read: false
  ├── important: false
  └── at: timestamp
```

#### جديد - subscriptions (للتخزين):
```
players/{userId}/pushSubscription/
  ├── endpoint: "https://..."
  └── at: timestamp
```

---

## 🚀 خطوات التطبيق:

### المرحلة 1: الواجهة الأمامية (✅ مكتمل):

✅ Service Worker مسجّل تلقائياً  
✅ طلب التصريح متاح عند الحاجة  
✅ استقبال الإشعارات والضغط عليها  

### المرحلة 2: الخادم (📝 مطلوب):

يحتاج إلى Cloud Function للإرسال الفعلي:

```javascript
// functions/sendNotification.js

const admin = require('firebase-admin');

exports.sendNotification = functions.database
  .ref('notifications/{userId}/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const notification = snapshot.val();
    
    // جلب subscription من Firebase
    const userDoc = await admin.database()
      .ref(`players/${userId}/pushSubscription`)
      .once('value');
    
    if (!userDoc.val()) return;
    
    const subscription = userDoc.val();
    
    // إرسال Push
    const payload = {
      notification: {
        title: notification.medal + ' ' + notification.label,
        body: notification.message,
        icon: 'assets/icon-192.png',
        badge: 'assets/badge-72.png'
      },
      data: {
        type: notification.type,
        url: '/profile.html?tab=medals'
      }
    };
    
    try {
      await admin.messaging().send({
        webpush: payload,
        token: subscription.token
      });
    } catch (error) {
      console.error('خطأ في الإرسال:', error);
    }
  });
```

### المرحلة 3: قواعد Firebase (📝 مطلوب تحديث):

```json
{
  "players": {
    "$uid": {
      "pushSubscription": {
        ".write": "auth != null && $uid === auth.uid",
        "endpoint": { ".validate": "newData.isString()" },
        "at": { ".validate": "newData.isNumber()" }
      }
    }
  }
}
```

---

## 📱 كيفية الاستخدام:

### 1. طلب تصريح الإشعارات من اللاعب:

```javascript
// في profile.html أو أي صفحة
import { subscribeToPushNotifications } from './firebase-init.js';

// عند الضغط على زر "تفعيل الإشعارات"
await subscribeToPushNotifications();
```

### 2. الاشتراك التلقائي (اختياري):

```javascript
// في app.js
window.addEventListener('load', async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await subscribeToPushNotifications();
  }
});
```

### 3. إرسال إشعار يدوي:

```javascript
// من admin.html
import { sendGeneralNotification } from './push-notifications.js';

await sendGeneralNotification(playerId, 
  '🎉 عرض خاص!',
  'ارجع للعبة الآن وحصل على 50 نقطة إضافية'
);
```

---

## 🔐 معايير الأمان:

### ✅ البيانات المرسلة:
- 📍 **endpoint** - رابط الإشعار الفريد لكل جهاز
- ⏰ **timestamp** - وقت الاشتراك
- 🆔 **userId** - معرف اللاعب

### ✅ القواعد:
- كل لاعب يكتب subscriptionه فقط
- الخادم يقرأ ويرسل الإشعارات
- لا توجد بيانات شخصية حساسة

---

## 🧪 الاختبار:

### 1. اختبار Service Worker:
```javascript
// في browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### 2. اختبار التصريح:
```javascript
console.log(Notification.permission); // 'granted' | 'denied' | 'default'
```

### 3. إرسال اختبار يدوي:
```javascript
self.registration.showNotification('🥇 اختبار', {
  body: 'هذا اختبار',
  icon: '/assets/icon-192.png'
});
```

---

## 📊 الجدول الزمني:

| المرحلة | الحالة | المهمة |
|--------|-------|-------|
| 1 - الواجهة | ✅ مكتمل | استقبال الإشعارات |
| 2 - الخادم | 📝 مطلوب | Cloud Function للإرسال |
| 3 - القواعد | 📝 مطلوب | تحديث database.rules.json |
| 4 - الاختبار | 📝 مطلوب | اختبار شامل |

---

## ⚠️ الأخطاء الشائعة:

❌ **Error: "server key" غير موجود**
→ تأكد من تفعيل Cloud Messaging في Firebase

❌ **الإشعارات لا تظهر**
→ تحقق من تصريح المتصفح: Settings → Notifications

❌ **"Service Worker failed to load"**
→ تأكد من أن service-worker.js في المجلد الجذر

---

## 🎯 الخطوة التالية:

1. فعّل Cloud Messaging في Firebase Console
2. أنشئ Cloud Function لإرسال الإشعارات
3. حدّث database.rules.json
4. اختبر مع لاعب حقيقي

**أي أسئلة؟** اسأل! 💬
