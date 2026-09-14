// api/story.js - Vercel serverless function: يولّد قصة قبل النوم بمفتاح Gemini واحد مركزي
// الواجهة: POST /api/story  { name, gender:'boy'|'girl', age, father, mother, siblings, friend, seed }
// الرد:    { story: {title, emoji, chapters:[{title,text,emoji} x4]}, model }

// المفتاح: متغير البيئة GEMINI_API_KEY على Vercel، أو من Firebase (config/story/geminiKey) الذي يضبطه المدير من لوحة الإدارة
const ENV_KEY = (process.env.GEMINI_API_KEY || '').trim();
const FIREBASE_KEY_URL = 'https://newclinic1-f25d4-default-rtdb.firebaseio.com/config/story/geminiKey.json';
let remoteKey = { value: '', at: 0 };
async function getApiKey() {
  if (ENV_KEY) return ENV_KEY;
  if (Date.now() - remoteKey.at < 5 * 60 * 1000) return remoteKey.value;
  try {
    const r = await fetch(FIREBASE_KEY_URL);
    const v = r.ok ? await r.json() : '';
    remoteKey = { value: typeof v === 'string' ? v.trim() : '', at: Date.now() };
  } catch (e) { console.warn('[story] could not read key from Firebase', e.message); }
  return remoteKey.value;
}

// نماذج مجانية شغالة (سبتمبر 2026). لو واحد رجّع 404/429 نجرّب اللي بعده.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest'];

const THEMES = [
  'مغامرة في الفضاء بين الكواكب', 'رحلة في غابة سحرية', 'البحث عن كنز مخبّي في جزيرة', 'السفر عبر الزمن لزمن الفراعنة',
  'بطل خارق ينقذ المدينة من عاصفة', 'رحلة تحت البحر مع الدلافين', 'اختراع عجيب في ورشة بابا', 'عالم الأحلام السحري',
  'مساعدة قطة ضايعة ترجع لبيتها', 'يوم في مزرعة جدّو', 'مسابقة طيارات ورق في الحديقة', 'مكتبة سرية الكتب فيها بتتكلم',
  'رحلة بالبالون فوق السحاب', 'قلعة الثلج والبطريق الصغير', 'سوق الفواكه المسحور', 'روبوت صغير بيدوّر على صديق',
  'مدرسة السحر اللطيفة', 'زيارة لمصنع الشوكولاتة', 'ليلة في خيمة تحت النجوم مع العيلة', 'إنقاذ فرخ عصفور وقع من العش',
  'رحلة قطار عجيب لمدينة الألوان', 'حديقة الحيوان بالليل', 'كوكب الحلويات', 'الغواصة الصفراء والأخطبوط الطيب',
  'يوم مطر وقوس قزح', 'صديق من الغيوم', 'المتحف اللي تماثيله بتتحرك', 'رحلة على ظهر جمل في الصحراء',
  'مسابقة الطبخ مع ماما', 'الفيل الصغير اللي كان خايف من الميّة', 'بيت الشجرة السري', 'رحلة لأعلى الهرم الأكبر',
  'مدينة الألعاب اللي فتحت بالليل', 'صندوق الرسائل السحري', 'مركب شراعي على النيل', 'حديقة الفراشات الملوّنة'
];
const VALUES = [
  'الشجاعة', 'الصدق', 'مساعدة الآخرين', 'الصبر', 'التعاون مع الأصدقاء', 'بر الوالدين', 'النظافة', 'الرحمة بالحيوان',
  'الاعتذار لما نغلط', 'المشاركة', 'حب التعلم', 'الامتنان والشكر', 'النظام وترتيب الأوضة', 'الأمانة'
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function clean(v, max, def) {
  const s = (v == null ? '' : String(v)).replace(/[<>{}\[\]`]/g, '').trim();
  return s ? s.slice(0, max) : def;
}

function buildPrompt(d, theme, value) {
  const isGirl = d.gender === 'girl';
  return `أنت راوي قصص أطفال مصري بارع ودافئ. اكتب قصة نوم شيقة وممتعة ومفصلة من 4 فصول غنية بالأحداث والتفاصيل اللطيفة المناسبة للأطفال قبل النوم (كل فصل يتكون من 4 إلى 7 جمل مفصلة).
الطفل: "${d.name}"، الجنس: ${isGirl ? 'بنت (أنثى) - يجب استخدام صيغة المؤنث بدقة تامة في كافة الأفعال والصفات والضمائر الموجهة للبطلة أو التي تتحدث عنها' : 'ولد (ذكر) - استخدام صيغة المذكر في الأفعال والصفات والضمائر'}، العمر: ${d.age} سنوات.

الشخصيات:
- ${isGirl ? 'البطلة' : 'البطل'}: ${d.name}
- الأب: ${d.father}
- الأم: ${d.mother}
- الإخوة: ${d.siblings}
- الأصدقاء: ${d.friend}

الموضوع: ${theme}
القيمة التربوية اللي القصة بتعلّمها بهدوء بدون وعظ مباشر: ${value}

القواعد الصارمة:
1. اكتب بالعامية المصرية الراقية والجميلة والمحبوبة للأطفال قبل النوم.
2. اجعل كل فصل غنياً بالتفاصيل والأحداث والتشويق اللطيف والوصف الحسي المريح (4 إلى 7 جمل كاملة لكل فصل).
3. اضبط الأفعال والصفات والضمائر بدقة تامة لتناسب ${isGirl ? 'البنت (مؤنث)' : 'الولد (مذكر)'}.
4. الفصل الثاني ينتهي بعقدة أو لغز يتطلب إجابة سؤال، وفي نهايته اكتب هذا الوسم فقط وبدون مسافات إضافية: [QUESTION_HERE]
5. الفصل الثالث يبدأ بـ "${isGirl ? `بعد ما ${d.name} فكرت بذكاء وشطارة وجاوبت صح...` : `بعد ما ${d.name} فكر بذكاء وشطارة وجاوب صح...`}" ويكمل القصة بنجاح.
6. الفصل الرابع ختام دافئ ومشجع يساعد على النوم الهادئ ويعزز المحبة الأسرية.
7. لا عنف ولا تخويف ولا أي محتوى غير مناسب للأطفال.

أرجع JSON فقط بهذا الشكل وبدون أي كود ماركداون إضافي:
{"title":"عنوان القصة","emoji":"🌟","chapters":[{"title":"عنوان الفصل 1","text":"نص الفصل 1 المفصل...","emoji":"🚀"},{"title":"عنوان الفصل 2","text":"نص الفصل 2 المفصل... [QUESTION_HERE]","emoji":"❓"},{"title":"عنوان الفصل 3","text":"نص الفصل 3 المفصل...","emoji":"✨"},{"title":"عنوان الفصل 4","text":"نص الفصل 4 المفصل...","emoji":"🌙"}]}`;
}

function parseStoryJson(raw) {
  const attempts = [raw, raw.replace(/```json/gi, '').replace(/```/g, '').trim()];
  const s = attempts[1].indexOf('{'), e = attempts[1].lastIndexOf('}');
  if (s !== -1 && e > s) attempts.push(attempts[1].slice(s, e + 1));
  for (const a of attempts) { try { return JSON.parse(a); } catch (_) {} }
  throw new Error('bad-json');
}

function normalizeStory(story) {
  if (!story || !Array.isArray(story.chapters) || story.chapters.length !== 4) throw new Error('bad-shape');
  const chapters = story.chapters.map((c, i) => ({
    title: clean(c.title, 80, `الفصل ${i + 1}`),
    text: String(c.text || '').trim(),
    emoji: String(c.emoji || '✨').slice(0, 8)
  }));
  if (chapters.some(c => c.text.length < 40)) throw new Error('bad-shape');
  // الوسم لازم يكون في الفصل الثاني فقط
  chapters.forEach((c, i) => { if (i !== 1) c.text = c.text.replace(/\[QUESTION_HERE\]/g, '').trim(); });
  if (!chapters[1].text.includes('[QUESTION_HERE]')) chapters[1].text += ' [QUESTION_HERE]';
  return { title: clean(story.title, 90, 'قصة الليلة'), emoji: String(story.emoji || '🌙').slice(0, 8), chapters };
}

async function callGemini(model, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text) throw Object.assign(new Error(data?.promptFeedback?.blockReason ? 'blocked:' + data.promptFeedback.blockReason : 'empty'), { status: 502 });
  return text;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const apiKey = await getApiKey();
  if (!apiKey) return res.status(503).json({ error: 'no-api-key: أضف مفتاح Gemini من لوحة الإدارة أو GEMINI_API_KEY' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const isGirl = body.gender === 'girl';
  const d = {
    name: clean(body.name, 40, isGirl ? 'بطلة المستقبل' : 'بطل المستقبل'),
    gender: isGirl ? 'girl' : 'boy',
    age: String(parseInt(body.age, 10) || 8).slice(0, 2),
    father: clean(body.father, 40, 'بابا'),
    mother: clean(body.mother, 40, 'ماما'),
    siblings: clean(body.siblings, 80, 'إخواتي'),
    friend: clean(body.friend, 40, isGirl ? 'صاحبتي' : 'صاحبي')
  };
  // seed = تاريخ اليوم + الطفل: نفس اليوم = نفس الموضوع، يوم جديد = موضوع جديد
  const seed = clean(body.seed, 80, new Date().toISOString().slice(0, 10) + '|' + d.name);
  const h = hashStr(seed);
  const theme = THEMES[h % THEMES.length];
  const value = VALUES[(h >>> 8) % VALUES.length];
  const prompt = buildPrompt(d, theme, value);

  let lastErr = null;
  for (const model of MODELS) {
    try {
      const text = await callGemini(model, prompt, apiKey);
      const story = normalizeStory(parseStoryJson(text));
      return res.status(200).json({ story, model, theme });
    } catch (err) {
      lastErr = err;
      console.warn(`[story] ${model} failed:`, err.status || '', err.message);
      // أخطاء الشكل: نعيد المحاولة بنفس النموذج مرة واحدة ثم ننتقل
      if (!err.status) {
        try {
          const story = normalizeStory(parseStoryJson(await callGemini(model, prompt, apiKey)));
          return res.status(200).json({ story, model, theme });
        } catch (e2) { lastErr = e2; }
      }
    }
  }
  const status = lastErr && lastErr.status === 429 ? 429 : 502;
  return res.status(status).json({ error: (lastErr && lastErr.message) || 'generation-failed' });
};
