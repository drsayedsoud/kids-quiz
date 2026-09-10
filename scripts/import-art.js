// Imports the generated art from the Desktop folder into the app.
//   *.jpg  (forest-N, city-N, map-*, run-*)  -> assets/scenes/  resized to 1600px wide, JPEG q78 (< ~350 KB)
//   *.png  (pets, birds, clouds, ob-*, run-*) -> assets/sprites/ with the flat #00FF00 background keyed out, trimmed, max 640px
// Raw export names are normalised: "forest_four_1789048366653.jpg" -> forest-4.jpg, "City Two.jpg" -> city-2.jpg.
// Files already imported (same size + mtime) are skipped, so the script can run repeatedly (a watcher calls it).
// Needs `sharp`: `npm i sharp` in the project, or pass the folder that has it: node scripts/import-art.js --sharp <dir>
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const argv = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const src = argv('--src', path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'adventure-backgrounds'));
let sharp = null;
for (const p of [null, argv('--sharp', null), path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude', 'C--Users-dell-Desktop-AI-kids', '04d87a0f-faf3-4f17-9c13-76864fee02ca', 'scratchpad', 'tools')].filter(x => x !== undefined)) {
    try { sharp = p ? require(path.join(p, 'node_modules', 'sharp')) : require('sharp'); break; } catch (e) { /* try the next */ }
}
if (!sharp) { console.error('sharp is not available: npm i sharp   (or --sharp <dir with node_modules/sharp>)'); process.exit(1); }
const root = path.join(__dirname, '..');
const scenes = path.join(root, 'assets', 'scenes'), sprites = path.join(root, 'assets', 'sprites');
fs.mkdirSync(scenes, { recursive: true }); fs.mkdirSync(sprites, { recursive: true });
if (!fs.existsSync(src)) { console.error('Source folder not found: ' + src); process.exit(1); }
const stampFile = path.join(sprites, '.imported.json');
const stamps = fs.existsSync(stampFile) ? JSON.parse(fs.readFileSync(stampFile, 'utf8')) : {};

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10 };
// "forest_four_1789048366653" -> "forest-4"; "pet-rabbit-jump (1)" -> "pet-rabbit-jump"; keeps explicit names as they are
function normalise(base) {
    let b = base.toLowerCase().replace(/\s*\(\d+\)\s*$/, '').replace(/[\s_]+/g, '-').replace(/-\d{9,}$/, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const m = /^(forest|city)-([a-z0-9]+)$/.exec(b);
    if (m && WORDS[m[2]]) b = m[1] + '-' + WORDS[m[2]];
    return b;
}
const explicit = f => /^(forest|city)-\d\.(jpe?g)$/i.test(f) || /^[a-z0-9-]+\.png$/i.test(f);

const KNOWN = /^(forest|city|map|run|pet|bird|bat|cloud|ob)-/;
async function hasGreenCorners(from) {
    const { data, info } = await sharp(from).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    const corners = [px(1, 1), px(info.width - 2, 1), px(1, info.height - 2), px(info.width - 2, info.height - 2)];
    return corners.filter(([r, g, b]) => g > 150 && r < 120 && b < 120).length >= 3;
}
async function importScene(from, name) {
    const out = path.join(scenes, name + '.jpg');
    const meta = await sharp(from).metadata();
    await sharp(from).resize({ width: Math.min(1600, meta.width || 1600), withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(out);
    return out;
}
// Chroma key: pixels close to pure green become transparent, edge pixels get partial alpha and their green spill removed
async function importSprite(from, name) {
    const out = path.join(sprites, name + '.png');
    const im = sharp(from).ensureAlpha();
    const meta = await im.metadata();
    const scale = Math.min(1, 512 / Math.max(meta.width || 512, meta.height || 512));
    const { data, info } = await im.resize({ width: Math.round((meta.width || 640) * scale) }).raw().toBuffer({ resolveWithObject: true });
    // is the background actually flat green? sample the four corners
    const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    const corners = [px(1, 1), px(info.width - 2, 1), px(1, info.height - 2), px(info.width - 2, info.height - 2)];
    const green = corners.filter(([r, g, b]) => g > 150 && r < 120 && b < 120).length >= 3;
    if (green) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const spill = g - Math.max(r, b);           // how much greener than the other channels
            if (spill > 90) { data[i + 3] = 0; data[i] = data[i + 1] = data[i + 2] = 0; continue; }
            if (spill > 30) { data[i + 3] = Math.round(data[i + 3] * (1 - (spill - 30) / 60)); data[i + 1] = Math.max(r, b); }
        }
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 8 }).png({ compressionLevel: 9, palette: true, quality: 90, effort: 7 }).toFile(out);
    return out;
}

(async () => {
    const files = fs.readdirSync(src).filter(f => /\.(jpe?g|png)$/i.test(f) && fs.statSync(path.join(src, f)).isFile());
    // raw names first, explicit names last so an explicit file wins when both exist
    files.sort((a, b) => (explicit(a) ? 1 : 0) - (explicit(b) ? 1 : 0));
    let n = 0; const done = [];
    for (const f of files) {
        const from = path.join(src, f), st = fs.statSync(from), key = f + '|' + st.size + '|' + st.mtimeMs;
        if (stamps[f] === key && !args.includes('--force')) continue;
        const ext = path.extname(f).toLowerCase(), name = normalise(path.basename(f, ext));
        if (!KNOWN.test(name)) { console.log('skipped (not a game asset name): ' + f); continue; }
        try {
            const out = (ext === '.png' || await hasGreenCorners(from)) ? await importSprite(from, name) : await importScene(from, name);
            stamps[f] = key; n++; done.push(name + path.extname(out) + ' (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
        } catch (e) { console.error('failed: ' + f + ' -> ' + e.message); }
    }
    const list = fs.readdirSync(sprites).filter(f => f.endsWith('.png')).sort();
    fs.writeFileSync(path.join(sprites, 'manifest.json'), JSON.stringify({ files: list, at: new Date().toISOString() }, null, 2));
    fs.writeFileSync(stampFile, JSON.stringify(stamps, null, 2));
    console.log('imported ' + n + ' file(s)' + (done.length ? ': ' + done.join(', ') : '') + ' | sprites in manifest: ' + list.length + ' | scenes: ' + fs.readdirSync(scenes).filter(f => f.endsWith('.jpg')).join(', '));
})();
