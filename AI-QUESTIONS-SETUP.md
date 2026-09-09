# 🤖 نظام توليد الأسئلة بالذكاء الصناعي

## البدء السريع

### 1. تثبيت Ollama (مرة واحدة)

```bash
# حمّل من: https://ollama.ai
# بعد التثبيت، قم بتشغيل:
ollama serve
```

يجب أن تظهر رسالة: `Listening on 127.0.0.1:11434`

### 2. تثبيت Dependencies

```bash
npm install
```

### 3. تشغيل Backend API

```bash
npm run api
```

يجب أن تظهر رسالة:
```
🚀 API Server running on http://localhost:3001
```

### 4. فتح لوحة الإدمن

```
http://localhost:3000/admin.html
```

(أو الرابط على Vercel إذا كنت تختبر على الإنتاج)

---

## الاستخدام

### الخطوة 1: اضغط "توليد أسئلة جديدة" 🤖

ستظهر نافذة بـ:
- **الفئة:** اختر (حضانة، ثاني، ثالث)
- **الموضوع:** اكتب (مثال: "الضرب"، "القسمة")
- **العدد:** (5-20 سؤال)

### الخطوة 2: اضغط "أنشئ الآن"

سيكلم Ollama ويولد الأسئلة. يستغرق حسب عدد الأسئلة:
- 5 أسئلة: ~10 ثواني
- 10 أسئلة: ~20 ثانية
- 20 سؤال: ~40 ثانية

### الخطوة 3: راجع الأسئلة

ستظهر قائمة بالأسئلة المولدة:
- ✅ اختر الأسئلة الجيدة (default: كل الأسئلة مختارة)
- ❌ ألغِ اختيار الأسئلة السيئة
- ✏️ اضغط "عديل مرة أخرى" إذا أردت توليد مجموعة جديدة

### الخطوة 4: اضغط "نشر على GitHub"

ستقوم البرنامج بـ:
1. كتابة الأسئلة في ZIP
2. تحديث manifest.json
3. رفع إلى GitHub (git commit + push)
4. التطبيق سيحمل الأسئلة الجديدة تلقائياً ✅

---

## المتطلبات

✅ **للتطوير:**
- Node.js 14+ (موجود)
- Ollama (حمّل من https://ollama.ai)
- GitHub token (موجود)

❌ **للإنتاج (Vercel):**
- Ollama لا يمكن تشغيله على Vercel
- **الحل المستقبلي:** استخدام Claude API المدفوع ($0.25-1/شهر)

---

## البنية الفنية

```
Frontend (admin.html)
    ↓ POST /api/generate-questions
Backend API (api/generate.js)
    ↓ curl → Ollama (localhost:11434)
Ollama (LLM)
    ↓ Response JSON
Backend
    ↓ Validate + Save to ZIP
    ↓ Update manifest.json
    ↓ git push
GitHub
    ↓ Webhook
Web App
    ↓ Download new ZIP
Quiz loaded ✅
```

---

## الملفات المثبتة

| الملف | الوصف |
|------|-------|
| `api/generate.js` | Backend API الرئيسي |
| `admin.html` | واجهة الإدمن (تحديث) |
| `package.json` | Dependencies (تحديث) |

---

## استكشاف الأخطاء

### ❌ "تعذر الاتصال بالـ Backend"
```
✅ تأكد: npm run api يعمل على port 3001
✅ تحقق: http://localhost:3001/api/health
```

### ❌ "Ollama API error"
```
✅ تأكد: ollama serve يعمل على port 11434
✅ تحقق: curl http://localhost:11434/api/tags
```

### ❌ "Git push failed"
```
✅ تأكد: git config --global user.email "..."
✅ تأكد: GitHub token موجود وصحيح
✅ تحقق: git remote -v
```

### ❌ الأسئلة المولدة سيئة
```
✅ اختر الأسئلة الجيدة فقط (uncheck السيئة)
✅ أو اضغط "عديل مرة أخرى" وغيّر الموضوع
✅ الخوارزمية ستتحسن مع الوقت
```

---

## الخيارات المستقبلية

### 1. استخدام Claude API (أفضل جودة)
```
الميزة: أسئلة أفضل جداً
التكلفة: ~$0.25-1/شهر
الخطوات: 
  1. احصل على مفتاح من https://console.anthropic.com
  2. حدّث api/generate.js لاستخدام Claude API
```

### 2. تخزين مؤقت في Firebase
```
الفائدة: تتبع ما تم توليده
الخطوات:
  1. احفظ الأسئلة في Firebase قبل النشر
  2. اسمح للمستخدمين برؤية السجل
```

### 3. تحسين الأسئلة بـ AI
```
الفكرة: استخدم AI لتقييم الأسئلة ومعالجة الأخطاء تلقائياً
```

---

## الدعم

إذا واجهت مشكلة:
1. اقرأ logs من console.log (Browser DevTools)
2. تحقق من الملف `C:\Users\dell\.claude\plans\jiggly-questing-valiant.md` للتفاصيل الكاملة
3. اتصل بالدعم الفني
