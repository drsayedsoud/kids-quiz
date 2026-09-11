// سباق البطل: لعبة جري بثلاث حارات في محطة قطار. الطفل يجري نحو الأفق، يقفز فوق الحواجز المنخفضة، يغيّر الحارة
// ليتفادى اللوحات العالية، يجمع العملات، وكل بضع ثوانٍ تظهر "بوابة سؤال": ثلاث لوحات على الحارات الثلاث تحمل
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
        const pool = items.filter(usable); let fresh = pool.filter(q => !used.has(q.question));
        if (fresh.length < n) { fresh = pool; write(usedKey, []); used.clear(); }
        const chosen = shuffle(fresh).slice(0, n);
        write(usedKey, [...used].concat(chosen.map(q => q.question)).slice(-600));
        return chosen.map(q => { const c = String(q.correct_answer).trim(); const wrong = shuffle([...new Set(choicesOf(q))].filter(x => x !== c)).slice(0, 2); return { q, answers: shuffle([c, ...wrong]), correct: c }; });
    }

    // ---------- canvas + perspective ----------
    const cv = $('cv'), g = cv.getContext('2d');
    let W = 360, H = 640, dpr = 1, horizonY = 0, feetY = 0;
    function resize() {
        W = $('stage').clientWidth; H = $('stage').clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        horizonY = H * 0.4; feetY = H * 0.8;
        const h = $('hero'); h.style.bottom = (H - feetY) + 'px'; placeHero();
    }
    const F = z => { const p = 1 - z; return p < 0 ? 1 + (-p) * 2.6 : Math.pow(p, 2.2); };
    const yAt = z => horizonY + (feetY - horizonY) * F(z);
    const gapAt = z => W * 0.3 * (0.05 + 0.95 * F(z));
    const laneX = (lane, z) => W / 2 + (lane - 1) * gapAt(z);
    const scaleAt = z => 0.06 + 0.94 * F(z);
    const roadHalf = z => gapAt(z) * 1.55;

    // ---------- state ----------
    let st = null, running = false, last = 0, raf = 0;
    function newState(cat, qs) {
        const c = CLASSES.find(x => x.k === cat) || CLASSES[1];
        return { cat, qs, gate: 0, ok: 0, coins: 0, lane: 1, jumping: false, jumpT: 0, stumbleT: 0, speed: c.speed, base: c.speed, objs: [], t: 0, spawnT: 1.2, gateT: 4.5, ground: 0, active: null, ended: false, endT: 0, best: 0, streak: 0, frame: 0, frameT: 0 };
    }
    function placeHero() { if (!st) return; $('hero').style.left = laneX(st.lane, 0) + 'px'; }

    // ---------- spawning ----------
    function spawn(dt) {
        if (st.ended || st.gate >= GATES && !st.active) return;
        st.spawnT -= dt;
        if (!st.active) st.gateT -= dt;
        if (!st.active && st.gate < GATES && st.gateT <= 0) {
            const item = st.qs[st.gate]; st.active = { type: 'gate', z: 1.08, item, done: false }; st.objs.push(st.active);
            showQuestion(item); st.gateT = 5.0; st.spawnT = 2.0; // Wait 5s after gate resolves before next gate
            return;
        }
        // no obstacles in the 1.6 s before a gate so the child can reach the answer lane
        if (st.spawnT <= 0 && st.gateT > 1.8 && st.gate < GATES) {
            const r = Math.random(), lane = Math.floor(Math.random() * LANES);
            if (r < 0.42) for (let i = 0; i < 3; i++) st.objs.push({ type: 'coin', lane, z: 1.05 + i * 0.07 });
            else if (r < 0.72) st.objs.push({ type: 'low', lane, z: 1.05 });
            else if (r < 0.92) st.objs.push({ type: 'high', lane, z: 1.05 });
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

    // ---------- update ----------
    function update(dt) {
        st.t += dt;
        let mult = st.stumbleT > 0 ? 0.35 : 1;
        if (st.active && st.active.type === 'gate' && st.active.z <= 1.0) mult *= 0.15; // Slow-mo for questions!
        if (st.stumbleT > 0) st.stumbleT -= dt;
        if (st.jumping) { st.jumpT -= dt; if (st.jumpT <= 0) { st.jumping = false; $('hero').classList.remove('jump'); } }
        const v = st.speed * mult;
        st.ground = (st.ground + v * dt) % 1;
        spawn(dt);
        for (const o of st.objs) {
            const prev = o.z; o.z -= v * dt;
            if (o.type === 'gate') {
                if (!o.done && o.z <= 0.04) { o.done = true; resolveGate(o); }
                continue;
            }
            if (prev > 0.03 && o.z <= 0.03 && o.lane === st.lane && !o.hit) {
                o.hit = true;
                if (o.type === 'coin') { st.coins++; play('star'); $('st-coins').textContent = AR(st.coins); }
                else if (o.type === 'low' && !st.jumping) stumble();
                else if (o.type === 'high') stumble();
                else if (o.type === 'low') play('star');
            }
        }
        st.objs = st.objs.filter(o => o.z > -0.16 && !(o.type === 'coin' && o.hit));
        if (st.gate >= GATES && !st.active && !st.ended) { st.ended = true; st.endT = 2.2; }
        if (st.ended) { st.endT -= dt; if (st.endT <= 0) finish(); }
        // sprite run frames
        if (st.frameT !== undefined) { st.frameT += dt; if (st.frameT > 0.12) { st.frameT = 0; st.frame = 1 - st.frame; heroFrame(); } }
    }
    function stumble() {
        st.stumbleT = 1.1; st.coins = Math.max(0, st.coins - 2); $('st-coins').textContent = AR(st.coins);
        play('boing'); $('stage').classList.remove('shake'); void $('stage').offsetWidth; $('stage').classList.add('shake');
        $('hero').classList.add('stumble'); setTimeout(() => $('hero').classList.remove('stumble'), 650);
        toast('أوبس! 😅');
    }
    function resolveGate(o) {
        const item = o.item, picked = item.answers[st.lane], ok = picked === item.correct;
        st.gate++; st.active = null;
        document.querySelectorAll('.r-lane-label').forEach(l => { const a = item.answers[+l.dataset.lane]; if (a === item.correct) l.classList.add('ok'); else if (+l.dataset.lane === st.lane) l.classList.add('no'); });
        if (ok) {
            st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); $('st-ok').textContent = AR(st.ok);
            if (window.KidsTheme) { KidsTheme.playWow(); KidsTheme.burst(laneX(st.lane, 0), feetY - 80, 14); }
            toast(['برافو', 'شاطر', 'ممتاز', 'عظيم'][Math.floor(Math.random() * 4)] + ' 🎉');
            say(['برافو', 'شاطر', 'ممتاز', 'عظيم'][Math.floor(Math.random() * 4)] + ' ' + who() + '!');
            st.speed = st.base * (1 + 0.03 * st.gate);
        } else {
            st.streak = 0; play('boing'); toast('الإجابة: ' + item.correct);
            if (window.Progress) { try { Progress.addWrong(item.q, 'kids_runner'); } catch (e) {} }
            say('مش دي ' + who() + '. الإجابة الصحيحة: ' + item.correct);
        }
        setTimeout(() => { $('qcard').classList.add('hidden'); }, 1500);
        setTimeout(() => { $('labels').innerHTML = ''; }, 1500);
    }
    function toast(text) { const el = document.createElement('div'); el.className = 'r-toast'; el.textContent = text; $('stage').appendChild(el); setTimeout(() => el.remove(), 1300); }

    // ---------- drawing ----------
    function draw() {
        g.clearRect(0, 0, W, H);
        // sky + station
        const sky = g.createLinearGradient(0, 0, 0, horizonY); sky.addColorStop(0, '#8fc3ea'); sky.addColorStop(1, '#eef3e6'); g.fillStyle = sky; g.fillRect(0, 0, W, horizonY + 2);
        if (bgImg) { const s = Math.max(W / bgImg.width, H / bgImg.height); const w = bgImg.width * s, h = bgImg.height * s; g.drawImage(bgImg, (W - w) / 2, horizonY - h * 0.45, w, h); }
        else drawStation();
        // platforms
        g.fillStyle = '#c9c5bb'; g.fillRect(0, horizonY, W, H - horizonY);
        // track bed
        g.fillStyle = '#9a9488'; g.beginPath(); g.moveTo(W / 2 - roadHalf(1), yAt(1)); g.lineTo(W / 2 + roadHalf(1), yAt(1)); g.lineTo(W / 2 + roadHalf(-0.16), H + 40); g.lineTo(W / 2 - roadHalf(-0.16), H + 40); g.closePath(); g.fill();
        g.strokeStyle = '#7b756a'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - roadHalf(1), yAt(1)); g.lineTo(W / 2 - roadHalf(-0.16), H + 40); g.moveTo(W / 2 + roadHalf(1), yAt(1)); g.lineTo(W / 2 + roadHalf(-0.16), H + 40); g.stroke();
        // sleepers scrolling toward the player
        g.strokeStyle = '#6f5a44';
        for (let k = 0; k < 28; k++) { const z = ((k / 28) + st.ground) % 1; const y = yAt(z), half = roadHalf(z) * 0.95; g.lineWidth = Math.max(1, 7 * scaleAt(z)); g.beginPath(); g.moveTo(W / 2 - half, y); g.lineTo(W / 2 + half, y); g.stroke(); }
        // rails: two per lane
        g.strokeStyle = '#8f96a0';
        for (let l = 0; l < LANES; l++) for (const d of [-0.3, 0.3]) { g.lineWidth = 2.5; g.beginPath(); g.moveTo(laneX(l, 1) + d * gapAt(1), yAt(1)); g.lineTo(laneX(l, -0.16) + d * gapAt(-0.16), yAt(-0.16)); g.stroke(); }
        // objects far to near
        const objs = st.objs.slice().sort((a, b) => b.z - a.z);
        for (const o of objs) drawObj(o);
        placeLabels();
    }
    function drawStation() {
        // arch at the horizon and receding columns on both sides
        g.strokeStyle = '#8aa1b8'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, horizonY, W * 0.42, Math.PI, 0); g.stroke();
        g.fillStyle = 'rgba(120,140,160,0.35)'; g.fillRect(W * 0.08, horizonY - W * 0.42, W * 0.84, W * 0.42);
        for (let k = 0; k < 10; k++) { const z = ((k / 10) + st.ground * 0.5) % 1; const y = yAt(z), s = scaleAt(z), half = roadHalf(z) * 1.35, h = H * 0.42 * s, w = 14 * s + 2; for (const side of [-1, 1]) { const x = W / 2 + side * half; g.fillStyle = '#b8b0a2'; g.fillRect(x - w / 2, y - h, w, h); g.fillStyle = '#9a8f80'; g.fillRect(x - w, y - h - 6 * s, w * 2, 6 * s + 2); } }
    }
    function drawObj(o) {
        if (o.type === 'gate') { for (let l = 0; l < LANES; l++) drawSign(laneX(l, o.z), yAt(o.z), scaleAt(o.z)); return; }
        const x = laneX(o.lane, o.z), y = yAt(o.z), s = scaleAt(o.z), lw = W * 0.26 * s;
        if (o.type === 'coin') { const im = sprite('run-coin'); const r = W * 0.05 * s; if (im) g.drawImage(im, x - r, y - r * 2.4, r * 2, r * 2); else { g.fillStyle = '#e9b93a'; g.beginPath(); g.arc(x, y - r * 1.4, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(x, y - r * 1.4, r * 0.55, 0, Math.PI * 2); g.fill(); } return; }
        if (o.type === 'low') { const im = sprite('run-barrier-low'); const h = lw * 0.42; if (im) { g.drawImage(im, x - lw / 2, y - h, lw, h); return; } g.fillStyle = '#f2c230'; g.fillRect(x - lw / 2, y - h, lw, h * 0.6); g.fillStyle = '#2b2f33'; for (let i = 0; i < 4; i++) g.fillRect(x - lw / 2 + i * lw / 4 + lw / 8, y - h, lw / 8, h * 0.6); g.fillStyle = '#5a5f66'; g.fillRect(x - lw / 2 + 4 * s, y - h * 0.4, 6 * s + 1, h * 0.4); g.fillRect(x + lw / 2 - 10 * s - 1, y - h * 0.4, 6 * s + 1, h * 0.4); return; }
        if (o.type === 'high') { const im = sprite('run-barrier-high'); const h = lw * 1.1; if (im) { g.drawImage(im, x - lw / 2, y - h, lw, h); return; } g.fillStyle = '#5a5f66'; g.fillRect(x - lw * 0.42, y - h, 6 * s + 1, h); g.fillRect(x + lw * 0.42 - 6 * s - 1, y - h, 6 * s + 1, h); g.fillStyle = '#d9573f'; g.fillRect(x - lw / 2, y - h, lw, h * 0.5); g.fillStyle = '#fff'; g.fillRect(x - lw * 0.36, y - h * 0.78, lw * 0.72, h * 0.08); return; }
    }
    function drawSign(x, y, s) {
        const im = sprite('run-sign'); const w = W * 0.3 * s, h = w * 0.62;
        if (im) { g.drawImage(im, x - w / 2, y - h * 1.4, w, h * 1.4); return; }
        g.fillStyle = '#7a5537'; g.fillRect(x - w * 0.36, y - h * 1.35, 6 * s + 1, h * 1.35); g.fillRect(x + w * 0.36 - 6 * s - 1, y - h * 1.35, 6 * s + 1, h * 1.35);
        g.fillStyle = '#c9a06a'; g.fillRect(x - w / 2, y - h * 1.4, w, h); g.strokeStyle = '#7a5537'; g.lineWidth = 2; g.strokeRect(x - w / 2, y - h * 1.4, w, h);
    }
    function placeLabels() {
        const o = st.active; const labels = document.querySelectorAll('.r-lane-label');
        if (!o || !labels.length) return;
        const s = scaleAt(o.z), w = W * 0.3 * s, h = w * 0.62;
        labels.forEach(l => { const lane = +l.dataset.lane; l.style.left = laneX(lane, o.z) + 'px'; l.style.top = (yAt(o.z) - h * 1.4 + h * 0.5) + 'px'; l.style.fontSize = Math.max(0.55, Math.min(1.1, 0.35 + 0.9 * s)) + 'em'; l.style.opacity = s < 0.12 ? 0 : 1; });
    }

    // ---------- hero ----------
    function heroFrame() {
        const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero';
        const f1 = sprite(pre + '-back-1'), f2 = sprite(pre + '-back-2'), fj = sprite(pre + '-jump');
        if (!f1 || !f2) return;
        $('hero-svg').style.display = 'none';
        $('hero-f1').src = f1.src; $('hero-f2').src = f2.src; if (fj) $('hero-fj').src = fj.src;
        $('hero-f1').classList.toggle('on', !st.jumping && st.frame === 0); $('hero-f2').classList.toggle('on', !st.jumping && st.frame === 1); $('hero-fj').classList.toggle('on', st.jumping && !!fj);
        if (st.jumping && !fj) $('hero-f1').classList.add('on');
    }
    function move(dir) { if (!running || !st) return; const l = Math.max(0, Math.min(LANES - 1, st.lane + dir)); if (l === st.lane) return; st.lane = l; placeHero(); play('click'); }
    function jump() { if (!running || !st || st.jumping) return; st.jumping = true; st.jumpT = 0.62; $('hero').classList.remove('jump'); void $('hero').offsetWidth; $('hero').classList.add('jump'); play('whoosh'); }
    $('btn-left').onclick = () => move(-1); $('btn-right').onclick = () => move(1); $('btn-jump').onclick = jump;
    document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); jump(); } });
    let touch = null;
    $('stage').addEventListener('pointerdown', e => { if (e.target.closest('button, a, .r-over')) return; touch = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    $('stage').addEventListener('pointerup', e => {
        if (!touch) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
        else if (dy < -30) jump();
        else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) { const f = e.clientX / W; if (f < 0.33) move(-1); else if (f > 0.67) move(1); else jump(); }
    });

    // ---------- loop ----------
    function loop(now) {
        cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
        if (!st) return;
        if (running) update(dt);
        draw();
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
        st = newState(cat, qs); if (qs.length < GATES) st.qs = qs;
        $('st-total').textContent = AR(st.qs.length); $('st-ok').textContent = '٠'; $('st-coins').textContent = '٠';
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
    $('btn-resume').onclick = () => { $('pause').classList.add('hidden'); running = true; last = performance.now(); if (st.active) readQuestion(st.active.item); };
    $('btn-quit').onclick = () => { location.href = 'index.html'; };
    $('btn-start').onclick = start; $('btn-again').onclick = start;
    $('btn-read').onclick = () => { if (st && st.active) readQuestion(st.active.item); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('resize', resize);
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (e) {} }

    // ---------- boot ----------
    $('who-photo').src = playerPhoto(); $('hero-badge').src = playerPhoto();
    $('who-name').textContent = 'سباق ' + (playerName() || HERO()); $('start-title').textContent = 'سباق ' + (playerName() || HERO());
    renderClass(); resize();
    st = newState(classKey() || 'kids_2', []); st.gateT = 9e9; draw(); st = null;
})();
