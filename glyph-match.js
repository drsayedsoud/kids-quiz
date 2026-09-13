// glyph-match.js — offline handwriting verifier for السبورة الذكية.
//
// Tesseract cannot read isolated Eastern-Arabic digits or children's letters, so the board
// verifies drawings itself: every class (٠-٩ and the 28 letters) is rendered in the device
// fonts into small normalised bitmaps, and a drawing is accepted only when the class the
// child was asked to write is the best match (within a small margin) and the match is strong.
// Everything runs on the device, so it also works offline.
(function () {
  const N = 40;          // normalised bitmap side
  const MARGIN = 2;      // blank border inside the bitmap
  const SIGMA = 1.2;     // blur that makes stroke width / small wobble irrelevant

  const DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const CLASSES = {};
  DIGITS.forEach((d, i) => { CLASSES[String(i)] = [d]; });
  CLASSES['1'].push('1'); // a plain stroke is the same in both scripts
  Object.assign(CLASSES, {
    'ا': ['ا', 'أ', 'إ', 'آ'], 'ب': ['ب'], 'ت': ['ت'], 'ث': ['ث'], 'ج': ['ج'], 'ح': ['ح'], 'خ': ['خ'],
    'د': ['د'], 'ذ': ['ذ'], 'ر': ['ر'], 'ز': ['ز'], 'س': ['س'], 'ش': ['ش'], 'ص': ['ص'], 'ض': ['ض'],
    'ط': ['ط'], 'ظ': ['ظ'], 'ع': ['ع'], 'غ': ['غ'], 'ف': ['ف'], 'ق': ['ق'], 'ك': ['ك'], 'ل': ['ل'],
    'م': ['م'], 'ن': ['ن'], 'ه': ['ه', 'ة'], 'و': ['و', 'ؤ'], 'ي': ['ي', 'ى', 'ئ']
  });
  const DIGIT_CLASSES = DIGITS.map((_, i) => String(i));
  const LETTER_CLASSES = Object.keys(CLASSES).filter(c => !/^[0-9]$/.test(c));

  const FONTS = ['Cairo', 'Segoe UI', 'Tahoma', 'Arial', 'Times New Roman', 'Noto Naskh Arabic', 'Amiri',
    'Traditional Arabic', 'Simplified Arabic', 'Sakkal Majalla', 'Arabic Typesetting', 'Noto Sans Arabic',
    'sans-serif', 'serif'];
  const STYLES = [
    { weight: 'normal', stroke: 0 },
    { weight: 'bold', stroke: 0 },
    { weight: 'normal', stroke: 12 } // very thick strokes, like a child's marker
  ];

  // ---------- image features ----------

  // 8-connected components of a binary mask. Returns [{area,x0,y0,x1,y1}] and the label map.
  function components(mask, W, H) {
    const labels = new Int32Array(W * H);
    const comps = [];
    const stack = new Int32Array(W * H);
    for (let start = 0; start < W * H; start++) {
      if (!mask[start] || labels[start]) continue;
      const id = comps.length + 1;
      const c = { area: 0, x0: W, y0: H, x1: -1, y1: -1 };
      let sp = 0; stack[sp++] = start; labels[start] = id;
      while (sp) {
        const p = stack[--sp];
        const x = p % W, y = (p - x) / W;
        c.area++;
        if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x;
        if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy; if (ny < 0 || ny >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx; if (nx < 0 || nx >= W) continue;
            const q = ny * W + nx;
            if (mask[q] && !labels[q]) { labels[q] = id; stack[sp++] = q; }
          }
        }
      }
      comps.push(c);
    }
    return { comps, labels };
  }

  function gaussianKernel(sigma) {
    const r = Math.ceil(sigma * 2.5), k = [];
    let sum = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); sum += v; }
    return { r, k: k.map(v => v / sum) };
  }
  const KER = gaussianKernel(SIGMA);

  function blur(src) {
    const tmp = new Float32Array(N * N), out = new Float32Array(N * N);
    const { r, k } = KER;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) { const xx = x + i; if (xx >= 0 && xx < N) s += src[y * N + xx] * k[i + r]; }
      tmp[y * N + x] = s;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) { const yy = y + i; if (yy >= 0 && yy < N) s += tmp[yy * N + x] * k[i + r]; }
      out[y * N + x] = s;
    }
    return out;
  }

  // zero-mean, unit-length vector so a dot product is a normalised cross-correlation
  function normalise(v) {
    let mean = 0; for (let i = 0; i < v.length; i++) mean += v[i]; mean /= v.length;
    let norm = 0; const out = new Float32Array(v.length);
    for (let i = 0; i < v.length; i++) { out[i] = v[i] - mean; norm += out[i] * out[i]; }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < v.length; i++) out[i] /= norm;
    return out;
  }

  // Turn one glyph (a mask region) into features: normalised blurred bitmap, aspect ratio, dot count.
  // Returns null when the region holds no usable ink.
  function extract(mask, W, H, minArea) {
    const { comps, labels } = components(mask, W, H);
    if (!comps.length) return null;
    let largest = 0; comps.forEach(c => { if (c.area > largest) largest = c.area; });
    const keepMin = Math.max(3, largest * 0.01);
    const kept = comps.map((c, i) => ({ c, id: i + 1 })).filter(o => o.c.area >= keepMin);
    let area = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
    kept.forEach(({ c }) => {
      area += c.area;
      if (c.x0 < x0) x0 = c.x0; if (c.x1 > x1) x1 = c.x1;
      if (c.y0 < y0) y0 = c.y0; if (c.y1 > y1) y1 = c.y1;
    });
    if (area < minArea) return null;
    const dots = kept.filter(({ c }) => c.area < largest * 0.25).length;

    // clean mask holding only the kept components
    const keepIds = new Uint8Array(comps.length + 1);
    kept.forEach(o => { keepIds[o.id] = 1; });
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    // summed-area table of the cropped clean mask for box-filter resampling
    const sat = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        const p = (y + y0) * W + (x + x0);
        row += keepIds[labels[p]] ? 1 : 0;
        sat[(y + 1) * (w + 1) + (x + 1)] = sat[y * (w + 1) + (x + 1)] + row;
      }
    }
    const boxSum = (ax, ay, bx, by) => // inclusive-exclusive [ax,bx) x [ay,by)
      sat[by * (w + 1) + bx] - sat[ay * (w + 1) + bx] - sat[by * (w + 1) + ax] + sat[ay * (w + 1) + ax];

    const inner = N - 2 * MARGIN;
    const s = inner / Math.max(w, h);
    const ow = Math.max(1, Math.round(w * s)), oh = Math.max(1, Math.round(h * s));
    const offx = Math.floor((N - ow) / 2), offy = Math.floor((N - oh) / 2);
    const bmp = new Float32Array(N * N);
    for (let oy = 0; oy < oh; oy++) {
      const sy0 = Math.floor(oy / s), sy1 = Math.max(sy0 + 1, Math.min(h, Math.ceil((oy + 1) / s)));
      for (let ox = 0; ox < ow; ox++) {
        const sx0 = Math.floor(ox / s), sx1 = Math.max(sx0 + 1, Math.min(w, Math.ceil((ox + 1) / s)));
        const cnt = (sx1 - sx0) * (sy1 - sy0);
        bmp[(oy + offy) * N + (ox + offx)] = boxSum(sx0, sy0, sx1, sy1) / cnt;
      }
    }
    return { vec: normalise(blur(bmp)), ar: w / h, dots, area, fill: area / (w * h), bbox: { x0, y0, x1, y1 } };
  }

  function similarity(a, b) {
    let ncc = 0;
    for (let i = 0; i < a.vec.length; i++) ncc += a.vec[i] * b.vec[i];
    const arPen = 0.10 * Math.min(1.5, Math.abs(Math.log(a.ar / b.ar)));
    const dotPen = 0.10 * Math.min(3, Math.abs(a.dots - b.dots));
    return ncc - arPen - dotPen;
  }

  // ---------- templates ----------

  const templates = {};   // class -> [features]
  let readyPromise = null;

  function renderGlyph(glyph, font, style) {
    const size = 200;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
    ctx.font = `${style.weight} 110px "${font}"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillText(glyph, size / 2, size / 2);
    if (style.stroke) { ctx.lineWidth = style.stroke; ctx.strokeText(glyph, size / 2, size / 2); }
    const d = ctx.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) mask[i] = d[i * 4] > 128 ? 1 : 0;
    return extract(mask, size, size, 10);
  }

  function addTemplate(cls, f) {
    if (!f) return;
    const list = templates[cls] || (templates[cls] = []);
    // skip near-duplicates (fallback fonts render the same glyph)
    for (const t of list) {
      let ncc = 0; for (let i = 0; i < N * N; i++) ncc += t.vec[i] * f.vec[i];
      if (ncc > 0.985 && t.dots === f.dots) return;
    }
    list.push(f);
  }

  function buildClass(cls) {
    for (const glyph of CLASSES[cls]) for (const font of FONTS) for (const style of STYLES) {
      addTemplate(cls, renderGlyph(glyph, font, style));
    }
  }

  // Build templates a class at a time so the page stays responsive.
  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise(resolve => {
      const queue = Object.keys(CLASSES);
      const step = () => {
        const t0 = performance.now();
        while (queue.length && performance.now() - t0 < 12) buildClass(queue.shift());
        if (queue.length) setTimeout(step, 0); else resolve();
      };
      step();
    });
    return readyPromise;
  }

  // ---------- public checks ----------

  function maskFromCanvas(canvas, isInk) {
    const W = canvas.width, H = canvas.height;
    const d = canvas.getContext('2d').getImageData(0, 0, W, H).data;
    const mask = new Uint8Array(W * H);
    let inkCount = 0;
    for (let i = 0; i < W * H; i++) {
      if (isInk(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])) { mask[i] = 1; inkCount++; }
    }
    return { mask, W, H, inkCount };
  }

  // Score every candidate class for one glyph. Returns [{cls, score}] best first.
  function rank(features, candidates) {
    return candidates.map(cls => {
      let best = -1;
      for (const t of templates[cls] || []) { const s = similarity(features, t); if (s > best) best = s; }
      if (cls === '0' && (features.fill < 0.45 || features.ar < 0.5 || features.ar > 2)) best -= 0.4;
      return { cls, score: best };
    }).sort((a, b) => b.score - a.score);
  }

  const ACCEPT_MIN = 0.5;    // the target must match at least this well
  const ACCEPT_MARGIN = 0.05; // ...and be the best class, or within this of the best

  function judge(features, target, candidates) {
    const ranked = rank(features, candidates);
    const targetScore = (ranked.find(r => r.cls === target) || { score: -1 }).score;
    const best = ranked[0];
    const ok = targetScore >= ACCEPT_MIN && targetScore >= best.score - ACCEPT_MARGIN;
    return { ok, target, targetScore, best: best.cls, bestScore: best.score, ranked };
  }

  // Split a number drawing into glyphs by column gaps (Eastern digits run left to right).
  function columnProfile(mask, W, H) {
    const col = new Int32Array(W);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) col[x]++;
    return col;
  }

  // Two digits drawn touching each other: cut the widest run at its thinnest column.
  function splitWidest(col, segs) {
    let wi = -1, ww = 0;
    segs.forEach((s, i) => { const w = s.x1 - s.x0; if (w > ww) { ww = w; wi = i; } });
    if (wi < 0 || ww < 20) return false;
    const s = segs[wi];
    let mean = 0; for (let x = s.x0; x <= s.x1; x++) mean += col[x]; mean /= ww + 1;
    const a = s.x0 + Math.floor(ww * 0.25), b = s.x1 - Math.floor(ww * 0.25);
    let bx = -1, bv = Infinity;
    for (let x = a; x <= b; x++) if (col[x] < bv) { bv = col[x]; bx = x; }
    if (bv > mean * 0.6) return false;
    segs.splice(wi, 1, { x0: s.x0, x1: bx }, { x0: bx + 1, x1: s.x1 });
    return true;
  }

  function withArea(col, segs, minArea) {
    return segs.map(r => {
      let area = 0; for (let xx = r.x0; xx <= r.x1; xx++) area += col[xx];
      return { ...r, area };
    }).filter(r => r.area >= minArea);
  }

  function segmentColumns(mask, W, H, minArea, wanted) {
    const col = columnProfile(mask, W, H);
    const runs = [];
    let x = 0;
    while (x < W) {
      if (!col[x]) { x++; continue; }
      let x0 = x; while (x < W && col[x]) x++;
      runs.push({ x0, x1: x - 1 });
    }
    // merge runs separated by tiny gaps (a broken stroke)
    const merged = [];
    for (const r of runs) {
      const last = merged[merged.length - 1];
      if (last && r.x0 - last.x1 <= 4) last.x1 = r.x1; else merged.push({ ...r });
    }
    let segs = withArea(col, merged, minArea);
    while (wanted && segs.length < wanted && splitWidest(col, segs)) segs = withArea(col, segs, minArea);
    return segs;
  }

  function sliceMask(mask, W, H, x0, x1) {
    const w = x1 - x0 + 1, out = new Uint8Array(w * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) out[y * w + x] = mask[y * W + x0 + x];
    return { mask: out, W: w, H };
  }

  // expected: string of western digits, e.g. '47'. isInk(r,g,b) tells ink from background.
  async function checkNumber(canvas, isInk, expected) {
    await init();
    const { mask, W, H, inkCount } = maskFromCanvas(canvas, isInk);
    const minArea = 25;
    if (inkCount < minArea) return { status: 'empty' };
    const segs = segmentColumns(mask, W, H, minArea, expected.length);
    if (!segs.length) return { status: 'empty' };
    const glyphs = segs.map(s => { const m = sliceMask(mask, W, H, s.x0, s.x1); return extract(m.mask, m.W, m.H, minArea); });
    const judged = glyphs.map((f, i) => f ? judge(f, expected[i] || '?', DIGIT_CLASSES) : null);
    const recognized = judged.map(j => j ? j.best : '?').join('');
    if (glyphs.length !== expected.length) {
      return { status: 'wrong', recognized, reason: 'count', judged };
    }
    const ok = judged.every(j => j && j.ok);
    return { status: ok ? 'ok' : 'wrong', recognized, judged };
  }

  // expected: normalised class letter, e.g. 'ب'.
  async function checkLetter(canvas, isInk, expected) {
    await init();
    const { mask, W, H, inkCount } = maskFromCanvas(canvas, isInk);
    const minArea = 25;
    if (inkCount < minArea) return { status: 'empty' };
    const f = extract(mask, W, H, minArea);
    if (!f) return { status: 'empty' };
    const j = judge(f, expected, LETTER_CLASSES);
    return { status: j.ok ? 'ok' : 'wrong', recognized: j.best, judged: j };
  }

  window.GlyphMatch = {
    init, checkNumber, checkLetter,
    // exposed for tests / tuning
    _extract: extract, _rank: rank, _judge: judge, _templates: templates, _maskFromCanvas: maskFromCanvas,
    DIGIT_CLASSES, LETTER_CLASSES, ACCEPT_MIN, ACCEPT_MARGIN
  };
})();
