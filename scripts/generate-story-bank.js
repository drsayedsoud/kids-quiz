// scripts/generate-story-bank.js
// يولّد مكتبة قصص قبل النوم مرة واحدة بـ Gemini ويحفظها في stories-bank.json (بجذر المشروع).
// كل قصة فيها نسختين (ولد/بنت) بنفس الحبكة، والأسماء متغيرات: {name} {father} {mother} {siblings} {friend}
// التشغيل:  node scripts/generate-story-bank.js            (يستخدم GEMINI_API_KEY من البيئة أو --key=...)
//           node scripts/generate-story-bank.js --count=60 --concurrency=2
// السكربت يكمّل على الملف الموجود: القصص اللي اتولّدت قبل كده مش بتتعاد.

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true]; }));
const API_KEY = (args.key || process.env.GEMINI_API_KEY || '').trim();
if (!API_KEY) { console.error('حدد المفتاح: --key=... أو GEMINI_API_KEY'); process.exit(1); }
const COUNT = parseInt(args.count, 10) || 60;
const CONCURRENCY = parseInt(args.concurrency, 10) || 2;
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
const OUT = path.join(__dirname, '..', 'stories-bank.json');

// 60 موضوع × قيمة تربوية: كل قصة ليها هوية ثابتة (id) عشان التوليد يتكمّل بأمان
const PLOTS = [
  ['space-planets', 'مغامرة في الفضاء بين الكواكب', 'الشجاعة'],
  ['magic-forest', 'رحلة في غابة سحرية فيها حيوانات بتتكلم', 'الرحمة بالحيوان'],
  ['island-treasure', 'البحث عن كنز مخبّي في جزيرة', 'التعاون مع الأصدقاء'],
  ['pharaoh-time', 'السفر عبر الزمن لزمن الفراعنة', 'حب التعلم'],
  ['storm-hero', 'بطل خارق ينقذ المدينة من عاصفة', 'مساعدة الآخرين'],
  ['dolphins', 'رحلة تحت البحر مع الدلافين', 'الصداقة'],
  ['dad-workshop', 'اختراع عجيب في ورشة بابا', 'الصبر'],
  ['dream-world', 'عالم الأحلام السحري', 'الهدوء قبل النوم'],
  ['lost-cat', 'مساعدة قطة ضايعة ترجع لبيتها', 'الرحمة بالحيوان'],
  ['grandpa-farm', 'يوم في مزرعة جدّو', 'الاجتهاد'],
  ['kites', 'مسابقة طيارات ورق في الحديقة', 'الروح الرياضية'],
  ['talking-books', 'مكتبة سرية الكتب فيها بتتكلم', 'حب القراءة'],
  ['balloon', 'رحلة بالبالون فوق السحاب', 'الشجاعة'],
  ['ice-castle', 'قلعة الثلج والبطريق الصغير', 'المشاركة'],
  ['fruit-market', 'سوق الفواكه المسحور', 'الأكل الصحي'],
  ['robot-friend', 'روبوت صغير بيدوّر على صديق', 'الصداقة'],
  ['kind-magic-school', 'مدرسة السحر اللطيفة', 'الصدق'],
  ['chocolate-factory', 'زيارة لمصنع الشوكولاتة', 'عدم الطمع'],
  ['camping-stars', 'ليلة في خيمة تحت النجوم مع العيلة', 'المحبة الأسرية'],
  ['baby-bird', 'إنقاذ فرخ عصفور وقع من العش', 'الرحمة بالحيوان'],
  ['color-train', 'رحلة قطار عجيب لمدينة الألوان', 'التفاؤل'],
  ['zoo-night', 'حديقة الحيوان بالليل', 'الفضول الجميل'],
  ['candy-planet', 'كوكب الحلويات', 'غسيل الأسنان'],
  ['yellow-submarine', 'الغواصة الصفراء والأخطبوط الطيب', 'قبول المختلف'],
  ['rainbow-day', 'يوم مطر وقوس قزح', 'الصبر'],
  ['cloud-friend', 'صديق من الغيوم', 'الوفاء'],
  ['living-museum', 'المتحف اللي تماثيله بتتحرك', 'حب التعلم'],
  ['desert-camel', 'رحلة على ظهر جمل في الصحراء', 'الصبر'],
  ['cooking-mom', 'مسابقة الطبخ مع ماما', 'بر الوالدين'],
  ['elephant-water', 'الفيل الصغير اللي كان خايف من الميّة', 'التغلب على الخوف'],
  ['treehouse', 'بيت الشجرة السري', 'المشاركة'],
  ['pyramid-top', 'رحلة لأعلى الهرم الأكبر', 'الإصرار'],
  ['toy-city', 'مدينة الألعاب اللي فتحت بالليل', 'ترتيب الأوضة'],
  ['magic-mailbox', 'صندوق الرسائل السحري', 'الامتنان والشكر'],
  ['nile-boat', 'مركب شراعي على النيل', 'حب مصر'],
  ['butterfly-garden', 'حديقة الفراشات الملوّنة', 'الرفق بالمخلوقات'],
  ['moon-rabbit', 'أرنب القمر اللي فقد جزرته', 'الأمانة'],
  ['lighthouse', 'الفنار اللي نوره طفى', 'المسؤولية'],
  ['snow-globe', 'كرة الثلج اللي فيها مدينة صغيرة', 'اللطف'],
  ['paper-boat', 'مركب ورق في بركة الحديقة', 'الخيال'],
  ['flying-carpet', 'السجادة الطايرة ورحلة فوق القاهرة', 'حب الوطن'],
  ['honey-bees', 'خلية النحل والعسل الذهبي', 'العمل الجماعي'],
  ['lost-kite-cloud', 'الطيارة الورق اللي علّقت في سحابة', 'الصبر'],
  ['whale-song', 'الحوت اللي نسي أغنيته', 'مساعدة الآخرين'],
  ['clock-tower', 'برج الساعة اللي وقف عن الدقّ', 'احترام الوقت'],
  ['garden-seeds', 'بذرة صغيرة بقت شجرة كبيرة', 'الصبر والرعاية'],
  ['puppet-theater', 'مسرح العرايس اللي بيتكلم', 'الصدق'],
  ['owl-teacher', 'البومة الحكيمة ودرس الليل', 'حب التعلم'],
  ['rain-umbrella', 'الشمسية السحرية في يوم شتا', 'المشاركة'],
  ['sand-castle', 'قصر الرمل على شط إسكندرية', 'الإبداع'],
  ['ant-hill', 'مملكة النمل الصغيرة', 'الاجتهاد'],
  ['star-fallen', 'النجمة اللي وقعت في الجنينة', 'الوفاء بالوعد'],
  ['grandma-tales', 'حكايات تيتة والصندوق القديم', 'احترام الكبار'],
  ['bicycle-race', 'سباق العجل في الشارع', 'الروح الرياضية'],
  ['lantern-ramadan', 'الفانوس اللي بينوّر لوحده', 'الكرم'],
  ['kitten-vet', 'زيارة القطة الصغيرة للدكتور البيطري', 'الشجاعة'],
  ['lost-glasses', 'نضارة جدّو الضايعة', 'مساعدة الكبار'],
  ['music-box', 'صندوق الموسيقى المسحور', 'الهدوء'],
  ['friendly-dragon', 'التنين الصغير اللي بيخاف من النار', 'قبول الذات'],
  ['mirror-lake', 'بحيرة المراية والسمكة الذهبية', 'الأمانة'],
];

function buildPrompt(theme, value) {
  return `أنت راوي قصص أطفال مصري بارع ودافئ. اكتب قصة نوم من 4 فصول (كل فصل 4 إلى 7 جمل) بالعامية المصرية الراقية، مناسبة لطفل عمره 6 إلى 9 سنوات.

الموضوع: ${theme}
القيمة التربوية (بهدوء وبدون وعظ مباشر): ${value}

المتغيرات الإلزامية (اكتبها حرفياً كما هي ولا تستبدلها بأسماء): {name} اسم الطفل، {father} الأب، {mother} الأم، {siblings} الإخوة، {friend} الصديق.
- استخدم {name} كثيراً (على الأقل مرتين في كل فصل).
- استخدم {father} أو {mother} أو {siblings} أو {friend} في القصة بشكل طبيعي.

اكتب القصة بنسختين بنفس الحبكة والعناوين تماماً:
- "boy": البطل ولد، كل الأفعال والصفات والضمائر مذكّرة.
- "girl": البطلة بنت، كل الأفعال والصفات والضمائر مؤنّثة بدقة تامة.

القواعد الصارمة:
1. الفصل الثاني ينتهي بلغز أو عقدة يحتاج حلها إجابة سؤال، وفي آخره اكتب الوسم حرفياً: [QUESTION_HERE]
2. الفصل الثالث يبدأ بـ "بعد ما {name} فكر بذكاء وشطارة وجاوب صح..." (وفي نسخة البنت: "بعد ما {name} فكرت بذكاء وشطارة وجاوبت صح...").
3. الفصل الرابع ختام دافئ يساعد على النوم الهادئ: الطفل يرجع البيت، يغسل أسنانه، وينام مطمئناً.
4. لا عنف ولا تخويف. اجعل الوصف حسياً ومريحاً.

أرجع JSON فقط بهذا الشكل بدون ماركداون:
{"emoji":"🌟","boy":{"title":"...","chapters":[{"title":"...","text":"...","emoji":"🚀"},{"title":"...","text":"... [QUESTION_HERE]","emoji":"❓"},{"title":"...","text":"...","emoji":"✨"},{"title":"...","text":"...","emoji":"🌙"}]},"girl":{"title":"...","chapters":[{"title":"...","text":"...","emoji":"🚀"},{"title":"...","text":"... [QUESTION_HERE]","emoji":"❓"},{"title":"...","text":"...","emoji":"✨"},{"title":"...","text":"...","emoji":"🌙"}]}}`;
}

function parseJson(raw) {
  const c = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const s = c.indexOf('{'), e = c.lastIndexOf('}');
  for (const a of [raw, c, s !== -1 && e > s ? c.slice(s, e + 1) : '']) { if (!a) continue; try { return JSON.parse(a); } catch (_) {} }
  throw new Error('bad-json');
}

function checkVersion(v) {
  if (!v || !Array.isArray(v.chapters) || v.chapters.length !== 4) throw new Error('chapters!=4');
  const chapters = v.chapters.map((c, i) => ({ title: String(c.title || `الفصل ${i + 1}`).trim(), text: String(c.text || '').trim(), emoji: String(c.emoji || '✨').slice(0, 8) }));
  chapters.forEach((c, i) => { if (i !== 1) c.text = c.text.replace(/\[QUESTION_HERE\]/g, '').trim(); });
  if (!chapters[1].text.includes('[QUESTION_HERE]')) chapters[1].text += ' [QUESTION_HERE]';
  if (chapters.some(c => c.text.length < 60)) throw new Error('chapter too short');
  const all = chapters.map(c => c.text).join(' ');
  if ((all.match(/\{name\}/g) || []).length < 4) throw new Error('{name} placeholder missing');
  if (/\{(?!name\}|father\}|mother\}|siblings\}|friend\})/.test(all)) throw new Error('unknown placeholder');
  return { title: String(v.title || '').trim() || 'قصة الليلة', chapters };
}

async function callGemini(model, prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, responseMimeType: 'application/json' } })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || `HTTP ${res.status}`), { status: res.status });
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateOne(plot) {
  const [id, theme, value] = plot;
  const prompt = buildPrompt(theme, value);
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    const model = MODELS[Math.min(attempt >> 1, MODELS.length - 1)];
    try {
      const raw = await callGemini(model, prompt);
      const j = parseJson(raw);
      return { id, theme, value, emoji: String(j.emoji || '🌙').slice(0, 8), boy: checkVersion(j.boy), girl: checkVersion(j.girl), model };
    } catch (err) {
      lastErr = err;
      const wait = err.status === 429 ? 20000 * (attempt + 1) : 2000;
      console.warn(`  ↻ ${id} (${model}) فشل: ${err.message} — إعادة بعد ${wait / 1000}ث`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

(async () => {
  let bank = { version: 1, generated: new Date().toISOString(), stories: [] };
  if (fs.existsSync(OUT)) { try { bank = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (_) {} }
  const have = new Set(bank.stories.map(s => s.id));
  const todo = PLOTS.slice(0, COUNT).filter(p => !have.has(p[0]));
  console.log(`موجود: ${have.size} قصة — مطلوب توليد: ${todo.length}`);

  let i = 0, ok = 0, fail = 0;
  const save = () => { bank.generated = new Date().toISOString(); fs.writeFileSync(OUT, JSON.stringify(bank, null, 0), 'utf8'); };
  const worker = async () => {
    while (i < todo.length) {
      const plot = todo[i++];
      try {
        const s = await generateOne(plot);
        bank.stories.push(s); ok++; save();
        console.log(`✔ ${ok + fail}/${todo.length} ${plot[0]} — ${s.boy.title} (${s.model})`);
      } catch (err) { fail++; console.error(`✖ ${plot[0]}: ${err.message}`); }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  // ترتيب ثابت حسب PLOTS
  const order = new Map(PLOTS.map((p, idx) => [p[0], idx]));
  bank.stories.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  save();
  console.log(`\nتم: ${ok} نجحت، ${fail} فشلت — الإجمالي في الملف: ${bank.stories.length} — ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
})();
