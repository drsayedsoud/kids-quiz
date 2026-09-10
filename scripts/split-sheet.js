// Splits a generated "sprite sheet" (several poses on a flat #00FF00 green background) into one PNG per pose.
// Usage: node scripts/split-sheet.js <sheet.jpg|png> <outDir> [prefix]
// Writes <outDir>/<prefix>-<n>.png (keyed, trimmed, numbered left-to-right then top-to-bottom) plus <prefix>-sheet.jpg,
// a numbered contact sheet, so the right pose can be picked by eye and renamed (hero-walk-1.png, ...).
const fs = require('fs'), path = require('path');
let sharp = null;
for (const p of [null, path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude', 'C--Users-dell-Desktop-AI-kids', '04d87a0f-faf3-4f17-9c13-76864fee02ca', 'scratchpad', 'tools')]) {
    try { sharp = p ? require(path.join(p, 'node_modules', 'sharp')) : require('sharp'); break; } catch (e) {}
}
if (!sharp) { console.error('sharp is not available'); process.exit(1); }
const [file, outDir, prefixArg] = process.argv.slice(2);
if (!file || !outDir) { console.error('usage: node scripts/split-sheet.js <sheet> <outDir> [prefix]'); process.exit(1); }
const prefix = prefixArg || path.basename(file, path.extname(file)).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
fs.mkdirSync(outDir, { recursive: true });

(async () => {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    // chroma key
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], spill = g - Math.max(r, b);
        if (spill > 90) { data[i + 3] = 0; data[i] = data[i + 1] = data[i + 2] = 0; }
        else if (spill > 30) { data[i + 3] = Math.round(data[i + 3] * (1 - (spill - 30) / 60)); data[i + 1] = Math.max(r, b); }
    }
    // connected components on a coarse alpha mask (4px cells) so small gaps inside a pose do not split it
    const C = 4, cw = Math.ceil(W / C), ch = Math.ceil(H / C), mask = new Uint8Array(cw * ch);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 40) mask[Math.floor(y / C) * cw + Math.floor(x / C)] = 1;
    // dilate once so limbs touching within ~8px join the same pose
    const dil = new Uint8Array(mask);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (mask[y * cw + x]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < ch && xx >= 0 && xx < cw) dil[yy * cw + xx] = 1; }
    const label = new Int32Array(cw * ch); let n = 0; const boxes = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        if (!dil[y * cw + x] || label[y * cw + x]) continue;
        n++; const stack = [[x, y]]; label[y * cw + x] = n; let minx = x, maxx = x, miny = y, maxy = y, cells = 0;
        while (stack.length) { const [cx, cy] = stack.pop(); cells++; if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = cx + dx, yy = cy + dy; if (xx >= 0 && xx < cw && yy >= 0 && yy < ch && dil[yy * cw + xx] && !label[yy * cw + xx]) { label[yy * cw + xx] = n; stack.push([xx, yy]); } } }
        boxes.push({ id: n, cells, x0: minx * C, y0: miny * C, x1: Math.min(W, (maxx + 1) * C), y1: Math.min(H, (maxy + 1) * C) });
    }
    const big = boxes.filter(b => (b.x1 - b.x0) > W * 0.05 && (b.y1 - b.y0) > H * 0.08).sort((a, b) => (Math.round(a.y0 / (H * 0.25)) - Math.round(b.y0 / (H * 0.25))) || (a.x0 - b.x0));
    const base = sharp(data, { raw: { width: W, height: H, channels: 4 } }).png();
    const buf = await base.toBuffer();
    const thumbs = [];
    for (let i = 0; i < big.length; i++) {
        const b = big[i], out = path.join(outDir, prefix + '-' + (i + 1) + '.png');
        // tight box from the alpha channel (sharp's trim is unreliable on transparent regions)
        let tx0 = b.x1, ty0 = b.y1, tx1 = b.x0, ty1 = b.y0;
        for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) if (data[(y * W + x) * 4 + 3] > 10) { if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y; }
        if (tx1 <= tx0 || ty1 <= ty0) continue;
        try { await sharp(buf).extract({ left: tx0, top: ty0, width: tx1 - tx0 + 1, height: ty1 - ty0 + 1 }).png({ palette: true, quality: 90 }).toFile(out); } catch (e) { console.log('skip #' + (i + 1) + ' ' + e.message); continue; }
        const t = await sharp(out).resize({ height: 200, fit: 'inside' }).flatten({ background: '#d8d8d8' }).jpeg({ quality: 70 }).toBuffer();
        const m = await sharp(t).metadata(); thumbs.push({ t, w: m.width, h: m.height, name: path.basename(out), size: (b.x1 - b.x0) + 'x' + (b.y1 - b.y0) });
    }
    // numbered contact sheet
    const cellW = 220, cellH = 240, cols = 5, rows = Math.ceil(thumbs.length / cols);
    const comp = thumbs.map((t, i) => ({ input: t.t, left: (i % cols) * cellW + Math.round((cellW - t.w) / 2), top: Math.floor(i / cols) * cellH + 22 }));
    const labels = thumbs.map((t, i) => ({ input: Buffer.from('<svg width="' + cellW + '" height="22"><text x="4" y="16" font-size="15" font-family="Arial" fill="#000">#' + (i + 1) + ' ' + t.size + '</text></svg>'), left: (i % cols) * cellW, top: Math.floor(i / cols) * cellH }));
    if (thumbs.length) await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: '#fff' } }).composite(comp.concat(labels)).jpeg({ quality: 75 }).toFile(path.join(outDir, prefix + '-sheet.jpg'));
    console.log(prefix + ': ' + big.length + ' poses -> ' + outDir);
})();
