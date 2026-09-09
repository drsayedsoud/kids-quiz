// Generates 100 "complete the pattern" questions: 50 with shapes for kindergarten (kids_1) and 50 with numbers for
// grade 3 (kids_3). Shapes are emoji tokens shown as the question picture; numbers are plain digits.
// Usage: node scripts/add-pattern-questions.js   (idempotent: previously generated pattern questions are replaced
// in every class bank, so moving a set between classes is just a change of TARGETS)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const BANKS = ['kids_1', 'kids_2', 'kids_3'];
const TAG = 'أنماط - أشكال وأرقام'; // q.type of generated questions (lets a re-run replace the old set)

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

// deterministic pseudo-random so the bank does not change on every run
let seed = 20260909;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- shapes ----------
const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🔺', '⭐', '🟥', '🟦', '🟩', '🟨', '🔶', '🔷', '⬛', '⬜'];
const UNITS = ['AB', 'AB', 'AAB', 'ABB', 'ABC', 'AABB', 'ABAC'];
function shapeQuestions(n) {
    const out = [], seen = new Set();
    while (out.length < n) {
        const unit = pick(UNITS);
        const letters = [...new Set(unit)];
        const map = {}; shuffle(SHAPES.slice()).slice(0, letters.length).forEach((s, i) => { map[letters[i]] = s; });
        const unitShapes = [...unit].map(l => map[l]);
        const len = unit.length * 2 + Math.floor(rnd() * 3);              // two full repeats plus 0-2 extra
        const seq = Array.from({ length: len + 1 }, (_, i) => unitShapes[i % unitShapes.length]);
        const missingMiddle = out.length >= n * 0.8;                       // the last fifth hides a middle item
        const idx = missingMiddle ? 1 + Math.floor(rnd() * (len - 1)) : len;
        const answer = seq[idx];
        const shown = seq.slice(0, len + 1).map((s, i) => i === idx ? '❓' : s);
        if (!missingMiddle) shown.length = len + 1;
        const image = shown.join(' ');
        if (seen.has(image)) continue; seen.add(image);
        const used = [...new Set(unitShapes)].filter(s => s !== answer);
        const others = shuffle(SHAPES.filter(s => !unitShapes.includes(s))).slice(0, 3 - used.length);
        const choices = shuffle([answer, ...used, ...others].slice(0, 4));
        out.push({
            question: missingMiddle ? 'أكمل النمط: ما الشكل الناقص مكان ❓؟' : 'أكمل النمط: ما الشكل التالي؟',
            image,
            choice1: choices[0], choice2: choices[1], choice3: choices[2], choice4: choices[3],
            correct_answer: answer,
            explanation: 'النمط يتكرر هكذا: ' + unitShapes.join(' ') + '، ' + (missingMiddle ? 'فالشكل الناقص هو ' : 'فالشكل التالي هو ') + answer,
            type: TAG, stage: 'أشكال'
        });
    }
    return out;
}

// ---------- numbers ----------
const RULES = [
    { step: 1, count: 8, max: 40, name: 'يزيد بواحد' },
    { step: 2, count: 9, max: 60, name: 'يزيد باثنين' },
    { step: 3, count: 6, max: 60, name: 'يزيد بثلاثة' },
    { step: 5, count: 8, max: 80, name: 'يزيد بخمسة' },
    { step: 10, count: 7, max: 100, name: 'يزيد بعشرة' },
    { step: -1, count: 5, max: 40, name: 'ينقص بواحد' },
    { step: -2, count: 4, max: 40, name: 'ينقص باثنين' },
    { step: -5, count: 3, max: 60, name: 'ينقص بخمسة' }
];
function numberQuestions() {
    const out = [], seen = new Set();
    RULES.forEach(r => {
        let made = 0, guard = 0;
        while (made < r.count && guard++ < 500) {
            const terms = 4 + Math.floor(rnd() * 2);                        // 4 or 5 shown terms
            const span = Math.abs(r.step) * terms;
            const start = r.step > 0 ? Math.floor(rnd() * (r.max - span)) : span + Math.floor(rnd() * (r.max - span));
            const seq = Array.from({ length: terms + 1 }, (_, i) => start + i * r.step);
            if (seq.some(v => v < 0)) continue;
            const key = seq.join(',');
            if (seen.has(key)) continue; seen.add(key);
            const answer = seq[terms];
            const wrong = new Set([answer + 1, answer - 1, answer + r.step, answer - r.step, answer + 2 * r.step, answer + (r.step > 0 ? 10 : -10)].filter(v => v >= 0 && v !== answer));
            const distractors = shuffle([...wrong]).slice(0, 3);
            const choices = shuffle([answer, ...distractors]).map(String);
            out.push({
                question: 'أكمل النمط: ' + seq.slice(0, terms).join('، ') + '، ...؟',
                image: '🔢',
                choice1: choices[0], choice2: choices[1], choice3: choices[2], choice4: choices[3],
                correct_answer: String(answer),
                explanation: 'كل عدد ' + r.name + ' عن الذي قبله (' + seq[terms - 1] + (r.step > 0 ? ' + ' + r.step : ' − ' + (-r.step)) + ' = ' + answer + ')',
                type: TAG, stage: 'أرقام'
            });
            made++;
        }
    });
    return out;
}

// ---------- write: shapes -> kindergarten, numbers -> grade 3; the old set is removed from every bank ----------
const TARGETS = { kids_1: shapeQuestions(50), kids_3: numberQuestions() };
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
BANKS.forEach(cat => {
    const zipPath = path.join(dataDir, cat + '.zip');
    const bank = JSON.parse(readFirstEntry(fs.readFileSync(zipPath)).toString('utf8'));
    const kept = bank.filter(q => q.type !== TAG);
    const generated = TARGETS[cat] || [];
    const maxOrder = kept.reduce((a, q) => Math.max(a, parseFloat(q.order) || 0), 0);
    generated.forEach((q, i) => { q.order = maxOrder + i + 1; });
    const out = kept.concat(generated);
    fs.writeFileSync(zipPath, writeZip(cat + '.json', Buffer.from(JSON.stringify(out))));
    manifest.categories[cat] = { count: out.length, bytes: fs.statSync(zipPath).size };
    console.log(`${cat}: ${kept.length} kept (${bank.length - kept.length} old pattern questions removed) + ${generated.length} pattern questions -> ${out.length}`);
});

const hash = crypto.createHash('sha1');
Object.keys(manifest.categories).sort().forEach(cat => { const p = path.join(dataDir, cat + '.zip'); if (fs.existsSync(p)) hash.update(fs.readFileSync(p)); });
manifest.version = hash.digest('hex').slice(0, 10);
manifest.builtAt = new Date().toISOString();
fs.writeFileSync(path.join(dataDir, 'manifest.json'), JSON.stringify(manifest));
console.log('manifest ' + manifest.version);
