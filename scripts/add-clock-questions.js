// Generates the "reading the analog clock" curriculum for grade 2 (kids_2) and appends it to data/kids_2.zip.
// The clock itself is drawn by the app from the token "clock:h:mm" (see KidsTheme.clockSvg), so no image files.
// Stages, in "order": on the hour -> half past -> quarter past/to -> five-minute steps -> "which clock shows...".
// Usage: node scripts/add-clock-questions.js   (idempotent: previously generated clock questions are replaced)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const CAT = 'kids_2';
const TAG = 'clock'; // q.type of generated questions (lets a re-run replace the old set)

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

// ---------- Arabic time words (mirrors KidsTheme.clockWords in kids-theme.js) ----------
const AR = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const HOURS = ['الثانية عشرة', 'الواحدة', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة'];
const PAST = { 0: 'تماماً', 5: 'وخمس دقائق', 10: 'وعشر دقائق', 15: 'والربع', 20: 'وثلث', 25: 'وخمس وعشرون دقيقة', 30: 'والنصف', 35: 'وخمس وثلاثون دقيقة' };
const TO = { 40: 'إلا ثلث', 45: 'إلا ربع', 50: 'إلا عشر دقائق', 55: 'إلا خمس دقائق' };
function words(h, m) {
    h = h % 12; const digital = AR((h || 12) + ':' + String(m).padStart(2, '0'));
    const w = PAST[m] !== undefined ? HOURS[h] + ' ' + PAST[m] : TO[m] !== undefined ? HOURS[(h + 1) % 12] + ' ' + TO[m] : HOURS[h] + ' و' + AR(m) + ' دقيقة';
    return w + ' (' + digital + ')';
}
const token = (h, m) => 'clock:' + ((h % 12) || 12) + ':' + String(m).padStart(2, '0');
const hourDisplay = h => AR((h % 12) || 12);
const minuteHandPos = m => AR(m === 0 ? 12 : m / 5);
function explain(h, m) {
    const short = 'العقرب القصير (الساعات) ' + (m === 0 ? 'يشير إلى ' + hourDisplay(h) : 'بين ' + hourDisplay(h) + ' و' + hourDisplay(h + 1));
    const long = 'والعقرب الطويل (الدقائق) على ' + minuteHandPos(m) + (m === 0 ? ' أي تماماً' : ' أي ' + AR(m) + ' دقيقة');
    return short + '، ' + long + '، فالساعة ' + words(h, m) + '.';
}

// deterministic pseudo-random so the bank does not change on every run
let seed = 20260904;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = (h, m) => ((h % 12) || 12) + ':' + m;

// wrong answers that look plausible: swapped hands, the neighbouring hour, the mirrored minute
function distractors(h, m, pool) {
    const out = new Set();
    const add = (hh, mm) => { hh = ((hh % 12) + 12) % 12 || 12; mm = ((mm % 60) + 60) % 60; if (mm % 5 === 0 && key(hh, mm) !== key(h, m)) out.add(key(hh, mm)); };
    if (m % 5 === 0 && m !== 0) add(m / 5, ((h % 12) || 12) * 5 % 60); // hands swapped
    add(h + 1, m); add(h - 1, m); add(h, 60 - m); add(h, m + 30); add(h, m + 15); add(h, m - 15); add(h + 6, m);
    const list = shuffle([...out].filter(k => pool.has(k)));
    return list.slice(0, 3).map(k => k.split(':').map(Number));
}

function build() {
    const qs = [];
    const stage = (title, times, poolMinutes, reverse) => {
        const pool = new Set(); for (let hh = 1; hh <= 12; hh++) poolMinutes.forEach(mm => pool.add(key(hh, mm)));
        times.forEach(([h, m]) => {
            const ds = distractors(h, m, pool);
            while (ds.length < 3) { const hh = 1 + Math.floor(rnd() * 12), mm = pick(poolMinutes); if (key(hh, mm) !== key(h, m) && !ds.some(d => key(d[0], d[1]) === key(hh, mm))) ds.push([hh, mm]); }
            const choices = shuffle([[h, m], ...ds]);
            if (reverse) {
                qs.push({ question: 'أي ساعة تُظهر ' + words(h, m) + '؟', image: '⏰', choice1: token(...choices[0]), choice2: token(...choices[1]), choice3: token(...choices[2]), choice4: token(...choices[3]), correct_answer: token(h, m), explanation: explain(h, m), type: TAG, stage: title });
            } else {
                qs.push({ question: 'كم الساعة الآن؟', image: token(h, m), choice1: words(...choices[0]), choice2: words(...choices[1]), choice3: words(...choices[2]), choice4: words(...choices[3]), correct_answer: words(h, m), explanation: explain(h, m), type: TAG, stage: title });
            }
        });
    };

    // أسئلة تحويل الوقت (جديدة)
    const conversionStage = () => {
        const conversions = [
            { q: 'نص ساعة كم دقيقة؟', a: '30', exp: 'نص ساعة = 30 دقيقة' },
            { q: 'ربع ساعة كم دقيقة؟', a: '15', exp: 'ربع ساعة = 15 دقيقة' },
            { q: 'ثلث ساعة كم دقيقة؟', a: '20', exp: 'ثلث ساعة = 20 دقيقة' },
            { q: 'ساعة كاملة كم دقيقة؟', a: '60', exp: 'الساعة الكاملة = 60 دقيقة' },
            { q: '60 دقيقة كم ساعة؟', a: 'ساعة واحدة', exp: '60 دقيقة = ساعة واحدة' },
            { q: '30 دقيقة كم تساوي من الساعة؟', a: 'نص ساعة', exp: '30 دقيقة = نص ساعة' },
            { q: '15 دقيقة كم تساوي من الساعة؟', a: 'ربع ساعة', exp: '15 دقيقة = ربع ساعة' },
            { q: 'ربع ساعة وربع ساعة كم يساوي؟', a: 'نص ساعة', exp: 'ربع + ربع = نص ساعة (15 + 15 = 30)' },
            { q: 'دقيقتان × 30 كم دقيقة؟', a: '60', exp: '2 × 30 = 60 دقيقة = ساعة' },
            { q: '5 دقائق × 12 كم دقيقة؟', a: '60', exp: '5 × 12 = 60 دقيقة = ساعة' },
            { q: 'ثلث الساعة كم دقيقة؟', a: '20', exp: 'ثلث الساعة = 60 ÷ 3 = 20 دقيقة' },
            { q: 'ربع الساعة زائد ربع الساعة كم دقيقة؟', a: '30', exp: 'ربع + ربع = 15 + 15 = 30 دقيقة' }
        ];
        conversions.forEach(c => {
            const distractors = [];
            if (c.a === '30') distractors.push('15', '20', '45');
            else if (c.a === '15') distractors.push('20', '30', '10');
            else if (c.a === '20') distractors.push('15', '25', '30');
            else if (c.a === '60') distractors.push('30', '45', '120');
            else if (c.a === 'ساعة واحدة') distractors.push('نص ساعة', 'ربع ساعة', 'ثلث ساعة');
            else if (c.a === 'نص ساعة') distractors.push('ربع ساعة', 'ثلث ساعة', 'ساعة كاملة');
            else if (c.a === 'ربع ساعة') distractors.push('نص ساعة', 'ثلث ساعة', '20 دقيقة');
            else distractors.push('20', '25', '30', '45');

            const choices = shuffle([c.a, ...distractors.slice(0, 3)]);
            qs.push({
                question: c.q,
                image: '⏰',
                choice1: choices[0], choice2: choices[1], choice3: choices[2], choice4: choices[3],
                correct_answer: c.a,
                explanation: c.exp,
                type: TAG,
                stage: 'تحويل الوقت'
            });
        });
    };

    const hours = shuffle(Array.from({ length: 12 }, (_, i) => i + 1));
    // 1) on the hour (18)   2) half past (18)   3) quarter past / quarter to (36)
    stage('الساعة الكاملة', hours.concat(hours.slice(0, 6)).map(h => [h, 0]), [0]);
    stage('والنصف', shuffle(hours.slice()).concat(shuffle(hours.slice(0, 6))).map(h => [h, 30]), [0, 30]);
    stage('الربع', shuffle(hours.flatMap(h => [[h, 15], [h, 45]])), [0, 15, 30, 45]);
    // 4) five-minute steps (48 mixed)
    const fives = [5, 10, 20, 25, 35, 40, 50, 55];
    const fiveTimes = shuffle(hours.flatMap(h => shuffle(fives.slice()).slice(0, 4).map(m => [h, m])));
    stage('كل خمس دقائق', fiveTimes, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    // 5) reverse: choose the clock face (36 mixed times)
    const revTimes = shuffle(hours.flatMap(h => [[h, pick([0, 30])], [h, pick([15, 45, 5, 10, 20, 25, 35, 40, 50, 55])], [h, pick([5, 10, 20, 25, 35, 40, 50, 55])]]));
    stage('اختر الساعة', revTimes, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], true);
    // 6) time conversion questions
    conversionStage();
    return qs;
}

// ---------- write ----------
const zipPath = path.join(dataDir, CAT + '.zip');
const bank = JSON.parse(readFirstEntry(fs.readFileSync(zipPath)).toString('utf8'));
const kept = bank.filter(q => q.type !== TAG);
const generated = build();
// order: after the highest existing curriculum order, so hand-written term questions stay first
const maxOrder = kept.reduce((a, q) => Math.max(a, parseFloat(q.order) || 0), 0);
generated.forEach((q, i) => { q.order = maxOrder + i + 1; });
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
console.log(`${CAT}: ${kept.length} kept + ${generated.length} clock questions (order ${maxOrder + 1}..${maxOrder + generated.length}) -> ${out.length}; manifest ${manifest.version}`);
