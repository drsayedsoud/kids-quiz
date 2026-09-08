// Grade 2 (kids_2): the science bank ("علوم - ثاني ابتدائي (الترم الأول)") was built from the textbook stories
// ("نور", her family, the engineer Nate Calvin, the book's tables and activities). A child from another class,
// or one who has not reached that lesson, cannot answer "كم عمر نور؟". This script removes every such
// lesson-bound question and puts, in the SAME curriculum slot (same "order"), a nature-vocabulary question:
// the plural of a word, the singular of a word, or its opposite. General science facts (bird body parts,
// life cycles, food groups...) stay. Leftover nature words go to the random pool (no order).
// Usage: node scripts/swap-nature-words.js   (idempotent: a re-run replaces the previously generated set)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const CAT = 'kids_2';
const SCI = 'علوم - ثاني ابتدائي (الترم الأول)';
const TAG = 'كلمات من الطبيعة - ثاني ابتدائي'; // q.type of generated questions

// ---------- minimal zip reader/writer (same format split-bank.js produces) ----------
function readFirstEntry(buf) {
    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocd < 0) throw new Error('not a zip file');
    const cdOffset = buf.readUInt32LE(eocd + 16);
    const method = buf.readUInt16LE(cdOffset + 10);
    const compSize = buf.readUInt32LE(cdOffset + 20);
    const localOffset = buf.readUInt32LE(cdOffset + 42);
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    return method === 8 ? zlib.inflateRawSync(data) : data;
}
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function writeZip(entryName, content) {
    const nameBuf = Buffer.from(entryName);
    const deflated = zlib.deflateRawSync(content, { level: 9 });
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(content.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(deflated.length, 20); central.writeUInt32LE(content.length, 24); central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38); central.writeUInt32LE(0, 42);
    const cdOffset = local.length + nameBuf.length + deflated.length;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(central.length + nameBuf.length, 12); eocd.writeUInt32LE(cdOffset, 16); eocd.writeUInt16LE(0, 20);
    return Buffer.concat([local, nameBuf, deflated, central, nameBuf, eocd]);
}

// ---------- which science questions are lesson-bound ----------
// Anything naming the story characters, the book, its tables/pictures/activities, the advertising and
// engineering-design lessons, or the family's meals and routine.
const LESSON_BOUND = /نور|سارة|سمير|نيت كالفين|جدت|الجدة|الكتاب|الجدول|الصورة|نشاط|القصة|حسب|هذا الدرس|قطعة القراءة|الدائرة|إعلان|الإعلان|التصميم الهندسي|المهندس|المنقار الجديد|صُنع المنقار|تركيب المنقار|منتج|العمة|الطفلة|أي حرف نكتبه|الرمز|أداة تنظيف|درجة تعني|المجموعة (الحمراء|الصفراء|البنية)|لون مجموعة|أبناء العم|العشاء|الإفطار|السلسلة الورقية|المسرحية|تعليقات الزملاء|مقادير|وقت فراغ|صديق تناول|المنبه|الأم |الأب |أساليب تحقيق السلام|خطوة|مأخوذ|كم عدد المجموعات|بمن يمكن|ما الذي يمكن الاستعانة|أي سؤال يتعلق|أول سؤال|الشيء الذي يمكن تقديمه|يساعد الناس على الوصول|صغار الطيور|في العش|جدول تسجيل|الانسحاب|نسمي ذلك|التوافق في حل|الانتقال إلى نشاط|مخطط|\(الحمراء\)|\(الصفراء\)|الأسرة بعد|الوجبات التي تعدها|إنفاق الأموال|قطع الباذنجان|تنظيف الخضراوات صعبًا/;
const isLessonBound = q => q.type === SCI && LESSON_BOUND.test(q.question + ' | ' + q.correct_answer);

// ---------- nature words ----------
// [singular, plural]
const PAIRS = [
    ['شجرة', 'أشجار'], ['زهرة', 'زهور'], ['وردة', 'ورود'], ['نهر', 'أنهار'], ['بحر', 'بحار'], ['جبل', 'جبال'],
    ['غيمة', 'غيوم'], ['سحابة', 'سحب'], ['ريح', 'رياح'], ['عصفور', 'عصافير'], ['طائر', 'طيور'], ['فراشة', 'فراشات'],
    ['سمكة', 'أسماك'], ['ورقة', 'أوراق'], ['غصن', 'أغصان'], ['جذر', 'جذور'], ['ثمرة', 'ثمار'], ['بذرة', 'بذور'],
    ['حقل', 'حقول'], ['غابة', 'غابات'], ['صحراء', 'صحارى'], ['واحة', 'واحات'], ['نخلة', 'نخيل'], ['بحيرة', 'بحيرات'],
    ['جزيرة', 'جزر'], ['شاطئ', 'شواطئ'], ['موجة', 'أمواج'], ['صخرة', 'صخور'], ['حجر', 'أحجار'], ['رمل', 'رمال'],
    ['تل', 'تلال'], ['وادي', 'أودية'], ['كهف', 'كهوف'], ['عش', 'أعشاش'], ['حيوان', 'حيوانات'], ['أسد', 'أسود'],
    ['فيل', 'فيلة'], ['حصان', 'خيول'], ['جمل', 'جمال'], ['غزال', 'غزلان'], ['ذئب', 'ذئاب'], ['ثعلب', 'ثعالب'],
    ['أرنب', 'أرانب'], ['قط', 'قطط'], ['كلب', 'كلاب'], ['خروف', 'خراف'], ['حمامة', 'حمائم'], ['ضفدع', 'ضفادع'],
    ['سلحفاة', 'سلاحف'], ['ثعبان', 'ثعابين'], ['تمساح', 'تماسيح'], ['حوت', 'حيتان'], ['قرد', 'قرود'], ['دب', 'دببة'],
    ['نمر', 'نمور'], ['زرافة', 'زرافات'], ['نسر', 'نسور'], ['صقر', 'صقور'], ['غراب', 'غربان'], ['ديك', 'ديوك'],
    ['دودة', 'ديدان'], ['حشرة', 'حشرات'], ['نبات', 'نباتات'], ['عشب', 'أعشاب'], ['برعم', 'براعم'], ['حديقة', 'حدائق'],
    ['بستان', 'بساتين'], ['مزرعة', 'مزارع'], ['فاكهة', 'فواكه'], ['ينبوع', 'ينابيع'], ['جدول', 'جداول'], ['شلال', 'شلالات'],
    ['بركة', 'برك'], ['مطر', 'أمطار'], ['ثلج', 'ثلوج'], ['برق', 'بروق'], ['رعد', 'رعود'], ['عاصفة', 'عواصف'],
    ['فصل', 'فصول'], ['ليلة', 'ليالٍ'], ['نجم', 'نجوم'], ['كوكب', 'كواكب'], ['قمر', 'أقمار'], ['شمس', 'شموس'],
    ['أرض', 'أراضٍ'], ['سماء', 'سماوات'], ['لون', 'ألوان'], ['ظل', 'ظلال'], ['جناح', 'أجنحة'], ['منقار', 'مناقير'],
    ['مخلب', 'مخالب'], ['قرن', 'قرون'], ['ذيل', 'ذيول'], ['حافر', 'حوافر'], ['فرخ', 'أفراخ'], ['بئر', 'آبار'],
    ['جذع', 'جذوع'], ['ساق', 'سيقان'], ['حبة', 'حبوب'], ['سنبلة', 'سنابل'], ['قطرة', 'قطرات'], ['بركان', 'براكين'],
    ['زلزال', 'زلازل'], ['مرج', 'مروج'], ['حمار', 'حمير'], ['فأر', 'فئران'], ['فرس', 'أفراس'], ['بغل', 'بغال'],
    ['عنكبوت', 'عناكب'], ['خنفساء', 'خنافس'], ['طاووس', 'طواويس'], ['ببغاء', 'ببغاوات'], ['سنجاب', 'سناجب'], ['دلفين', 'دلافين'],
    ['حلزون', 'حلازين'], ['بومة', 'بومات'], ['نحلة', 'نحلات'], ['نملة', 'نملات'], ['بطة', 'بطات'], ['دجاجة', 'دجاجات'],
    ['بقرة', 'بقرات'], ['عنزة', 'عنزات'], ['قنفذ', 'قنافذ'], ['وعل', 'وعول'], ['يمامة', 'يمامات'],
    ['بلبل', 'بلابل'], ['هدهد', 'هداهد'], ['جرادة', 'جرادات'], ['قوقعة', 'قواقع'], ['صدفة', 'أصداف'], ['لؤلؤة', 'لآلئ'],
    ['نسيم', 'نسائم'], ['سهل', 'سهول'],
    ['قناة', 'قنوات'], ['ترعة', 'ترع'], ['خليج', 'خلجان'], ['محيط', 'محيطات'], ['قارة', 'قارات'], ['هضبة', 'هضاب'],
    ['قمة', 'قمم'], ['منحدر', 'منحدرات'], ['طريق', 'طرق'], ['كرمة', 'كروم'], ['زيتونة', 'زيتونات'], ['تفاحة', 'تفاحات'],
    ['برتقالة', 'برتقالات'], ['موزة', 'موزات'], ['عنقود', 'عناقيد'], ['بصلة', 'بصلات'], ['جزرة', 'جزرات'], ['بطيخة', 'بطيخات'],
];
// [word, opposite, family]  – family groups synonyms so a distractor is never a second correct answer
const OPPOSITES = [
    ['ليل', 'نهار', 'day'], ['نهار', 'ليل', 'night'], ['صباح', 'مساء', 'evening'], ['مساء', 'صباح', 'morning'],
    ['شروق', 'غروب', 'sunset'], ['غروب', 'شروق', 'sunrise'], ['حار', 'بارد', 'cold'], ['بارد', 'حار', 'hot'],
    ['جاف', 'رطب', 'wet'], ['رطب', 'جاف', 'dry'], ['صيف', 'شتاء', 'winter'], ['شتاء', 'صيف', 'summer'],
    ['مرتفع', 'منخفض', 'low'], ['منخفض', 'مرتفع', 'high'], ['قريب', 'بعيد', 'far'], ['بعيد', 'قريب', 'near'],
    ['كبير', 'صغير', 'small'], ['صغير', 'كبير', 'big'], ['طويل', 'قصير', 'short'], ['قصير', 'طويل', 'long'],
    ['واسع', 'ضيق', 'narrow'], ['ضيق', 'واسع', 'wide'], ['سريع', 'بطيء', 'slow'], ['بطيء', 'سريع', 'fast'],
    ['قوي', 'ضعيف', 'weak'], ['ضعيف', 'قوي', 'strong'], ['ثقيل', 'خفيف', 'light'], ['خفيف', 'ثقيل', 'heavy'],
    ['ناعم', 'خشن', 'rough'], ['خشن', 'ناعم', 'soft'], ['مضيء', 'مظلم', 'dark'], ['مظلم', 'مضيء', 'bright'],
    ['نور', 'ظلام', 'dark'], ['ظلام', 'نور', 'bright'], ['هادئ', 'صاخب', 'noisy'], ['صاخب', 'هادئ', 'quiet'],
    ['صافية', 'غائمة', 'cloudy'], ['غائمة', 'صافية', 'clear'], ['جميل', 'قبيح', 'ugly'], ['قبيح', 'جميل', 'pretty'],
    ['نظيف', 'ملوث', 'dirty'], ['ملوث', 'نظيف', 'clean'], ['فوق', 'تحت', 'low'], ['تحت', 'فوق', 'high'],
    ['شرق', 'غرب', 'west'], ['غرب', 'شرق', 'east'], ['شمال', 'جنوب', 'south'], ['جنوب', 'شمال', 'north'],
    ['حلو', 'مر', 'bitter'], ['مر', 'حلو', 'sweet'], ['ينمو', 'يذبل', 'wither'], ['يذبل', 'ينمو', 'grow'],
    ['يشرق', 'يغرب', 'set'], ['يغرب', 'يشرق', 'rise'], ['يرتفع', 'ينخفض', 'fall'], ['ينخفض', 'يرتفع', 'climb'],
    ['ممتلئ', 'فارغ', 'empty'], ['فارغ', 'ممتلئ', 'full'], ['غزير', 'قليل', 'few'], ['قليل', 'غزير', 'many'],
    ['عميق', 'ضحل', 'shallow'], ['ضحل', 'عميق', 'deep'], ['حي', 'ميت', 'dead'], ['ميت', 'حي', 'alive'],
    ['بري', 'أليف', 'tame'], ['أليف', 'بري', 'wild'], ['ذكر', 'أنثى', 'female'], ['أنثى', 'ذكر', 'male'],
    ['أمام', 'خلف', 'behind'], ['خلف', 'أمام', 'front'], ['داخل', 'خارج', 'out'], ['خارج', 'داخل', 'in'],
    ['يمين', 'يسار', 'left'], ['يسار', 'يمين', 'right'], ['بداية', 'نهاية', 'end'], ['نهاية', 'بداية', 'start'],
    ['قمة', 'سفح', 'foot'], ['سفح', 'قمة', 'top'], ['يستيقظ', 'ينام', 'sleep'], ['ينام', 'يستيقظ', 'wake'],
    ['يزرع', 'يحصد', 'harvest'], ['يحصد', 'يزرع', 'plant'], ['حرارة', 'برودة', 'cold'], ['برودة', 'حرارة', 'hot'],
    ['يطير', 'يهبط', 'land'], ['يهبط', 'يطير', 'fly'], ['أخضر', 'يابس', 'dry'], ['يابس', 'أخضر', 'green'],
    ['مبتل', 'جاف', 'dry'], ['ساخن', 'بارد', 'cold'], ['دافئ', 'بارد', 'cold'], ['مشمس', 'ممطر', 'rainy'], ['ممطر', 'مشمس', 'sunny'],
    ['يفتح', 'يغلق', 'close'], ['يغلق', 'يفتح', 'open'], ['يصعد', 'ينزل', 'down'], ['ينزل', 'يصعد', 'up'],
    ['أعلى', 'أسفل', 'low'], ['أسفل', 'أعلى', 'high'], ['يظهر', 'يختفي', 'hide'], ['يختفي', 'يظهر', 'show'],
];

// ---------- deterministic shuffle (same bank on every run) ----------
let seed = 20260908;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function pick(pool, n, bad) {
    const out = [];
    const cand = shuffle(pool.filter(x => !bad(x)));
    for (const c of cand) { if (out.length >= n) break; if (!out.includes(c)) out.push(c); }
    if (out.length < n) throw new Error('not enough distractors');
    return out;
}
function mk(question, correct, distractors, kind) {
    const choices = shuffle([correct].concat(distractors));
    return {
        question, choice1: choices[0], choice2: choices[1], choice3: choices[2], choice4: choices[3],
        correct_answer: correct, explanation: 'كلمات من الطبيعة: ' + kind,
        type: TAG, lesson: 'كلمات من الطبيعة', subject: 'arabic', term: 1
    };
}
function build() {
    const pairs = PAIRS.filter(p => Array.isArray(p) && p.length === 2);
    const plurals = pairs.map(p => p[1]);
    const singulars = pairs.map(p => p[0]);
    const out = [];
    pairs.forEach(([s, p]) => out.push(mk(`ما جمع كلمة «${s}»؟`, p, pick(plurals, 3, x => x === p), 'الجمع')));
    // singular questions for the words whose singular is unambiguous
    pairs.filter(([s]) => !/^(نجم|ليلة)$/.test(s)).forEach(([s, p]) => out.push(mk(`ما مفرد كلمة «${p}»؟`, s, pick(singulars, 3, x => x === s), 'المفرد')));
    const oppAnswers = OPPOSITES.map(o => o[1]);
    const famOf = a => OPPOSITES.filter(o => o[1] === a).map(o => o[2]);
    // distractors keep the part of speech of the answer (a verb gets verbs, an adjective gets adjectives)
    const isVerb = s => /^ي/.test(s) && !/^(يمين|يسار|يابس)$/.test(s);
    // never a synonym of the answer, and never a synonym of the asked word itself
    const same = (x, fams) => famOf(x).some(f => fams.includes(f));
    OPPOSITES.forEach(([w, o, fam]) => out.push(mk(`ما عكس كلمة «${w}»؟`, o, pick(oppAnswers, 3, x => x === o || x === w || isVerb(x) !== isVerb(o) || same(x, [fam]) || same(x, famOf(w))), 'العكس')));
    // dedupe by question text
    const seen = new Set();
    return out.filter(q => { if (seen.has(q.question)) return false; seen.add(q.question); return true; });
}

// ---------- write ----------
const zipPath = path.join(dataDir, CAT + '.zip');
const bank = JSON.parse(readFirstEntry(fs.readFileSync(zipPath)).toString('utf8'));
const withoutOld = bank.filter(q => q.type !== TAG);
const removed = withoutOld.filter(isLessonBound);
const kept = withoutOld.filter(q => !isLessonBound(q));
const slots = removed.map(q => parseFloat(q.order)).filter(n => !isNaN(n)).sort((a, b) => a - b);
const generated = shuffle(build());
generated.forEach((q, i) => { if (i < slots.length) q.order = slots[i]; });
const out = kept.concat(generated);
fs.writeFileSync(zipPath, writeZip(CAT + '.json', Buffer.from(JSON.stringify(out))));

// manifest: new version so every device re-downloads the changed bank
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
const hash = crypto.createHash('sha1');
Object.keys(manifest.categories).sort().forEach(cat => { const p = path.join(dataDir, cat + '.zip'); if (fs.existsSync(p)) hash.update(fs.readFileSync(p)); });
manifest.version = hash.digest('hex').slice(0, 10);
manifest.builtAt = new Date().toISOString();
manifest.categories[CAT] = { count: out.length, bytes: fs.statSync(zipPath).size };
fs.writeFileSync(path.join(dataDir, 'manifest.json'), JSON.stringify(manifest));
console.log(`${CAT}: removed ${removed.length} lesson-bound science questions (${slots.length} curriculum slots refilled), ${kept.filter(q => q.type === SCI).length} general science kept, +${generated.length} nature-word questions (${generated.length - slots.length} in the random pool) -> ${out.length}; manifest ${manifest.version}`);
if (process.argv.includes('--list')) { removed.forEach(q => console.log('  - ' + q.question)); }
