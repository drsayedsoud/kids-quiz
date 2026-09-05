// Appends (or updates) questions in one category bank without touching anything else there.
// Usage: node scripts/append-questions.js <category> <questions.json>
//   <questions.json> is an array of {question, choice1..choice4, correct_answer, explanation?, image?, order?, type?, ...}
// Rules:
//   - a question whose text already exists in the bank is UPDATED in place (order/image/explanation/choices refreshed),
//     never duplicated; everything else in the bank stays exactly as it was
//   - data/manifest.json gets a new version so every device downloads the changed bank
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const [cat, jsonPath] = process.argv.slice(2);
if (!cat || !jsonPath) { console.error('usage: node scripts/append-questions.js <category> <questions.json>'); process.exit(1); }
const dataDir = path.join(__dirname, '..', 'data');
const zipPath = path.join(dataDir, cat + '.zip');

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

const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const valid = q => q && norm(q.question) && [q.choice1, q.choice2, q.choice3, q.choice4].every(c => norm(c)) &&
    new Set([q.choice1, q.choice2, q.choice3, q.choice4].map(norm)).size === 4 &&
    [q.choice1, q.choice2, q.choice3, q.choice4].map(norm).includes(norm(q.correct_answer));

const bank = fs.existsSync(zipPath) ? JSON.parse(readFirstEntry(fs.readFileSync(zipPath)).toString('utf8')) : [];
const incoming = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
// identity of a question = its text + its picture (many clock questions share the text "كم الساعة الآن؟" and differ by the clock)
const keyOf = q => norm(q.question) + '|' + norm(q.image);
const byText = new Map(bank.map((q, i) => [keyOf(q), i]));
let added = 0, updated = 0, skipped = 0;
incoming.forEach(q => {
    if (!valid(q)) { skipped++; return; }
    const clean = {};
    Object.keys(q).forEach(k => { const v = q[k]; if (v !== undefined && v !== null && norm(v) !== '') clean[k] = typeof v === 'string' ? norm(v) : v; });
    const i = byText.get(keyOf(q));
    if (i !== undefined) { bank[i] = Object.assign({}, bank[i], clean); updated++; }
    else { bank.push(clean); byText.set(keyOf(q), bank.length - 1); added++; }
});
fs.writeFileSync(zipPath, writeZip(cat + '.json', Buffer.from(JSON.stringify(bank))));

const manifestPath = path.join(dataDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { categories: {} };
const hash = crypto.createHash('sha1');
Object.keys(manifest.categories).concat(cat).filter((c, i, a) => a.indexOf(c) === i).sort().forEach(c => { const p = path.join(dataDir, c + '.zip'); if (fs.existsSync(p)) hash.update(fs.readFileSync(p)); });
manifest.version = hash.digest('hex').slice(0, 10);
manifest.builtAt = new Date().toISOString();
manifest.categories[cat] = { count: bank.length, bytes: fs.statSync(zipPath).size };
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
const ordered = bank.filter(q => q.order !== undefined && q.order !== '' && !isNaN(parseFloat(q.order))).length;
console.log(`${cat}: +${added} added, ${updated} updated, ${skipped} skipped (invalid) -> ${bank.length} questions (${ordered} ordered); manifest ${manifest.version}`);
