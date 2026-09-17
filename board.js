// board.js - السبورة الذكية
// الطفل يسمع رقماً أو كلمة ويكتبها بيده. التحقق هجين:
//   1) محلي فوري (glyph-match.js) يعمل بلا إنترنت،
//   2) وعند الشك أو للكلمات المتصلة: قراءة ذكية بـ Gemini عبر /api/board ترجع ما قرأته ونصيحة للطفل.

const BG = '#0f172a';
const ar = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const say = t => (window.KidsTheme && KidsTheme.speak ? KidsTheme.speak(t) : Promise.resolve(false));

// Strokes are kept as normalised points, so a pad can be redrawn at any size (rotation, undo, export).
function paintStroke(ctx, s, W, H, k) {
  const p = s.pts.map(q => ({ x: q.x * W, y: q.y * H }));
  ctx.strokeStyle = ctx.fillStyle = s.color;
  ctx.lineWidth = s.size * k;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  if (p.length === 1) { ctx.arc(p[0].x, p[0].y, s.size * k / 2, 0, Math.PI * 2); ctx.fill(); return; }
  ctx.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length - 1; i++) { const m = mid(p[i], p[i + 1]); ctx.quadraticCurveTo(p[i].x, p[i].y, m.x, m.y); }
  ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
  ctx.stroke();
}

class Pad {
  constructor(canvas, board) {
    this.canvas = canvas;
    this.board = board;
    this.ctx = canvas.getContext('2d');
    this.strokes = [];
    this.live = null;
    this.pointerId = null;
    new ResizeObserver(() => this.resize()).observe(canvas);
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    ['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, e => this.up(e)));
    this.resize();
  }

  get empty() { return !this.strokes.length; }
  get dpr() { return Math.min(window.devicePixelRatio || 1, 2); }

  resize() {
    const w = Math.round(this.canvas.clientWidth * this.dpr), h = Math.round(this.canvas.clientHeight * this.dpr);
    if (!w || !h || (w === this.canvas.width && h === this.canvas.height)) return;
    this.canvas.width = w; this.canvas.height = h;
    this.redraw();
  }

  redraw() {
    const { width: W, height: H } = this.canvas;
    this.ctx.clearRect(0, 0, W, H);
    this.strokes.forEach(s => paintStroke(this.ctx, s, W, H, this.dpr));
  }

  clear() { this.strokes = []; this.live = null; this.redraw(); }
  undo() { this.strokes.pop(); this.redraw(); }

  point(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  down(e) {
    if (this.board.locked || this.pointerId !== null) return; // one finger draws; a resting palm is ignored
    e.preventDefault();
    this.pointerId = e.pointerId;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    this.live = { color: this.board.color, size: this.board.size, pts: [this.point(e)] };
    this.strokes.push(this.live);
    paintStroke(this.ctx, this.live, this.canvas.width, this.canvas.height, this.dpr);
    this.board.onInk(true);
  }

  move(e) {
    if (e.pointerId !== this.pointerId || !this.live) return;
    e.preventDefault();
    const { width: W, height: H } = this.canvas, ctx = this.ctx, pts = this.live.pts;
    const px = q => ({ x: q.x * W, y: q.y * H });
    const batch = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (batch.length ? batch : [e])) {
      const q = this.point(ev), last = pts[pts.length - 1];
      if (Math.hypot((q.x - last.x) * W, (q.y - last.y) * H) < 1.5 * this.dpr) continue;
      pts.push(q);
      // draw only the newest smoothed piece: midpoint -> midpoint through the previous point
      const n = pts.length, b = px(pts[n - 2]), c = px(q);
      const from = n > 2 ? mid(px(pts[n - 3]), b) : b, to = mid(b, c);
      ctx.strokeStyle = this.live.color; ctx.lineWidth = this.live.size * this.dpr;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo(b.x, b.y, to.x, to.y); ctx.stroke();
    }
  }

  up(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.live = null;
    this.redraw(); // closes the last half-segment
    this.board.onInk(false);
  }

  // Flat copy for recognition: fixed width, chosen background / ink colour.
  render(maxW, bg, ink) {
    const k = Math.min(1, maxW / this.canvas.clientWidth) || 1;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(this.canvas.clientWidth * k));
    c.height = Math.max(1, Math.round(this.canvas.clientHeight * k));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    this.strokes.forEach(s => paintStroke(ctx, ink ? { ...s, color: ink } : s, c.width, c.height, k));
    return c;
  }
}

// Vocalised so the voice reads them correctly; the expected answer is the word without tashkeel.
// Grouped by the number of letters (level N asks for N+1 letters).
const strip = w => w.replace(/[ً-ْ]/g, '');
const WORDS = [
  'أَب', 'أُمّ', 'أَخ', 'يَد', 'فَم', 'دُبّ', 'قِطّ', 'جَدّ', 'عَمّ', 'خَسّ', 'بَطّ', 'رُزّ',
  'أَسَد', 'بَحْر', 'قَمَر', 'شَمْس', 'قَلَم', 'وَلَد', 'بِنْت', 'بَاب', 'نَمِر', 'عِنَب', 'نَمْل', 'نَحْل', 'جَمَل', 'فَأْر', 'كَلْب',
  'بَيْت', 'عَيْن', 'أُذُن', 'أَنْف', 'وَرْد', 'سَمَك', 'مَوْز', 'تَمْر', 'خُبْز', 'فِيل', 'دِيك', 'جَبَل', 'نَهْر', 'لَبَن', 'عَسَل',
  'قِطَار', 'كِتَاب', 'طَائِر', 'تُفَّاح', 'حَلِيب', 'مَسْجِد', 'خَرُوف', 'حِصَان', 'حِمَار', 'ثَعْلَب', 'غُرَاب', 'شَجَرَة', 'وَرْدَة',
  'زَهْرَة', 'مَوْزَة', 'أَرْنَب', 'بِطِّيخ', 'كُرْسِي', 'مَكْتَب', 'نَجْمَة', 'سَحَاب', 'سَمَكَة', 'مَطْبَخ', 'قَارِب',
  'سَيَّارَة', 'دَرَّاجَة', 'طَائِرَة', 'فَرَاشَة', 'عُصْفُور', 'تُفَّاحَة', 'حَمَامَة', 'طَاوُوس', 'تِمْسَاح', 'مَدْرَسَة', 'مِفْتَاح',
  'زَرَافَة', 'سَفِينَة', 'حَدِيقَة', 'بَطَاطِس', 'طَمَاطِم',
  'بُرْتُقَال', 'فَرَاوْلَة', 'مُسْتَشْفَى', 'سُلَحْفَاة', 'عَصَافِير', 'أُخْطُبُوط', 'بَطَارِيق',
  'دِينَاصُور', 'تِلِفِزْيُون', 'كُمْبِيُوتَر', 'مُهَنْدِسُون'
];
const PRAISE = ['أحسنت يا بطل!', 'ممتاز! خطك جميل', 'رائع جداً!', 'برافو عليك!', 'إجابة صحيحة، أنت نجم!'];

const Board = {
  color: '#ffffff',
  size: 10,
  locked: false,
  autoTimer: null,
  aiDownUntil: 0,

  mode: 'number',   // 'number' | 'word'
  layout: 'board',  // 'board' = one wide pad, 'boxes' = a pad per letter (offline words)
  answer: '',
  spoken: '',       // vocalised form of a word answer, for the voice
  fails: 0,
  pad: null,
  boxes: [],        // [{ pad, cell, letter }]

  // level N asks for N digits / N+1 letters; `nextAt` correct answers in a row unlock the next one
  NEXT_AT: [5, 10, 15, 20, 25, Infinity],
  state: {
    number: { level: parseInt(localStorage.getItem('board_level_number')) || 1, streak: parseInt(localStorage.getItem('board_streak_number')) || 0 },
    word: { level: parseInt(localStorage.getItem('board_level_word')) || 1, streak: parseInt(localStorage.getItem('board_streak_word')) || 0 }
  },

  $: id => document.getElementById(id),

  async init() {
    this.pad = new Pad(this.$('main-board'), this);
    this.setupToolbar();
    this.setupNetHint();
    this.updatePiggyUI();
    if (window.GlyphMatch) GlyphMatch.init(); // build templates in the background

    const name = (window.Piggy && Piggy.name && Piggy.name()) || localStorage.getItem('mp_playerName') || '';
    await Promise.race([say(`أهلاً يا بطل ${name} في السبورة الذكية!`), new Promise(r => setTimeout(r, 4000))]);
    this.nextQuestion();
  },

  // ---------- toolbar ----------

  setupToolbar() {
    const pick = (selector, apply) => document.querySelectorAll(selector).forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        apply(btn);
      };
    });
    pick('.color-btn', b => { this.color = b.dataset.color; });
    pick('.size-btn', b => { this.size = parseInt(b.dataset.size); });

    this.$('undo-btn').onclick = () => { if (!this.locked) { this.lastPad().undo(); this.stopAuto(); } };
    this.$('clear-btn').onclick = () => { if (!this.locked) { this.clearAll(); this.stopAuto(); } };
    this.$('check-btn').onclick = () => this.check(false);
    this.$('audio-btn').onclick = () => this.speakQuestion();
  },

  pads() { return this.layout === 'board' ? [this.pad] : this.boxes.map(b => b.pad); },
  lastPad() { return this._lastPad && this.pads().includes(this._lastPad) ? this._lastPad : this.pads()[0]; },
  clearAll() { this.pads().forEach(p => p.clear()); },

  // ---------- questions ----------

  levelOf(mode) { return Math.min(this.state[mode].level, this.NEXT_AT.length); },

  nextQuestion() {
    this.mode = Math.random() > 0.5 ? 'number' : 'word';
    const level = this.levelOf(this.mode);
    let answer;
    do {
      if (this.mode === 'number') {
        const min = level === 1 ? 0 : Math.pow(10, level - 1), max = Math.pow(10, level) - 1;
        answer = String(Math.floor(Math.random() * (max - min + 1)) + min);
      } else {
        const pool = WORDS.filter(w => strip(w).length === level + 1);
        this.spoken = pool[Math.floor(Math.random() * pool.length)];
        answer = strip(this.spoken);
      }
    } while (answer === this.answer);
    this.answer = answer;
    this.fails = 0;
    // connected handwriting needs the AI reader; without it fall back to one box per letter
    this.setLayout(this.mode === 'word' && !this.aiAvailable() ? 'boxes' : 'board');
    this.$('question-text').textContent = this.mode === 'number' ? '🎧 استمع واكتب الرقم' : '🎧 استمع واكتب الكلمة';
    this.updateLevelUI();
    this.updateNetHint();
    this.speakQuestion();
  },

  setLayout(layout) {
    this.layout = layout;
    this.pad.clear();
    this.setBoardState('');
    this.showToast('');
    const wrap = this.$('board-wrap'), boxes = this.$('word-boxes');
    wrap.style.display = layout === 'board' ? '' : 'none';
    boxes.style.display = layout === 'boxes' ? 'flex' : 'none';
    boxes.innerHTML = '';
    this.boxes = [];
    if (layout === 'boxes') {
      for (const letter of this.answer) {
        const cell = document.createElement('div');
        cell.className = 'word-box';
        cell.innerHTML = '<span class="guide"></span><canvas></canvas>';
        boxes.appendChild(cell);
        this.boxes.push({ cell, letter, pad: new Pad(cell.querySelector('canvas'), this) });
      }
    } else {
      this.pad.resize();
    }
    this.updateGuide();
  },

  // After two misses the answer appears faintly behind the ink so the child can trace it.
  updateGuide() {
    const show = this.fails >= 2;
    const guide = this.$('guide');
    guide.textContent = show && this.layout === 'board' ? (this.mode === 'number' ? ar(this.answer) : this.answer) : '';
    guide.style.fontSize = `min(55cqh, ${Math.floor(120 / Math.max(2, this.answer.length))}cqw)`;
    this.boxes.forEach(b => { b.cell.querySelector('.guide').textContent = show ? b.letter : ''; });
  },

  speakQuestion() {
    return say(this.mode === 'number' ? `اكتب رقم ${ar(this.answer)}` : `اكتب كلمة ${this.spoken || this.answer}`);
  },

  // ---------- auto check ----------

  onInk(drawing) {
    this.stopAuto();
    if (drawing) { this._lastPad = this.pads().find(p => p.live) || this._lastPad; return; }
    // kids pause between digits; a short wait, and unfinished writing is never judged (see 'partial')
    if (this.pads().every(p => !p.empty)) this.autoTimer = setTimeout(() => this.check(true), 2500);
  },
  stopAuto() { clearTimeout(this.autoTimer); },

  // ---------- recognition ----------

  isInk: (r, g, b) => Math.abs(r - 15) > 40 || Math.abs(g - 23) > 40 || Math.abs(b - 42) > 40,
  normalizeLetter(ch) {
    return ({ 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': 'ا' })[ch] || ch;
  },

  aiAvailable() { return navigator.onLine && Date.now() > this.aiDownUntil; },
  apiUrl() {
    const h = location.hostname;
    return h.endsWith('vercel.app') || h === 'localhost' || h === '127.0.0.1' ? '/api/board' : 'https://kids-quiz-umber.vercel.app/api/board';
  },

  // Returns { read, correct, partial, tip } or null when the reader cannot be reached.
  async askAI() {
    if (!this.aiAvailable()) return null;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 9000);
    try {
      const image = this.pad.render(640, '#ffffff', '#111111').toDataURL('image/jpeg', 0.85);
      const res = await fetch(this.apiUrl(), {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, expected: this.answer, mode: this.mode })
      });
      if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { status: res.status });
      return await res.json();
    } catch (e) {
      console.warn('Board AI unavailable:', e.message);
      this.aiDownUntil = Date.now() + (e.status === 429 ? 5 : 2) * 60 * 1000;
      this.updateNetHint();
      return null;
    } finally { clearTimeout(timer); }
  },

  // -> { status: 'ok' | 'wrong' | 'partial' | 'unreadable' | 'offline', read?, tip?, wrongBoxes? }
  async judge(auto) {
    if (this.layout === 'boxes') {
      const wrongBoxes = [];
      for (let i = 0; i < this.boxes.length; i++) {
        const b = this.boxes[i];
        const r = b.pad.empty ? { status: 'empty' } : await GlyphMatch.checkLetter(b.pad.render(160, BG), this.isInk, this.normalizeLetter(b.letter));
        if (r.status !== 'ok') wrongBoxes.push(i);
      }
      return { status: wrongBoxes.length ? 'wrong' : 'ok', wrongBoxes };
    }

    let local = null;
    if (this.mode === 'number' && window.GlyphMatch) {
      local = await GlyphMatch.checkNumber(this.pad.render(600, BG), this.isInk, this.answer);
      if (local.status === 'ok') return { status: 'ok', read: this.answer }; // clear handwriting: instant, no network
      if (local.reason === 'count' && local.judged.length < this.answer.length) local.partial = true;
      if (local.partial && auto) return { status: 'partial' }; // mid-number pause: wait, and spare the AI quota
    }

    const ai = await this.askAI();
    if (ai) {
      if (ai.correct) return { status: 'ok', read: ai.read };
      if (ai.partial) return { status: 'partial' };
      return { status: ai.read ? 'wrong' : 'unreadable', read: ai.read, tip: ai.tip };
    }
    if (!local) return { status: 'offline' };
    if (local.partial) return { status: 'partial' };
    return { status: local.status === 'empty' ? 'unreadable' : 'wrong' };
  },

  async check(auto) {
    if (this.locked) return;
    this.stopAuto();
    if (this.pads().every(p => p.empty)) { if (!auto) say('اكتب على السبورة أولاً يا بطل'); return; }

    this.locked = true;
    this.$('thinking').hidden = false;
    let result;
    try { result = await this.judge(auto); }
    catch (e) { console.error('Check error:', e); result = { status: 'error' }; }
    this.$('thinking').hidden = true;
    console.log('Board check:', this.answer, result);
    this.handleResult(result, auto);
  },

  // ---------- results ----------

  handleResult(r, auto) {
    const unlockAfter = (ms, fn) => setTimeout(() => { fn && fn(); this.setBoardState(''); this.locked = false; }, ms);

    if (r.status === 'ok') return this.onCorrect();

    if (r.status === 'partial') { // still writing: never punish, never clear
      this.locked = false;
      if (!auto) say('كمّل الكتابة يا بطل');
      return;
    }
    if (r.status === 'error') { this.locked = false; say('لم أستطع التحقق الآن، حاول مرة أخرى'); return; }
    if (r.status === 'offline') { // a connected word but the reader is unreachable: same word, letter by letter
      this.locked = false;
      this.setLayout('boxes');
      say(`الإنترنت ضعيف. اكتب كل حرف من كلمة ${this.spoken || this.answer} في مربع`);
      return;
    }

    if (window.KidsTheme) KidsTheme.play('lose');
    this.setBoardState('wrong');
    if (r.status === 'unreadable') {
      say('لم أفهم كتابتك، اكتب بوضوح وبحجم أكبر يا بطل');
      return unlockAfter(1800, () => this.clearAll());
    }

    this.fails++;
    const st = this.state[this.mode];
    st.streak = 0; // a miss resets the streak only; the level never drops, to avoid frustration
    this.saveState();
    this.updateLevelUI();
    if (r.read) this.showToast(`قرأتُ: ${this.mode === 'number' ? ar(r.read) : r.read}`);
    const target = this.mode === 'number' ? `رقم ${ar(this.answer)}` : `كلمة ${this.spoken || this.answer}`;
    say(r.tip ? r.tip :`حاول مرة أخرى يا بطل، المطلوب ${target}`);

    const wrong = r.wrongBoxes || [];
    wrong.forEach(i => this.boxes[i].cell.classList.add('wrong'));
    unlockAfter(2200, () => {
      if (this.layout === 'boxes') wrong.forEach(i => { this.boxes[i].pad.clear(); this.boxes[i].cell.classList.remove('wrong'); });
      else this.pad.clear();
      this.showToast('');
      this.updateGuide();
    });
  },

  onCorrect() {
    this.setBoardState('correct');
    this.showToast(`✔ ${this.mode === 'number' ? ar(this.answer) : this.answer}`);
    if (window.KidsTheme) { KidsTheme.play('star'); KidsTheme.confetti(2500); }
    if (window.Piggy) Piggy.answer(true, { quiet: true });
    else localStorage.setItem('piggyBalance', (parseInt(localStorage.getItem('piggyBalance')) || 0) + 10);
    this.updatePiggyUI();

    const st = this.state[this.mode];
    st.streak++;
    let praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    if (st.streak >= this.NEXT_AT[this.levelOf(this.mode) - 1]) {
      st.level++; st.streak = 0;
      praise = `رائع! وصلت لمستوى جديد في ${this.mode === 'number' ? 'الأرقام' : 'الكلمات'}!`;
    }
    this.saveState();
    this.updateLevelUI();
    say(praise);
    setTimeout(() => { this.locked = false; this.nextQuestion(); }, 2600);
  },

  saveState() {
    for (const m of ['number', 'word']) {
      localStorage.setItem('board_level_' + m, this.state[m].level);
      localStorage.setItem('board_streak_' + m, this.state[m].streak);
    }
  },

  // ---------- small UI helpers ----------

  setBoardState(cls) {
    const wrap = this.$('board-wrap');
    wrap.classList.remove('correct', 'wrong');
    if (cls) wrap.classList.add(cls);
  },
  showToast(text) {
    const t = this.$('board-toast');
    t.textContent = text;
    t.hidden = !text;
  },
  updateLevelUI() {
    const level = this.levelOf(this.mode), next = this.NEXT_AT[level - 1];
    this.$('current-level-text').textContent = ar(level);
    this.$('level-indicator').style.setProperty('--p', isFinite(next) ? this.state[this.mode].streak / next : 1);
  },
  updatePiggyUI() {
    const bal = parseInt(localStorage.getItem('piggyBalance')) || 0;
    this.$('board-piggy-amount').textContent = window.Piggy && Piggy.words ? Piggy.words(bal) : bal + ' قرش';
  },

  // ---------- offline hint ----------

  // Words are read far better online (connected handwriting); say so whenever the AI reader is unreachable.
  setupNetHint() {
    this.$('net-hint-close').onclick = () => { this.netHintClosed = true; this.updateNetHint(); };
    window.addEventListener('online', () => { this.aiDownUntil = 0; this.updateNetHint(); });
    window.addEventListener('offline', () => this.updateNetHint());
    this.updateNetHint();
  },
  updateNetHint() {
    this.$('net-hint').hidden = this.netHintClosed || this.aiAvailable();
  }
};

window.addEventListener('load', () => Board.init());
