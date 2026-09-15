// سباق البطل: لعبة جري بثلاث حارات في محطة قطار. الطفل يجري نحو الأفق، يقفز فوق الحواجز المنخفضة، يغيّر الحارة
// ليتفادى عربات القطار الواقفة، يجمع العملات، وكل بضع ثوانٍ تظهر "بوابة سؤال": ثلاث لوحات على الحارات الثلاث تحمل
// ثلاث إجابات، والحارة التي يجري فيها الطفل عند وصول البوابة هي إجابته. لا خسارة ولا موت: الخطأ تعثّر بسيط فقط.
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const AR = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isLatin = s => /^[\x00-\x7FÀ-ɏ\s\d.,?!'"()\-:;]+$/.test(String(s || '').trim()) && /[A-Za-z]/.test(s);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const soundOn = () => localStorage.getItem('soundOn') !== 'false';
    const play = n => { if (window.KidsTheme && soundOn()) KidsTheme.play(n); };
    const say = (t, c) => (soundOn() && window.KidsTheme) ? KidsTheme.speak(t, c) : Promise.resolve(false);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const HEROES = ['assets/patman.png', 'assets/superman.png', 'assets/hulkman.png', 'assets/mahmoud.png', 'assets/child.jpeg'];
    const card = () => read('gbCard', null);
    const playerName = () => ((card() && card().name) || localStorage.getItem('mp_playerName') || (window.Piggy && Piggy.name()) || '').trim().slice(0, 20);
    const playerPhoto = () => (card() && (card().photo || card().avatar)) || localStorage.getItem('mp_avatar') || HEROES[0];
    const girl = () => localStorage.getItem('kids_gender') === 'girl';
    const HERO = () => girl() ? 'البطلة' : 'البطل';
    const who = () => playerName() || (girl() ? 'يا بطلة' : 'يا بطل');
    const CLASSES = [{ k: 'kids_1', name: 'حضانة', ic: '🧸', speed: 0.24 }, { k: 'kids_2', name: 'ثاني ابتدائي', ic: '٢', speed: 0.3 }, { k: 'kids_3', name: 'ثالث ابتدائي', ic: '٣', speed: 0.36 }];
    const classKey = () => { const k = localStorage.getItem('kids_class') || localStorage.getItem('daily_class') || ''; return CLASSES.some(c => c.k === k) ? k : ''; };
    const GATES = 10, LANES = 3;

    // ---------- optional sprites (assets/sprites/manifest.json lists the files that exist) ----------
    const sprites = {}; let spriteList = null;
    fetch('assets/sprites/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { spriteList = new Set(m && m.files || []); }).catch(() => { spriteList = new Set(); });
    function sprite(name) {
        if (!spriteList || !spriteList.has(name + '.png')) return null;
        if (!sprites[name]) { const im = new Image(); im.src = 'assets/sprites/' + name + '.png'; sprites[name] = im; }
        return sprites[name].complete && sprites[name].naturalWidth ? sprites[name] : null;
    }
    let bgImg = null; { const im = new Image(); im.onload = () => { bgImg = im; }; im.src = 'assets/scenes/run-station-bg.jpg'; }

    // ---------- question bank (same IndexedDB cache as the quiz page) ----------
    let db = null;
    function openDb() { return new Promise((res, rej) => { if (db) return res(db); const r = indexedDB.open('QuranDB', 1); r.onupgradeneeded = e => { const d = e.target.result; if (!d.objectStoreNames.contains('quranData')) d.createObjectStore('quranData'); }; r.onsuccess = e => { db = e.target.result; res(db); }; r.onerror = () => rej(new Error('idb')); }); }
    const idbGet = key => new Promise(async res => { try { const d = await openDb(); const q = d.transaction(['quranData'], 'readonly').objectStore('quranData').get(key); q.onsuccess = e => res(e.target.result || null); q.onerror = () => res(null); } catch (e) { res(null); } });
    const idbPut = (key, v) => new Promise(async res => { try { const d = await openDb(); const tx = d.transaction(['quranData'], 'readwrite'); tx.objectStore('quranData').put(v, key); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); } });
    async function fetchBank(cat, onPct) {
        const r = await fetch('./data/' + cat + '.zip'); if (!r.ok) throw new Error('bank');
        const total = +r.headers.get('content-length') || 0; const reader = r.body && r.body.getReader ? r.body.getReader() : null; let bytes;
        if (reader) { const chunks = []; let got = 0; for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; if (total) onPct(Math.round(got / total * 100)); } bytes = new Uint8Array(got); let o = 0; chunks.forEach(c => { bytes.set(c, o); o += c.length; }); }
        else bytes = new Uint8Array(await r.arrayBuffer());
        try { const zip = await JSZip.loadAsync(bytes); const f = zip.file(cat + '.json') || zip.file(Object.keys(zip.files)[0]); return JSON.parse(await f.async('string')); } catch (e) { return JSON.parse(new TextDecoder().decode(bytes)); }
    }
    const banks = {};
    async function loadBank(cat) {
        if (banks[cat]) return banks[cat];
        const L = $('loading'); L.classList.remove('hidden'); $('loading-bar').style.width = '5%';
        try {
            let manifest = null; try { const m = await fetch('./data/manifest.json', { cache: 'no-cache' }); if (m.ok) manifest = await m.json(); } catch (e) {}
            const cached = await idbGet('cat:' + cat);
            let items = cached && Array.isArray(cached.items) && cached.items.length && (!manifest || cached.v === manifest.version) ? cached.items : null;
            if (!items && cached && cached.items && cached.items.length && !manifest) items = cached.items;
            if (!items) { $('loading-txt').textContent = '⬇️ جاري تنزيل أسئلة صفّك'; items = await fetchBank(cat, p => { $('loading-bar').style.width = p + '%'; }); idbPut('cat:' + cat, { v: manifest ? manifest.version : 'unknown', items }); }
            $('loading-bar').style.width = '100%'; banks[cat] = items; return items;
        } finally { setTimeout(() => L.classList.add('hidden'), 250); }
    }
    const choicesOf = q => [q.choice1, q.choice2, q.choice3, q.choice4].map(c => String(c ?? '').trim()).filter(Boolean);
    // Short questions and very short answers only: the child reads them while running
    function usable(q) {
        if (!q || !q.question || q.correct_answer === undefined || q.correct_answer === null) return false;
        if (String(q.type || '') === 'clock' || /clock:/.test(String(q.image || ''))) return false;
        const ch = [...new Set(choicesOf(q))], c = String(q.correct_answer).trim();
        return ch.length >= 3 && ch.includes(c) && String(q.question).length <= 80 && ch.every(x => x.length <= 18);
    }
    function pickQuestions(cat, items, n) {
        const usedKey = 'runner_used_' + cat, used = new Set(read(usedKey, []));
        // the owner's term choice (admin panel) applies here too: term 1 / term 2 keep only that term's rows
        const bank = window.QOrder ? QOrder.allowed(items, QOrder.mode({ soloOnly: true })) : items;
        const pool = bank.filter(usable); let fresh = pool.filter(q => !used.has(q.question));
        if (fresh.length < n) { fresh = pool; write(usedKey, []); used.clear(); }
        const chosen = shuffle(fresh).slice(0, n);
        write(usedKey, [...used].concat(chosen.map(q => q.question)).slice(-600));
        return chosen.map(q => { const c = String(q.correct_answer).trim(); const wrong = shuffle([...new Set(choicesOf(q))].filter(x => x !== c)).slice(0, 2); return { q, answers: shuffle([c, ...wrong]), correct: c }; });
    }

    // ---------- canvas + perspective ----------
    // two canvases: the scene behind the hero, and a front one for whatever he has already run past
    const cv = $('cv'), g = cv.getContext('2d'), cvf = $('cv-front'), gf = cvf.getContext('2d');
    let W = 360, H = 640, dpr = 1, horizonY = 0, feetY = 0, camX = 0;
    function resize() {
        W = $('stage').clientWidth; H = $('stage').clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
        for (const [c, x] of [[cv, g], [cvf, gf]]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); }
        horizonY = H * 0.4; feetY = H * 0.8;
        buildFar();
        const h = $('hero'); h.style.bottom = (H - feetY) + 'px'; placeHero();
    }
    // z = distance along the track: 1 at the horizon, 0 at the hero's feet, negative behind him
    const F = z => z >= 1 ? 0 : Math.pow(1 - z, 2.2);
    // the camera pans a little toward the hero's lane, so the far end of the tracks swings the other way
    const cxAt = z => W / 2 + camX * (1 - F(z));
    const yAt = z => horizonY + (feetY - horizonY) * F(z);
    const gapAt = z => W * 0.3 * (0.05 + 0.95 * F(z));
    const laneX = (lane, z) => cxAt(z) + (lane - 1) * gapAt(z);
    const scaleAt = z => 0.06 + 0.94 * F(z);
    const roofY = z => horizonY - (feetY - horizonY) * 1.15 * F(z);
    const ZS = Array.from({ length: 21 }, (_, i) => 1 - i * (1.17 / 20));

    // ---------- state ----------
    let st = null, running = false, last = 0, raf = 0;
    function newState(cat, qs) {
        const c = CLASSES.find(x => x.k === cat) || CLASSES[1];
        return { cat, qs, gate: 0, ok: 0, coins: 0, lane: 1, jumping: false, jumpT: 0, stumbleT: 0, speed: c.speed, base: c.speed, objs: [], t: 0, spawnT: 1.2, gateT: 20.0, ground: 0, active: null, ended: false, endT: 9e9, best: 0, streak: 0, frame: 0, frameT: 0, dustT: 0, sliding: false, slideT: 0 };
    }
    function placeHero() { if (!st) return; $('hero').style.left = laneX(st.lane, 0) + 'px'; }
    const setProg = () => { $('prog-fill').style.width = (st.gate / st.qs.length * 100) + '%'; };

    // ---------- spawning ----------
    function spawn(dt) {
        const n = st.qs.length;
        if (st.ended || st.gate >= n && !st.active) return;
        st.spawnT -= dt;
        if (!st.active) st.gateT -= dt;
        if (!st.active && st.gate < n && st.gateT <= 0) {
            const item = st.qs[st.gate]; st.active = { type: 'gate', z: 1.02, item, done: false }; st.objs.push(st.active);
            showQuestion(item); st.gateT = 20.0; st.spawnT = 2.0; // Wait 20s
            return;
        }
        // no obstacles in the 1.6 s before a gate so the child can reach the answer lane
        if (st.spawnT <= 0 && st.gateT > 1.8 && st.gate < n) {
            const r = Math.random(), lane = Math.floor(Math.random() * LANES);
            if (r < 0.42) for (let i = 0; i < 3; i++) st.objs.push({ type: 'coin', lane, z: 1.02 + i * 0.07 });
            else if (r < 0.72) st.objs.push({ type: 'low', lane, z: 1.02 });
            else if (r < 0.92) st.objs.push({ type: 'high', lane, z: 1.02 });
            st.spawnT = 1.1 + Math.random() * 0.6;
        }
    }
    function showQuestion(item) {
        const q = item.q;
        $('q-text').innerHTML = esc(q.question);
        const im = $('q-img'); if (q.image && window.KidsTheme) { im.innerHTML = KidsTheme.richHtml(q.image, 80); im.classList.remove('hidden'); } else { im.innerHTML = ''; im.classList.add('hidden'); }
        $('qcard').classList.remove('hidden');
        $('labels').innerHTML = item.answers.map((a, i) => '<div class="r-lane-label' + (isLatin(a) ? ' latin' : '') + '" data-lane="' + i + '">' + esc(a) + '</div>').join('');
        play('pop');
        readQuestion(item);
    }
    const readQuestion = item => say('السؤال: ' + item.q.question + '. شمال: ' + item.answers[0] + '. في النص: ' + item.answers[1] + '. يمين: ' + item.answers[2]);

    // ---------- living scenery: clouds, birds, dust and sparkles ----------
    const CLOUDS = [{ x: 0.08, y: 0.07, s: 1, v: 0.012 }, { x: 0.52, y: 0.15, s: 0.7, v: 0.008 }, { x: 0.86, y: 0.05, s: 0.85, v: 0.01 }, { x: 0.34, y: 0.25, s: 0.55, v: 0.006 }];
    const BIRDS = [{ x: 0.15, y: 0.13, v: 0.05, ph: 0 }, { x: 0.22, y: 0.16, v: 0.05, ph: 1.7 }, { x: 0.68, y: 0.09, v: 0.035, ph: 0.8 }];
    let parts = [];
    function dust(n, x, y) { for (let i = 0; i < n; i++) parts.push({ x: x + (Math.random() - 0.5) * 26, y, vx: (Math.random() - 0.5) * 60, vy: -12 - Math.random() * 26, life: 0.5, max: 0.5, r: 3 + Math.random() * 3, col: '#cbbfa9', grow: true }); }
    function sparkle(x, y) {
        for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 90; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, gr: 240, life: 0.55, max: 0.55, r: 2 + Math.random() * 2.5, col: '#f4cd5c', front: true }); }
        parts.push({ x, y: y - 8, vx: 0, vy: -75, life: 0.75, max: 0.75, text: '+' + AR(1), front: true });
    }
    function updateScenery(dt) {
        for (const c of CLOUDS) { c.x -= c.v * dt; if (c.x < -0.3) c.x = 1.3; }
        for (const b of BIRDS) { b.x += b.v * dt; if (b.x > 1.25) { b.x = -0.25; b.y = 0.06 + Math.random() * 0.14; } }
        for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.gr || 0) * dt; }
        parts = parts.filter(p => p.life > 0);
    }

    // ---------- update ----------
    function update(dt) {
        st.t += dt;
        let mult = st.stumbleT > 0 ? 0.35 : 1;
        if (st.active && st.active.type === 'gate' && st.active.z <= 1.0) mult *= 0.15; // Slow-mo for questions!
        if (st.stumbleT > 0) st.stumbleT -= dt;
        if (st.jumping) { st.jumpT -= dt; if (st.jumpT <= 0) { st.jumping = false; $('hero').classList.remove('jump'); dust(7, laneX(st.lane, 0), feetY - 2); heroFrame(); } }
        if (st.sliding) { st.slideT -= dt; if (st.slideT <= 0) { st.sliding = false; $('hero').classList.remove('slide'); dust(5, laneX(st.lane, 0), feetY - 2); heroFrame(); } }
        camX += (-(st.lane - 1) * W * 0.07 - camX) * Math.min(1, dt * 7);
        const v = st.speed * mult;
        st.ground = (st.ground + v * dt) % 1;
        spawn(dt);
        for (const o of st.objs) {
            const prev = o.z; o.z -= v * dt;
            if (o.type === 'gate') {
                if (!o.done && o.z <= 0.04) { o.done = true; resolveGate(o); }
                continue;
            }
            if (o.type === 'finish') {
                if (!o.done && o.z <= 0.02) { o.done = true; st.endT = 0.7; play('star'); if (window.KidsTheme) KidsTheme.burst(W / 2, feetY - 120, 18); }
                continue;
            }
            if (prev > 0.03 && o.z <= 0.03 && o.lane === st.lane && !o.hit) {
                o.hit = true;
                if (o.type === 'coin') { st.coins++; play('star'); $('st-coins').textContent = AR(st.coins); sparkle(laneX(o.lane, 0.03), yAt(0.03) - gapAt(0.03) * 0.3); }
                else if (o.type === 'low' && !st.jumping) stumble();
                else if (o.type === 'high' && !st.sliding) stumble();
                else if (o.type === 'low' || o.type === 'high') play('star');
            }
        }
        st.objs = st.objs.filter(o => o.z > -0.17 && !(o.type === 'coin' && o.hit));
        // after the last gate the station's finish line comes running toward the hero
        if (st.gate >= st.qs.length && !st.active && !st.ended) { st.ended = true; st.objs.push({ type: 'finish', z: 0.95 }); }
        if (st.ended) { st.endT -= dt; if (st.endT <= 0) finish(); }
        // little dust puffs from the running feet
        if (!st.jumping) { st.dustT -= dt; if (st.dustT <= 0) { st.dustT = st.stumbleT > 0 ? 0.2 : 0.09; dust(1, laneX(st.lane, 0), feetY - 2); } }
        updateScenery(dt);
        // sprite run frames
        if (st.frameT !== undefined) { st.frameT += dt; if (st.frameT > 0.12) { st.frameT = 0; st.frame = 1 - st.frame; heroFrame(); } }
    }
    function stumble() {
        st.stumbleT = 1.1; st.coins = Math.max(0, st.coins - 2); $('st-coins').textContent = AR(st.coins);
        play('boing'); $('stage').classList.remove('shake'); void $('stage').offsetWidth; $('stage').classList.add('shake');
        $('hero').classList.add('stumble'); setTimeout(() => $('hero').classList.remove('stumble'), 650);
        dust(10, laneX(st.lane, 0), feetY - 4);
        toast('أوبس! 😅');
    }
    function resolveGate(o) {
        const item = o.item, picked = item.answers[st.lane], ok = picked === item.correct;
        st.gate++; st.active = null; setProg();
        document.querySelectorAll('.r-lane-label').forEach(l => { const a = item.answers[+l.dataset.lane]; if (a === item.correct) l.classList.add('ok'); else if (+l.dataset.lane === st.lane) l.classList.add('no'); });
        if (ok) {
            st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); $('st-ok').textContent = AR(st.ok);
            if (window.KidsTheme) { KidsTheme.playWow(); KidsTheme.burst(laneX(st.lane, 0), feetY - 80, 14); }
            toast(['برافو', 'شاطر', 'ممتاز', 'عظيم'][Math.floor(Math.random() * 4)] + ' 🎉');
            say(['برافو', 'شاطر', 'ممتاز', 'عظيم'][Math.floor(Math.random() * 4)] + ' ' + who() + '!');
            st.speed = st.base * (1 + 0.03 * st.gate);
        } else {
            st.streak = 0; play('boing'); toast('الإجابة: ' + item.correct);
            if (window.Progress) { try { Progress.addWrong(item.q, st.cat); } catch (e) {} }
            say('مش دي ' + who() + '. الإجابة الصحيحة: ' + item.correct);
        }
        setTimeout(() => { $('qcard').classList.add('hidden'); }, 1500);
        setTimeout(() => { $('labels').innerHTML = ''; }, 1500);
    }
    function toast(text) { const el = document.createElement('div'); el.className = 'r-toast'; el.textContent = text; $('stage').appendChild(el); setTimeout(() => el.remove(), 1300); }

    // ---------- drawing helpers ----------
    const circle = (c, x, y, r) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); };
    function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    // a strip that follows the track from the horizon to behind the hero; offsets are in lane widths from the centre
    function band(c, o0, o1, fill, yFn, zTop) {
        yFn = yFn || yAt; zTop = zTop === undefined ? 1 : zTop;
        const zs = ZS.filter(z => z < zTop); zs.unshift(zTop);
        c.beginPath();
        zs.forEach((z, i) => { const x = cxAt(z) + o0 * gapAt(z); if (i) c.lineTo(x, yFn(z)); else c.moveTo(x, yFn(z)); });
        for (let i = zs.length - 1; i >= 0; i--) c.lineTo(cxAt(zs[i]) + o1 * gapAt(zs[i]), yFn(zs[i]));
        c.closePath(); c.fillStyle = fill; c.fill();
    }
    // things repeated along the track (sleepers, tiles, pillars), scrolling toward the hero, far to near
    function eachStep(n, fn) {
        const fr = (st.ground * n) % 1, base = Math.floor(st.ground * n);
        for (let k = n + 1; k >= -Math.ceil(0.17 * n); k--) { const z = (k - fr) / n; if (z <= 1 && z >= -0.17) fn(z, k + base); }
    }
    function shadow(c, x, y, rx) { c.fillStyle = 'rgba(70,58,44,0.18)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2); c.fill(); }

    // ---------- the far layer (sky, sun, hills, a quiet skyline) is painted once per resize ----------
    let far = null;
    function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
    function buildFar() {
        const fw = Math.round(W * 1.4), fh = Math.round(horizonY + 4);
        far = document.createElement('canvas'); far.width = Math.max(1, fw * dpr); far.height = Math.max(1, fh * dpr);
        const c = far.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sky = c.createLinearGradient(0, 0, 0, fh); sky.addColorStop(0, '#a9cde3'); sky.addColorStop(0.65, '#d8e8ec'); sky.addColorStop(1, '#f1eee1'); c.fillStyle = sky; c.fillRect(0, 0, fw, fh);
        const sun = c.createRadialGradient(fw * 0.64, fh * 0.32, 0, fw * 0.64, fh * 0.32, fh * 0.55); sun.addColorStop(0, 'rgba(255,248,222,0.95)'); sun.addColorStop(0.2, 'rgba(255,245,212,0.5)'); sun.addColorStop(1, 'rgba(255,245,212,0)'); c.fillStyle = sun; c.fillRect(0, 0, fw, fh);
        const hills = (col, amp, base, f, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, fh); for (let x = 0; x <= fw + 6; x += 6) c.lineTo(x, fh - base - amp * (0.5 + 0.5 * Math.sin(x / fw * f + ph)) * (0.6 + 0.4 * Math.sin(x / fw * f * 2.3 + ph * 2))); c.lineTo(fw, fh); c.closePath(); c.fill(); };
        hills('#c6d6c6', H * 0.07, H * 0.02, 7, 1);
        const r = rng(7);
        for (let x = fw * 0.2; x < fw * 0.8;) { const w = 10 + r() * 22, h = H * (0.025 + r() * 0.05); c.fillStyle = r() < 0.5 ? '#bdc9d3' : '#c7d1d9'; c.fillRect(x, fh - h - 2, w, h + 2); x += w + 1 + r() * 5; }
        hills('#b2c8ae', H * 0.03, H * 0.006, 11, 3);
    }
    function drawCloud(x, y, s) { const r = W * 0.06 * s; g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); circle(g, x, y, r); circle(g, x + r * 1.1, y + r * 0.3, r * 0.78); circle(g, x - r * 1.05, y + r * 0.35, r * 0.68); circle(g, x + r * 0.1, y + r * 0.5, r * 0.85); g.fill(); }
    function drawBird(x, y, flap) { const w = 8, d = flap * 5; g.beginPath(); g.moveTo(x - w, y - d); g.quadraticCurveTo(x - w * 0.45, y - 3, x, y); g.quadraticCurveTo(x + w * 0.45, y - 3, x + w, y - d); g.stroke(); }

    // ---------- drawing ----------
    function draw() {
        g.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
        if (bgImg) { g.fillStyle = '#dfe9ec'; g.fillRect(0, 0, W, horizonY + 2); const s = Math.max(W / bgImg.width, H / bgImg.height); const w = bgImg.width * s, h = bgImg.height * s; g.drawImage(bgImg, (W - w) / 2, horizonY - h * 0.45, w, h); }
        else {
            if (far) g.drawImage(far, -W * 0.2 + camX * 0.6, 0, W * 1.4, horizonY + 4);
            for (const c of CLOUDS) drawCloud(c.x * W + camX * 0.3, c.y * H, c.s);
            g.strokeStyle = '#6a7482'; g.lineWidth = 1.8; g.lineCap = 'round';
            for (const b of BIRDS) drawBird(b.x * W, b.y * H, Math.sin(st.t * 9 + b.ph));
        }
        drawGround();
        // when a question is coming, the hero's lane glows up to the answer sign
        if (st.active && st.active.type === 'gate') band(g, st.lane - 1.46, st.lane - 0.54, 'rgba(255,224,130,' + (0.24 + 0.1 * Math.sin(st.t * 6)).toFixed(3) + ')', yAt, Math.min(1, st.active.z));
        if (!bgImg) drawCanopy();
        // soft haze where the tracks meet the sky
        const fog = g.createLinearGradient(0, horizonY - H * 0.08, 0, horizonY + H * 0.06); fog.addColorStop(0, 'rgba(241,241,233,0)'); fog.addColorStop(0.6, 'rgba(241,241,233,0.55)'); fog.addColorStop(1, 'rgba(241,241,233,0)'); g.fillStyle = fog; g.fillRect(0, horizonY - H * 0.08, W, H * 0.14);
        // objects far to near: ahead of the hero behind him on screen, already passed ones in front of him
        const objs = st.objs.slice().sort((a, b) => b.z - a.z);
        for (const o of objs) drawObj(o.z < 0 ? gf : g, o);
        drawParts(g, false); drawParts(gf, true);
        placeLabels();
    }
    function drawGround() {
        const gr = g.createLinearGradient(0, horizonY, 0, H); gr.addColorStop(0, '#ebe6da'); gr.addColorStop(1, '#d6cebf'); g.fillStyle = gr; g.fillRect(0, horizonY, W, H - horizonY);
        // platform tiles
        g.strokeStyle = 'rgba(110,95,75,0.14)';
        eachStep(10, z => { const y = yAt(z), cx = cxAt(z), e = 1.8 * gapAt(z); g.lineWidth = Math.max(0.6, 2 * scaleAt(z)); g.beginPath(); g.moveTo(-20, y); g.lineTo(cx - e, y); g.moveTo(cx + e, y); g.lineTo(W + 20, y); g.stroke(); });
        for (const o of [2.5, 3.4, 4.7, 6.6]) for (const sd of [-1, 1]) band(g, sd * o - 0.015, sd * o + 0.015, 'rgba(110,95,75,0.13)');
        // track bed, one gravel bed per lane
        band(g, -1.55, 1.55, '#ada699');
        for (let l = 0; l < LANES; l++) band(g, l - 1.44, l - 0.56, '#9f978a');
        // platform edges: stone curb and the yellow safety line
        for (const sd of [-1, 1]) { band(g, sd * 1.5, sd * 1.56, '#8e877b'); band(g, sd * 1.56, sd * 1.67, '#f2ede3'); band(g, sd * 1.75, sd * 1.81, '#dfc36f'); }
        // sleepers
        g.strokeStyle = '#85715a'; g.lineCap = 'butt';
        eachStep(26, z => { const y = yAt(z), gp = gapAt(z); g.lineWidth = Math.max(1, gp * 0.05); g.beginPath(); for (let l = 0; l < LANES; l++) { const x = laneX(l, z); g.moveTo(x - gp * 0.4, y); g.lineTo(x + gp * 0.4, y); } g.stroke(); });
        // steel rails with a bright top edge
        for (let l = 0; l < LANES; l++) for (const d of [-0.26, 0.26]) { const o = l - 1 + d; band(g, o - 0.024, o + 0.024, '#7b838c'); band(g, o - 0.024, o + 0.006, '#cdd4da'); }
    }
    function drawCanopy() {
        const P = 2.35, OUT = 7, fh = z => (feetY - horizonY) * F(z);
        for (const sd of [-1, 1]) band(g, sd * P, sd * OUT, '#c4cbd0', roofY);
        eachStep(8, (z, id) => {
            const gp = gapAt(z), y = yAt(z), ry = roofY(z), cx = cxAt(z), h = fh(z);
            for (const sd of [-1, 1]) {
                const x = cx + sd * P * gp, w = Math.max(1.5, gp * 0.13);
                g.strokeStyle = '#a7b0b7'; g.lineWidth = Math.max(1, gp * 0.06); g.beginPath(); g.moveTo(x, ry); g.lineTo(cx + sd * OUT * gp, ry); g.stroke();
                g.fillStyle = '#ede7dd'; g.fillRect(x - w / 2, ry, w, y - ry);
                g.fillStyle = 'rgba(90,80,70,0.15)'; g.fillRect(sd < 0 ? x : x - w / 2, ry, w / 2, y - ry);
                g.fillStyle = '#bcb3a5'; g.fillRect(x - w * 0.8, y - h * 0.06, w * 1.6, h * 0.06);
                // a potted plant by every other pillar
                if (id % 2 === 0) {
                    const px = cx + sd * 2.05 * gp, pw = gp * 0.14;
                    g.fillStyle = '#b98a63'; g.fillRect(px - pw / 2, y - h * 0.1, pw, h * 0.1);
                    g.fillStyle = '#86a97f'; g.beginPath(); circle(g, px, y - h * 0.15, pw * 0.75); circle(g, px - pw * 0.45, y - h * 0.11, pw * 0.5); circle(g, px + pw * 0.45, y - h * 0.11, pw * 0.5); g.fill();
                }
            }
        });
        // the roof edge, then warm lamps hanging from it
        for (const sd of [-1, 1]) {
            g.beginPath();
            ZS.forEach((z, i) => { const x = cxAt(z) + sd * P * gapAt(z); if (i) g.lineTo(x, roofY(z)); else g.moveTo(x, roofY(z)); });
            for (let i = ZS.length - 1; i >= 0; i--) g.lineTo(cxAt(ZS[i]) + sd * P * gapAt(ZS[i]), roofY(ZS[i]) + fh(ZS[i]) * 0.09);
            g.closePath(); g.fillStyle = '#9ca8b0'; g.fill();
        }
        eachStep(8, z => {
            const gp = gapAt(z), ry = roofY(z) + fh(z) * 0.09, cx = cxAt(z), ly = ry + fh(z) * 0.1;
            for (const sd of [-1, 1]) {
                const x = cx + sd * (P - 0.3) * gp;
                g.strokeStyle = '#88929a'; g.lineWidth = Math.max(0.5, gp * 0.012); g.beginPath(); g.moveTo(x, ry); g.lineTo(x, ly); g.stroke();
                g.fillStyle = 'rgba(255,232,160,0.28)'; g.beginPath(); circle(g, x, ly, gp * 0.16); g.fill();
                g.fillStyle = '#f7e6ad'; g.beginPath(); circle(g, x, ly, gp * 0.06); g.fill();
            }
        });
    }
    function drawObj(c, o) {
        const a = Math.max(0, Math.min(1, (1.02 - o.z) / 0.2)); if (a <= 0) return;
        c.globalAlpha = a;
        if (o.type === 'gate') { const s = scaleAt(o.z); for (let l = 0; l < LANES; l++) drawSign(c, laneX(l, o.z), yAt(o.z), s); }
        else if (o.type === 'finish') drawFinish(c, o.z);
        else {
            const x = laneX(o.lane, o.z), y = yAt(o.z), gp = gapAt(o.z);
            if (o.type === 'coin') drawCoin(c, x, y, gp, st.t * 5 + o.z * 25);
            else if (o.type === 'low') drawLow(c, x, y, gp);
            else if (o.type === 'high') drawWagon(c, x, y, gp);
        }
        c.globalAlpha = 1;
    }
    function drawCoin(c, x, y, gp, spin) {
        const r = gp * 0.15, cy = y - r * 2 + Math.sin(spin * 0.6) * r * 0.15;
        shadow(c, x, y, r * 0.8);
        const im = sprite('run-coin'); if (im) { c.drawImage(im, x - r, cy - r, r * 2, r * 2); return; }
        c.save(); c.translate(x, cy); c.scale(Math.max(0.16, Math.abs(Math.cos(spin))), 1);
        c.fillStyle = '#c99329'; c.beginPath(); circle(c, 0, 0, r); c.fill();
        c.fillStyle = '#f1c451'; c.beginPath(); circle(c, 0, 0, r * 0.84); c.fill();
        c.strokeStyle = '#d9a53a'; c.lineWidth = Math.max(0.6, r * 0.12); c.beginPath(); circle(c, 0, 0, r * 0.52); c.stroke();
        c.fillStyle = 'rgba(255,250,225,0.85)'; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.34, r * 0.2, r * 0.12, -0.7, 0, Math.PI * 2); c.fill();
        c.restore();
    }
    // a low striped barrier: jump over it
    function drawLow(c, x, y, gp) {
        const w = gp * 0.88, h = w * 0.42, t = h * 0.5, leg = Math.max(1, w * 0.06);
        shadow(c, x, y, w * 0.55);
        const im = sprite('run-barrier-low'); if (im) { c.drawImage(im, x - w / 2, y - h, w, h); return; }
        c.fillStyle = '#5f666e';
        for (const sx of [-0.36, 0.36]) { c.fillRect(x + sx * w - leg / 2, y - h, leg, h); c.fillRect(x + sx * w - leg * 1.8, y - leg * 0.8, leg * 3.6, leg * 0.8); }
        c.save(); rr(c, x - w / 2, y - h, w, t, t * 0.3); c.clip();
        c.fillStyle = '#f4f0e7'; c.fillRect(x - w / 2, y - h, w, t);
        c.fillStyle = '#df7c62';
        for (let i = -2; i < 9; i++) { const sx = x - w / 2 + i * w / 7; c.beginPath(); c.moveTo(sx, y - h + t); c.lineTo(sx + w / 14, y - h + t); c.lineTo(sx + w / 14 + t, y - h); c.lineTo(sx + t, y - h); c.closePath(); c.fill(); }
        c.restore();
        c.strokeStyle = 'rgba(80,60,50,0.25)'; c.lineWidth = Math.max(0.5, t * 0.06); rr(c, x - w / 2, y - h, w, t, t * 0.3); c.stroke();
        c.fillStyle = '#f2b845'; c.beginPath(); circle(c, x, y - h - t * 0.12, t * 0.2); c.fill();
    }
    // a parked train carriage: too tall to jump, change lane
    function drawWagon(c, x, y, gp) {
        const w = gp * 1.25, h = w * 1.8, top = y - h, r = w * 0.16;
        shadow(c, x, y, w * 0.6);
        const im = sprite('run-barrier-high'); if (im) { c.drawImage(im, x - w / 2, top, w, h); return; }
        c.fillStyle = '#4f5b63'; rr(c, x - w * 0.46, y - h * 0.13, w * 0.92, h * 0.13, r * 0.3); c.fill();
        const body = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); body.addColorStop(0, '#6c98a8'); body.addColorStop(0.5, '#89b3c1'); body.addColorStop(1, '#628e9f');
        c.fillStyle = body; rr(c, x - w / 2, top, w, h * 0.9, r); c.fill();
        c.fillStyle = '#4c7483'; rr(c, x - w * 0.36, top + h * 0.035, w * 0.72, h * 0.075, r * 0.3); c.fill();
        c.fillStyle = '#f3d27a'; for (let i = 0; i < 5; i++) { c.beginPath(); circle(c, x - w * 0.24 + i * w * 0.12, top + h * 0.072, Math.max(0.5, w * 0.018)); c.fill(); }
        c.fillStyle = '#e4eff2'; rr(c, x - w * 0.38, top + h * 0.15, w * 0.76, h * 0.3, r * 0.5); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(x - w * 0.3, top + h * 0.42); c.lineTo(x - w * 0.12, top + h * 0.17); c.lineTo(x - w * 0.02, top + h * 0.17); c.lineTo(x - w * 0.2, top + h * 0.42); c.closePath(); c.fill();
        c.fillStyle = 'rgba(80,120,140,0.35)'; c.fillRect(x - w * 0.015, top + h * 0.15, w * 0.03, h * 0.3);
        c.fillStyle = '#e8c36c'; c.fillRect(x - w / 2, top + h * 0.56, w, h * 0.055);
        c.fillStyle = '#fff4c8';
        for (const sx of [-0.3, 0.3]) { c.beginPath(); circle(c, x + sx * w, top + h * 0.71, w * 0.065); c.fill(); }
        c.strokeStyle = 'rgba(40,60,70,0.25)'; c.lineWidth = Math.max(0.5, w * 0.012); rr(c, x - w / 2, top, w, h * 0.9, r); c.stroke();
    }
    function drawSign(c, x, y, s) {
        const w = W * 0.3 * s, h = w * 0.62;
        shadow(c, x, y, w * 0.45);
        const im = sprite('run-sign');
        if (im) { c.drawImage(im, x - w / 2, y - h * 1.4, w, h * 1.4); return; }
        c.fillStyle = '#7a5537'; c.fillRect(x - w * 0.36, y - h * 1.35, 6 * s + 1, h * 1.35); c.fillRect(x + w * 0.36 - 6 * s - 1, y - h * 1.35, 6 * s + 1, h * 1.35);
        c.fillStyle = '#c9a06a'; c.fillRect(x - w / 2, y - h * 1.4, w, h); c.strokeStyle = '#7a5537'; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h * 1.4, w, h);
    }
    // the chequered finish banner at the station
    function drawFinish(c, z) {
        const y = yAt(z), gp = gapAt(z), cx = cxAt(z), half = 1.6 * gp, top = y - gp * 2.3, bh = gp * 0.42, pw = Math.max(1.5, gp * 0.07);
        c.fillStyle = '#6b737b'; c.fillRect(cx - half - pw / 2, top, pw, y - top); c.fillRect(cx + half - pw / 2, top, pw, y - top);
        const cols = 16, cw = half * 2 / cols;
        for (let row = 0; row < 2; row++) for (let i = 0; i < cols; i++) { c.fillStyle = (i + row) % 2 ? '#3d434a' : '#f5f2ea'; c.fillRect(cx - half + i * cw, top + row * bh / 2, cw + 0.5, bh / 2 + 0.5); }
        c.fillStyle = '#e07a5f'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(cx + sd * half, top); c.lineTo(cx + sd * half + sd * gp * 0.3, top - gp * 0.1); c.lineTo(cx + sd * half, top - gp * 0.2); c.closePath(); c.fill(); }
    }
    function drawParts(c, front) {
        for (const p of parts) {
            if (!!p.front !== front) continue;
            const a = p.life / p.max; c.globalAlpha = Math.max(0, a);
            if (p.text) { c.font = '900 22px Cairo, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = '#fff'; c.strokeText(p.text, p.x, p.y); c.fillStyle = '#d99a25'; c.fillText(p.text, p.x, p.y); }
            else { c.fillStyle = p.col; c.beginPath(); circle(c, p.x, p.y, p.grow ? p.r * (1 + (1 - a) * 1.6) : p.r * (0.4 + 0.6 * a)); c.fill(); }
        }
        c.globalAlpha = 1;
    }
    function placeLabels() {
        const o = st.active; const labels = document.querySelectorAll('.r-lane-label');
        if (!o || !labels.length) return;
        const s = scaleAt(o.z), w = W * 0.3 * s, h = w * 0.62;
        // far away the lanes nearly meet, so the labels keep a readable spacing until the signs catch up with them
        const lg = Math.max(gapAt(o.z), W * 0.31);
        labels.forEach(l => { const lane = +l.dataset.lane; l.style.left = (cxAt(o.z) + (lane - 1) * lg) + 'px'; l.style.top = (yAt(o.z) - h * 1.4 + h * 0.5) + 'px'; l.style.fontSize = Math.max(0.55, Math.min(1.1, 0.35 + 0.9 * s)) + 'em'; l.style.opacity = o.z > 0.97 ? 0 : 1; l.classList.toggle('cur', lane === st.lane); });
    }

    // ---------- hero ----------
    function heroFrame() {
        const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero';
        const f1 = sprite(pre + '-back-1'), f2 = sprite(pre + '-back-2'), fj = sprite(pre + '-jump');
        if (!f1 || !f2) { $('hero-svg').style.display = 'block'; return; }
        $('hero-svg').style.display = 'none';
        $('hero-f1').src = f1.src; 
        // The PNG for frame 2 has a frozen left leg, so we use frame 1 flipped!
        $('hero-f2').src = f1.src; 
        $('hero-f2').style.transform = 'scaleX(-1)';
        
        if (fj) $('hero-fj').src = fj.src;
        $('hero-f1').classList.toggle('on', !st.jumping && st.frame === 0); $('hero-f2').classList.toggle('on', !st.jumping && st.frame === 1); $('hero-fj').classList.toggle('on', st.jumping && !!fj);
        if (st.jumping && !fj) $('hero-f1').classList.add('on');
    }
    let leanTimer = 0;
    function move(dir) {
        if (!running || !st) return; const l = Math.max(0, Math.min(LANES - 1, st.lane + dir)); if (l === st.lane) return;
        st.lane = l; placeHero(); play('click');
        // lean into the lane change
        const h = $('hero'); h.classList.remove('lean-l', 'lean-r'); h.classList.add(dir < 0 ? 'lean-l' : 'lean-r');
        clearTimeout(leanTimer); leanTimer = setTimeout(() => h.classList.remove('lean-l', 'lean-r'), 200);
    }
    function jump() { if (!running || !st || st.jumping) return; st.jumping = true; st.jumpT = 0.62; $('hero').classList.remove('jump'); void $('hero').offsetWidth; $('hero').classList.add('jump'); play('whoosh'); heroFrame(); }
    function slide() { if (!running || !st || st.jumping || st.sliding) return; st.sliding = true; st.slideT = 0.72; $('hero').classList.remove('slide'); void $('hero').offsetWidth; $('hero').classList.add('slide'); play('whoosh'); heroFrame(); }
    $('btn-left').onclick = () => move(-1); $('btn-right').onclick = () => move(1); $('btn-jump').onclick = jump; $('btn-slide').onclick = slide;
    document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); jump(); } else if (e.key === 'ArrowDown') { e.preventDefault(); slide(); } });
    let touch = null;
    $('stage').addEventListener('pointerdown', e => { if (e.target.closest('button, a, .r-over')) return; touch = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    $('stage').addEventListener('pointerup', e => {
        if (!touch) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
        else if (dy < -30) jump();
        else if (dy > 30) slide();
        else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) { const f = e.clientX / W; if (f < 0.33) move(-1); else if (f > 0.67) move(1); else jump(); }
    });

    // ---------- loop ----------
    function loop(now) {
        cancelAnimationFrame(raf); raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
        if (!st) return;
        if (running) update(dt);
        draw();
        // keep animating only while the race runs: the pause and "done" screens are still, so the phone can rest
        if (running) raf = requestAnimationFrame(loop);
    }

    // Some WebViews stop requestAnimationFrame while the page is partly covered: a watchdog keeps the race moving
    setInterval(() => { if (running && st && performance.now() - last > 60) loop(performance.now()); }, 40);

    // ---------- flow ----------
    function renderClass() {
        const cat = classKey();
        $('start-class').innerHTML = CLASSES.map(c => '<button type="button" class="' + (c.k === cat ? 'on' : '') + '" data-k="' + c.k + '">' + c.ic + ' ' + c.name + '</button>').join('');
        $('start-class').querySelectorAll('button').forEach(b => b.onclick = () => { localStorage.setItem('kids_class', b.dataset.k); play('pop'); renderClass(); });
    }
    async function start() {
        const cat = classKey(); if (!cat) { play('boing'); if (window.UI) UI.toast('اختر صفّك أولاً يا بطل', { type: 'warn' }); return; }
        let items; try { items = await loadBank(cat); } catch (e) { if (window.UI) UI.toast('تعذر تحميل الأسئلة، تأكد من الإنترنت ثم حاول مرة أخرى', { type: 'warn' }); return; }
        const qs = pickQuestions(cat, items, GATES);
        if (qs.length < 3) { if (window.UI) UI.toast('أسئلة هذا الصف طويلة على السباق، جرّب صفاً آخر', { type: 'warn' }); return; }
        st = newState(cat, qs); camX = 0; parts = [];
        $('st-total').textContent = AR(st.qs.length); $('st-ok').textContent = '٠'; $('st-coins').textContent = '٠'; setProg();
        $('start').classList.add('hidden'); $('done').classList.add('hidden'); $('qcard').classList.add('hidden'); $('labels').innerHTML = '';
        $('hero').className = 'r-hero run'; resize();
        running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
        play('go');
        say('يلا ' + who() + '! اجري، اقفز فوق الحواجز، وعند كل سؤال اجري في حارة الإجابة الصحيحة');
    }
    function finish() {
        running = false; if (window.speechSynthesis) speechSynthesis.cancel();
        const n = st.qs.length, ok = st.ok, stars = ok >= n - 1 ? 3 : ok >= Math.ceil(n * 0.6) ? 2 : 1;
        const step = window.Piggy ? Piggy.step() : 10, coins = ok * step;
        try { const bal = (parseInt(localStorage.getItem('piggyBalance')) || 0) + coins; localStorage.setItem('piggyBalance', String(bal)); localStorage.setItem('piggyEarnedTotal', String((parseInt(localStorage.getItem('piggyEarnedTotal')) || 0) + coins)); if (bal > (parseInt(localStorage.getItem('piggyBest')) || 0)) localStorage.setItem('piggyBest', String(bal)); } catch (e) {}
        try {
            const sessions = read('userSessions', []);
            const session = { date: new Date().toLocaleString('ar-EG'), email: localStorage.getItem('userEmail') || 'غير معروف', score: ok, total: n, type: 'kids_runner', wrong: [], bestStreak: st.best, title: '🚉 سباق البطل', at: Date.now() };
            sessions.push(session); write('userSessions', sessions); if (window.Progress) Progress.onSessionSaved(session);
            const best = read('runner_best', {}); best[st.cat] = Math.max(best[st.cat] || 0, st.coins); write('runner_best', best);
        } catch (e) {}
        $('done-title').textContent = stars === 3 ? 'بطل السباق! 🏆' : 'وصلت المحطة!';
        $('done-stars').innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? '' : 'off') + '">★</span>').join('');
        $('done-ok').textContent = AR(ok) + ' / ' + AR(n); $('done-coins').textContent = AR(st.coins); $('done-piggy').textContent = window.Piggy ? Piggy.words(coins) : AR(coins) + ' قرش';
        $('done-text').textContent = stars === 3 ? 'ممتاز! جاوبت صح تقريباً على كل الأسئلة وأنت بتجري!' : 'برافو! جرّب تاني علشان تجمع نجوم أكتر.';
        $('done').classList.remove('hidden'); play('tada'); if (window.KidsTheme) KidsTheme.confetti(stars === 3 ? 5000 : 3000);
        say('مبروك ' + who() + '! جاوبت صح على ' + AR(ok) + ' من ' + AR(n) + '، وجمعت ' + AR(st.coins) + ' عملة، وكسبت ' + (window.Piggy ? Piggy.words(coins) : coins + ' قرش') + ' لحصالتك');
    }
    const syncSound = () => { $('btn-sound').textContent = soundOn() ? '🔊' : '🔇'; };
    $('btn-sound').onclick = () => { localStorage.setItem('soundOn', soundOn() ? 'false' : 'true'); syncSound(); if (!soundOn() && window.speechSynthesis) speechSynthesis.cancel(); };
    syncSound();
    const pause = () => { if (!running || !st) return; running = false; if (window.speechSynthesis) speechSynthesis.cancel(); $('pause').classList.remove('hidden'); };
    $('btn-pause').onclick = pause;
    $('btn-resume').onclick = () => { $('pause').classList.add('hidden'); running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(loop); if (st.active) readQuestion(st.active.item); };
    $('btn-quit').onclick = () => { location.href = 'index.html'; };
    $('btn-start').onclick = start; $('btn-again').onclick = start;
    $('btn-read').onclick = () => { if (st && st.active) readQuestion(st.active.item); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('resize', () => { resize(); if (st && !running) draw(); });
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (e) {} }

    // ---------- boot ----------
    $('who-photo').src = playerPhoto(); $('hero-badge').src = playerPhoto();
    $('who-name').textContent = 'سباق ' + (playerName() || HERO()); $('start-title').textContent = 'سباق ' + (playerName() || HERO());
    renderClass(); resize();
    st = newState(classKey() || 'kids_2', []); st.gateT = 9e9; draw(); st = null;
})();
