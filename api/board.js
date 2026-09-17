// api/board.js - Vercel serverless function: يقرأ خط يد الطفل على السبورة الذكية بـ Gemini (الطبقة المجانية)
// الواجهة: POST /api/board  { image: 'data:image/jpeg;base64,...', expected: '47' | 'قمر', mode: 'number'|'word' }
// الرد:    { read, correct, partial, tip, model }
//   read    = ما قرأه النموذج فعلاً      correct = هل يطابق المطلوب
//   partial = الطفل لم يكمل الكتابة بعد   tip     = نصيحة قصيرة للطفل عند الخطأ

// نفس مفتاح قصص قبل النوم: متغير البيئة GEMINI_API_KEY أو Firebase config/story/geminiKey
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
  } catch (e) { console.warn('[board] could not read key from Firebase', e.message); }
  return remoteKey.value;
}

const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-flash-latest'];
const MAX_IMAGE_CHARS = 400000; // ~300KB صورة

// توحيد الكتابة قبل المقارنة: أرقام هندية/غربية، همزات، تاء مربوطة، تشكيل، مسافات
function normalize(s) {
  return String(s == null ? '' : s)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[ً-ْـ\s]/g, '')
    .replace(/[أإآٱء]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
}

function buildPrompt(expected, mode) {
  const what = mode === 'number'
    ? `عدداً من ${expected.length} خانة. الطفل مصري ويكتب بالأرقام الهندية (٠١٢٣٤٥٦٧٨٩) لا الغربية، فاقرأ الأشكال على هذا الأساس:
٠ = نقطة صغيرة، ١ = خط رأسي، ٢ = خط رأسي أعلاه انحناءة لليمين، ٣ = مثل ٢ بسنّتين، ٤ = يشبه ε أو 3 معكوسة، ٥ = دائرة أو شكل قلب (تشبه 0 الغربي)، ٦ = يشبه 7 الغربية، ٧ = شكل V، ٨ = شكل Λ (V مقلوبة)، ٩ = يشبه 9.
إذن شكل V يعني 7 وليس 4، والدائرة تعني 5 وليس 0، والنقطة تعني 0.`
    : `كلمة عربية بخط اليد (حروف متصلة).`;
  return `الصورة كتابة يد طفل صغير على سبورة. المفروض أنه كتب ${what}
المطلوب منه كان: «${expected}».

1) اقرأ أولاً ما هو مكتوب فعلاً في الصورة بأمانة، حتى لو اختلف عن المطلوب. لا تفترض أنه كتب المطلوب.
2) كن متسامحاً مع رداءة الخط والميل وحجم الحروف، لكن صارماً في أي الحروف/الأرقام كُتبت وترتيبها وعددها ونقاطها.
3) لو الكتابة خربشة لا تُقرأ اجعل read فارغاً.
4) tip: جملة واحدة قصيرة جداً بالعربية المبسطة تشجّع الطفل وتدلّه على الخطأ تحديداً (مثلاً أي خانة أو حرف). فارغة لو الإجابة صحيحة.

أرجع JSON فقط: {"read":"ما قرأته","match":true|false,"tip":"..."}
اكتب الأرقام في read بأرقام غربية 0-9.`;
}

async function callGemini(model, prompt, mime, data, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data } }, { text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 200 }
    })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.error?.message || `HTTP ${res.status}`), { status: res.status });
  const text = body?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s === -1 || e <= s) throw new Error('bad-json');
  return JSON.parse(text.slice(s, e + 1));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const mode = body.mode === 'word' ? 'word' : 'number';
  const expected = String(body.expected || '').replace(/[<>{}\[\]`"«»]/g, '').trim().slice(0, 12);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
  if (!expected || !m) return res.status(400).json({ error: 'expected + image required' });
  if (m[2].length > MAX_IMAGE_CHARS) return res.status(413).json({ error: 'image too large' });

  const apiKey = await getApiKey();
  if (!apiKey) return res.status(503).json({ error: 'no-api-key' });

  const prompt = buildPrompt(expected, mode);
  let lastErr = null;
  for (const model of MODELS) {
    try {
      const out = await callGemini(model, prompt, m[1], m[2], apiKey);
      const read = String(out.read || '').trim().slice(0, 20);
      const want = normalize(expected), got = normalize(read);
      // الحكم لنا لا للنموذج: القراءة الحرفية يجب أن تطابق (match وحدها لا تكفي، فالنموذج قد يجامل)
      const correct = !!got && got === want;
      const partial = !correct && !!got && got.length < want.length && want.startsWith(got);
      return res.status(200).json({ read, correct, partial, tip: correct ? '' : String(out.tip || '').trim().slice(0, 120), model });
    } catch (err) {
      lastErr = err;
      console.warn(`[board] ${model} failed:`, err.status || '', err.message);
    }
  }
  return res.status(lastErr && lastErr.status === 429 ? 429 : 502).json({ error: (lastErr && lastErr.message) || 'read-failed' });
};
