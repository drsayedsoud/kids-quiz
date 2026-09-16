// سباق البطل: مغامرة قاع الهامور مع سبونج بوب وبسيط وشفيق ومستر سلطع
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

    // ---------- optional sprites & SpongeBob friends ----------
    const sprites = {}; let spriteList = null;
    fetch('assets/sprites/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { spriteList = new Set(m && m.files || []); }).catch(() => { spriteList = new Set(); });
    function sprite(name) {
        if (!spriteList || !spriteList.has(name + '.png')) return null;
        if (!sprites[name]) { const im = new Image(); im.src = 'assets/sprites/' + name + '.png'; sprites[name] = im; }
        return sprites[name].complete && sprites[name].naturalWidth ? sprites[name] : null;
    }
    const seaFriends = ['spongebob', 'patrick', 'squidward', 'mr_krabs'];
    const friendImgs = {};
    seaFriends.forEach(f => {
        const im = new Image(); im.src = 'assets/sprites/' + f + '.png';
        friendImgs[f] = im;
    });
    const bgList = ['bg-bikini-bottom.jpg', 'bg-sea-1.jpg', 'bg-sea-2.jpg', 'bg-sea-3.jpg'];
    let bgImg = null;
    function pickBg() {
        const im = new Image();
        im.onload = () => { bgImg = im; };
        im.src = 'assets/scenes/' + bgList[Math.floor(Math.random() * bgList.length)];
    }
    pickBg();

    // ---------- question bank ----------
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
    function usable(q) {
        if (!q || !q.question || q.correct_answer === undefined || q.correct_answer === null) return false;
        if (String(q.type || '') === 'clock' || /clock:/.test(String(q.image || ''))) return false;
        const ch = [...new Set(choicesOf(q))], c = String(q.correct_answer).trim();
        return ch.length >= 3 && ch.includes(c) && String(q.question).length <= 80 && ch.every(x => x.length <= 18);
    }
    function pickQuestions(cat, items, n) {
        const usedKey = 'runner_sea_used_' + cat, used = new Set(read(usedKey, []));
        const bank = window.QOrder ? QOrder.allowed(items, QOrder.mode({ soloOnly: true })) : items;
        const pool = bank.filter(usable); let fresh = pool.filter(q => !used.has(q.question));
        if (fresh.length < n) { fresh = pool; write(usedKey, []); used.clear(); }
        const chosen = shuffle(fresh).slice(0, n);
        write(usedKey, [...used].concat(chosen.map(q => q.question)).slice(-600));
        return chosen.map(q => { const c = String(q.correct_answer).trim(); const wrong = shuffle([...new Set(choicesOf(q))].filter(x => x !== c)).slice(0, 2); return { q, answers: shuffle([c, ...wrong]), correct: c }; });
    }

    // ---------- canvas + perspective ----------
    const cv = $('cv'), g = cv.getContext('2d'), cvf = $('cv-front'), gf = cvf.getContext('2d');
    let W = 360, H = 640, dpr = 1, horizonY = 0, feetY = 0, camX = 0;
    function resize() {
        W = $('stage').clientWidth; H = $('stage').clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
        for (const [c, x] of [[cv, g], [cvf, gf]]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); }
        horizonY = H * 0.4; feetY = H * 0.8;
        buildFar();
        const h = $('hero'); h.style.bottom = (H - feetY) + 'px'; placeHero();
    }
    const F = z => z >= 1 ? 0 : Math.pow(1 - z, 2.2);
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
            const item = st.qs[st.gate]; 
            const friend = seaFriends[st.gate % seaFriends.length];
            st.active = { type: 'gate', z: 1.02, item, done: false, friend }; st.objs.push(st.active);
            showQuestion(item); st.gateT = 20.0; st.spawnT = 2.0;
            return;
        }
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

    // ---------- particles: bubbles and fish ----------
    let parts = [];
    function bubble(n, x, y) {
        for (let i = 0; i < n; i++) {
            parts.push({
                x: x + (Math.random() - 0.5) * 32,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 16,
                vy: -35 - Math.random() * 55,
                life: 1.8 + Math.random() * 1.6,
                max: 3.4,
                r: 2.5 + Math.random() * 6.5,
                col: 'rgba(215, 245, 255, 0.75)',
                bubble: true
            });
        }
    }
    function sparkle(x, y) {
        for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 90; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, gr: 240, life: 0.55, max: 0.55, r: 2 + Math.random() * 2.5, col: '#f4cd5c', front: true }); }
        parts.push({ x, y: y - 8, vx: 0, vy: -75, life: 0.75, max: 0.75, text: '+' + AR(1), front: true });
    }
    function updateScenery(dt) {
        // Spawning swimming fish in background
        if (Math.random() < dt * 1.8) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            parts.push({
                x: dir > 0 ? -30 : W + 30,
                y: horizonY * 0.15 + Math.random() * H * 0.75,
                vx: dir * (35 + Math.random() * 55),
                vy: (Math.random() - 0.5) * 8,
                life: 9,
                max: 9,
                r: 6 + Math.random() * 7,
                col: ['#ff8833', '#ffd700', '#00ced1', '#ff5599', '#9370db'][Math.floor(Math.random() * 5)],
                fish: true,
                dir: dir
            });
        }
        for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.gr) p.vy += p.gr * dt; }
        parts = parts.filter(p => p.life > 0);
    }

    // ---------- update ----------
    function update(dt) {
        st.t += dt;
        let mult = st.stumbleT > 0 ? 0.35 : 1;
        if (st.active && st.active.type === 'gate' && st.active.z <= 1.0) mult *= 0.15;
        if (st.stumbleT > 0) st.stumbleT -= dt;
        if (st.jumping) { st.jumpT -= dt; if (st.jumpT <= 0) { st.jumping = false; $('hero').classList.remove('jump'); bubble(7, laneX(st.lane, 0), feetY - 2); heroFrame(); } }
        if (st.sliding) { st.slideT -= dt; if (st.slideT <= 0) { st.sliding = false; $('hero').classList.remove('slide'); bubble(5, laneX(st.lane, 0), feetY - 2); heroFrame(); } }
        camX += (-(st.lane - 1) * W * 0.07 - camX) * Math.min(1, dt * 7);
        const v = st.speed * mult;
        st.ground = (st.ground + v * dt) % 1;
        spawn(dt);

        // Update hero pose: swimming horizontally underwater vs standing upright when answering question
        const nearGate = st.active && st.active.type === 'gate' && st.active.z < 0.75;
        const heroEl = $('hero');
        if (nearGate) {
            if (!heroEl.classList.contains('stand')) {
                heroEl.classList.remove('swimming', 'run');
                heroEl.classList.add('stand');
            }
        } else {
            if (!heroEl.classList.contains('swimming')) {
                heroEl.classList.remove('stand');
                heroEl.classList.add('swimming', 'run');
            }
            if (Math.random() < 0.35) {
                bubble(1, laneX(st.lane, 0), feetY - 15);
            }
        }

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
        if (st.gate >= st.qs.length && !st.active && !st.ended) { st.ended = true; st.objs.push({ type: 'finish', z: 0.95 }); }
        if (st.ended) { st.endT -= dt; if (st.endT <= 0) finish(); }
        if (!st.jumping) { st.dustT -= dt; if (st.dustT <= 0) { st.dustT = st.stumbleT > 0 ? 0.2 : 0.09; bubble(1, laneX(st.lane, 0), feetY - 2); } }
        updateScenery(dt);
        if (st.frameT !== undefined) { st.frameT += dt; if (st.frameT > 0.12) { st.frameT = 0; const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero'; const framesCount = (spriteList && spriteList.has(pre + '-back-4.png')) ? 4 : 2; st.frame = (st.frame + 1) % framesCount; heroFrame(); } }
    }
    function stumble() {
        st.stumbleT = 1.1; st.coins = Math.max(0, st.coins - 2); $('st-coins').textContent = AR(st.coins);
        play('boing'); $('stage').classList.remove('shake'); void $('stage').offsetWidth; $('stage').classList.add('shake');
        $('hero').classList.add('stumble'); setTimeout(() => $('hero').classList.remove('stumble'), 650);
        bubble(10, laneX(st.lane, 0), feetY - 4);
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
    function band(c, o0, o1, fill, yFn, zTop) {
        yFn = yFn || yAt; zTop = zTop === undefined ? 1 : zTop;
        const zs = ZS.filter(z => z < zTop); zs.unshift(zTop);
        c.beginPath();
        zs.forEach((z, i) => { const x = cxAt(z) + o0 * gapAt(z); if (i) c.lineTo(x, yFn(z)); else c.moveTo(x, yFn(z)); });
        for (let i = zs.length - 1; i >= 0; i--) c.lineTo(cxAt(zs[i]) + o1 * gapAt(zs[i]), yFn(zs[i]));
        c.closePath(); c.fillStyle = fill; c.fill();
    }
    function eachStep(n, fn) {
        const fr = (st ? st.ground : 0) * n % 1, base = Math.floor((st ? st.ground : 0) * n);
        for (let k = n + 1; k >= -Math.ceil(0.17 * n); k--) { const z = (k - fr) / n; if (z <= 1 && z >= -0.17) fn(z, k + base); }
    }
    function shadow(c, x, y, rx) { c.fillStyle = 'rgba(20,50,70,0.2)'; c.beginPath(); c.ellipse(x, y, rx, rx * 0.22, 0, 0, Math.PI * 2); c.fill(); }

    // ---------- far layer: underwater background ----------
    let far = null;
    function buildFar() {
        const fw = Math.round(W * 1.4), fh = Math.round(horizonY + 4);
        far = document.createElement('canvas'); far.width = Math.max(1, fw * dpr); far.height = Math.max(1, fh * dpr);
        const c = far.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const ocean = c.createLinearGradient(0, 0, 0, fh);
        ocean.addColorStop(0, '#104e70'); ocean.addColorStop(0.6, '#1a759f'); ocean.addColorStop(1, '#34a0a4');
        c.fillStyle = ocean; c.fillRect(0, 0, fw, fh);
        // Sun rays underwater
        c.fillStyle = 'rgba(255, 255, 220, 0.12)';
        for (let i = 0; i < 6; i++) {
            c.beginPath();
            c.moveTo(fw * (0.15 + i * 0.14), 0);
            c.lineTo(fw * (0.05 + i * 0.16), fh);
            c.lineTo(fw * (0.12 + i * 0.16), fh);
            c.closePath();
            c.fill();
        }
    }

    function draw() {
        g.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
        if (bgImg) {
            g.fillStyle = '#16697a'; g.fillRect(0, 0, W, horizonY + 2);
            const s = Math.max(W / bgImg.width, H / bgImg.height);
            const bw = bgImg.width * s, bh = bgImg.height * s;
            g.drawImage(bgImg, (W - bw) / 2, horizonY - bh * 0.45, bw, bh);
        } else {
            if (far) g.drawImage(far, -W * 0.2 + camX * 0.6, 0, W * 1.4, horizonY + 4);
        }
        drawGround();
        if (st && st.active && st.active.type === 'gate') band(g, st.lane - 1.46, st.lane - 0.54, 'rgba(255,235,150,' + (0.28 + 0.1 * Math.sin(st.t * 6)).toFixed(3) + ')', yAt, Math.min(1, st.active.z));
        
        const fog = g.createLinearGradient(0, horizonY - H * 0.08, 0, horizonY + H * 0.06);
        fog.addColorStop(0, 'rgba(20,90,125,0)'); fog.addColorStop(0.6, 'rgba(20,90,125,0.4)'); fog.addColorStop(1, 'rgba(20,90,125,0)');
        g.fillStyle = fog; g.fillRect(0, horizonY - H * 0.08, W, H * 0.14);

        if (st) {
            const objs = st.objs.slice().sort((a, b) => b.z - a.z);
            for (const o of objs) drawObj(o.z < 0 ? gf : g, o);
        }
        drawParts(g, false); drawParts(gf, true);
        placeLabels();
    }

    function drawGround() {
        // Sandy sea bed
        const gr = g.createLinearGradient(0, horizonY, 0, H);
        gr.addColorStop(0, '#1c5a75'); gr.addColorStop(0.4, '#d8c296'); gr.addColorStop(1, '#cdaf76');
        g.fillStyle = gr; g.fillRect(0, horizonY, W, H - horizonY);

        // Soft sea floor wave ripples
        g.strokeStyle = 'rgba(255,255,255,0.14)';
        eachStep(12, z => {
            const y = yAt(z), cx = cxAt(z), e = 1.8 * gapAt(z);
            g.lineWidth = Math.max(0.6, 2 * scaleAt(z));
            g.beginPath(); g.moveTo(-20, y); g.lineTo(cx - e, y); g.moveTo(cx + e, y); g.lineTo(W + 20, y); g.stroke();
        });

        // Soft glowing pearl lane dividers
        for (let l = 0; l <= LANES; l++) {
            const o = l - 1.5;
            band(g, o - 0.02, o + 0.02, 'rgba(255,255,255,0.2)');
        }
    }

    function drawObj(c, o) {
        const a = Math.max(0, Math.min(1, (1.02 - o.z) / 0.2)); if (a <= 0) return;
        c.globalAlpha = a;
        if (o.type === 'gate') { 
            const s = scaleAt(o.z); 
            drawFriendGate(c, cxAt(o.z), yAt(o.z), s, o.friend, o.z);
        }
        else if (o.type === 'finish') drawFinish(c, o.z);
        else {
            const x = laneX(o.lane, o.z), y = yAt(o.z), gp = gapAt(o.z);
            if (o.type === 'coin') drawCoin(c, x, y, gp, (st ? st.t : 0) * 5 + o.z * 25);
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

    // Low obstacle: Sea rock / shell barrier
    function drawLow(c, x, y, gp) {
        const w = gp * 0.9, h = w * 0.5;
        shadow(c, x, y, w * 0.6);
        c.fillStyle = '#5c8071';
        c.beginPath();
        c.ellipse(x, y - h * 0.4, w * 0.45, h * 0.45, 0, Math.PI, 0);
        c.fill();
        c.strokeStyle = '#3e5c50'; c.lineWidth = Math.max(1, w * 0.04); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        for (let a = -0.3; a <= 0.3; a += 0.2) {
            c.beginPath(); c.moveTo(x + a * w * 0.8, y - 2); c.lineTo(x + a * w * 0.4, y - h * 0.8); c.stroke();
        }
    }

    // High obstacle: Giant Coral Reef
    function drawWagon(c, x, y, gp) {
        const w = gp * 1.1, h = w * 1.7, top = y - h;
        shadow(c, x, y, w * 0.6);
        c.fillStyle = '#e85d75';
        c.beginPath();
        rr(c, x - w * 0.35, top + h * 0.2, w * 0.7, h * 0.8, w * 0.2);
        c.fill();
        c.fillStyle = '#f0788c';
        c.beginPath(); circle(c, x - w * 0.3, top + h * 0.2, w * 0.22); c.fill();
        c.beginPath(); circle(c, x + w * 0.3, top + h * 0.3, w * 0.25); c.fill();
        c.beginPath(); circle(c, x, top + h * 0.08, w * 0.28); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 5; i++) {
            c.beginPath();
            circle(c, x + (i % 2 === 0 ? 1 : -1) * w * 0.15, top + h * (0.3 + i * 0.12), w * 0.07);
            c.fill();
        }
    }

    // SpongeBob friend gate
    function drawFriendGate(c, cx, y, s, friendId, z) {
        const w = W * 0.45 * s, h = w * 1.2;
        shadow(c, cx, y, w * 0.5);
        const im = friendImgs[friendId];
        if (im && im.complete && im.naturalWidth) { 
            c.drawImage(im, cx - w/2, y - h, w, h); 
        } else {
            c.fillStyle = '#ffcc00'; c.fillRect(cx - w / 2, y - h, w, h);
        }
        const gap = z !== undefined ? gapAt(z) : (st && st.active ? gapAt(st.active.z) : W * 0.31);
        for (let l = 0; l < LANES; l++) {
            const lx = cx + (l - 1) * Math.max(gap, W * 0.31);
            const br = w * 0.35;
            c.fillStyle = 'rgba(255,255,255,0.75)';
            c.beginPath(); circle(c, lx, y - br * 1.5, br); c.fill();
            c.strokeStyle = 'rgba(100,200,255,0.9)'; c.lineWidth = Math.max(1, br * 0.1); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); circle(c, lx - br * 0.3, y - br * 1.5 - br * 0.3, br * 0.2); c.fill();
        }
    }

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
            if (p.text) {
                c.font = '900 22px Cairo, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5;
                c.strokeStyle = '#fff'; c.strokeText(p.text, p.x, p.y);
                c.fillStyle = '#d99a25'; c.fillText(p.text, p.x, p.y);
            } else if (p.fish) {
                const r = p.r, dir = p.dir;
                c.save();
                c.translate(p.x, p.y);
                c.fillStyle = p.col;
                c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2); c.fill();
                c.beginPath(); c.moveTo(-dir * r * 0.8, 0); c.lineTo(-dir * (r + 7), -r * 0.6); c.lineTo(-dir * (r + 7), r * 0.6); c.closePath(); c.fill();
                c.fillStyle = '#fff'; c.beginPath(); circle(c, dir * r * 0.4, -r * 0.15, r * 0.25); c.fill();
                c.fillStyle = '#000'; c.beginPath(); circle(c, dir * r * 0.45, -r * 0.15, r * 0.1); c.fill();
                c.restore();
            } else if (p.bubble) {
                c.strokeStyle = 'rgba(255, 255, 255, 0.8)'; c.lineWidth = 1.2;
                c.fillStyle = 'rgba(200, 240, 255, 0.25)';
                c.beginPath(); circle(c, p.x, p.y, p.r); c.fill(); c.stroke();
                c.fillStyle = 'rgba(255, 255, 255, 0.7)';
                c.beginPath(); circle(c, p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.25); c.fill();
            } else {
                c.fillStyle = p.col; c.beginPath(); circle(c, p.x, p.y, p.grow ? p.r * (1 + (1 - a) * 1.6) : p.r * (0.4 + 0.6 * a)); c.fill();
            }
        }
        c.globalAlpha = 1;
    }

    function placeLabels() {
        if (!st) return;
        const o = st.active; const labels = document.querySelectorAll('.r-lane-label');
        if (!o || o.type !== 'gate' || !labels.length) return;
        const s = scaleAt(o.z), y = yAt(o.z), cx = cxAt(o.z);
        const fw = W * 0.45 * s, br = fw * 0.4;
        const top = y - br * 1.5;
        const lg = Math.max(gapAt(o.z), W * 0.31);
        labels.forEach(l => { 
            const lane = +l.dataset.lane; 
            l.style.left = (cx + (lane - 1) * lg) + 'px'; 
            l.style.top = top + 'px'; 
            l.style.fontSize = Math.max(0.55, Math.min(1.1, 0.35 + 0.9 * s)) + 'em'; 
            l.style.opacity = o.z > 0.97 ? 0 : 1; 
            l.classList.toggle('cur', lane === st.lane); 
        });
    }

    // ---------- hero ----------
    function heroFrame() {
        const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero';
        const f1 = sprite(pre + '-back-1'), f2 = sprite(pre + '-back-2'), f3 = sprite(pre + '-back-3'), f4 = sprite(pre + '-back-4'), fj = sprite(pre + '-jump');
        const has4 = spriteList && spriteList.has(pre + '-back-4.png');
        if (!f1 || !f2 || (has4 && (!f3 || !f4))) { $('hero-svg').style.display = 'block'; return; }
        $('hero-svg').style.display = 'none';
        $('hero-f1').src = f1.src; $('hero-f2').src = f2.src; 
        if (f3) $('hero-f3').src = f3.src;
        if (f4) $('hero-f4').src = f4.src;
        if (fj) $('hero-fj').src = fj.src;
        $('hero-f1').classList.toggle('on', !st.jumping && st.frame === 0); 
        $('hero-f2').classList.toggle('on', !st.jumping && st.frame === 1); 
        $('hero-f3').classList.toggle('on', !st.jumping && st.frame === 2); 
        $('hero-f4').classList.toggle('on', !st.jumping && st.frame === 3); 
        $('hero-fj').classList.toggle('on', st.jumping && !!fj);
        if (st.jumping && !fj) $('hero-f1').classList.add('on');
    }

    let leanTimer = 0;
    function move(dir) {
        if (!running || !st) return; const l = Math.max(0, Math.min(LANES - 1, st.lane + dir)); if (l === st.lane) return;
        st.lane = l; placeHero(); play('click');
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
        if (running) raf = requestAnimationFrame(loop);
    }

    setInterval(() => { if (running && st && performance.now() - last > 60) loop(performance.now()); }, 40);

    // ---------- flow ----------
    function renderClass() {
        const cat = classKey();
        $('start-class').innerHTML = CLASSES.map(c => '<button type="button" class="' + (c.k === cat ? 'on' : '') + '" data-k="' + c.k + '">' + c.ic + ' ' + c.name + '</button>').join('');
        $('start-class').querySelectorAll('button').forEach(b => b.onclick = () => { localStorage.setItem('kids_class', b.dataset.k); play('pop'); renderClass(); });
    }
    async function start() {
        pickBg();
        const cat = classKey(); if (!cat) { play('boing'); if (window.UI) UI.toast('اختر صفّك أولاً يا بطل', { type: 'warn' }); return; }
        let items; try { items = await loadBank(cat); } catch (e) { if (window.UI) UI.toast('تعذر تحميل الأسئلة، تأكد من الإنترنت ثم حاول مرة أخرى', { type: 'warn' }); return; }
        const qs = pickQuestions(cat, items, GATES);
        if (qs.length < 3) { if (window.UI) UI.toast('أسئلة هذا الصف طويلة على السباق، جرّب صفاً آخر', { type: 'warn' }); return; }
        st = newState(cat, qs); camX = 0; parts = [];
        $('st-total').textContent = AR(st.qs.length); $('st-ok').textContent = '٠'; $('st-coins').textContent = '٠'; setProg();
        $('start').classList.add('hidden'); $('done').classList.add('hidden'); $('qcard').classList.add('hidden'); $('labels').innerHTML = '';
        $('hero').className = 'r-hero swimming run'; resize();
        running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
        play('go');
        say('يلا ' + who() + '! اسبح ف قاع الهامور مع أصدقائك واجيب على الأسئلة للحارات الصحيحة');
    }
    function finish() {
        running = false; if (window.speechSynthesis) speechSynthesis.cancel();
        const n = st.qs.length, ok = st.ok, stars = ok >= n - 1 ? 3 : ok >= Math.ceil(n * 0.6) ? 2 : 1;
        const step = window.Piggy ? Piggy.step() : 10, coins = ok * step;
        try { const bal = (parseInt(localStorage.getItem('piggyBalance')) || 0) + coins; localStorage.setItem('piggyBalance', String(bal)); localStorage.setItem('piggyEarnedTotal', String((parseInt(localStorage.getItem('piggyEarnedTotal')) || 0) + coins)); if (bal > (parseInt(localStorage.getItem('piggyBest')) || 0)) localStorage.setItem('piggyBest', String(bal)); } catch (e) {}
        try {
            const sessions = read('userSessions', []);
            const session = { date: new Date().toLocaleString('ar-EG'), email: localStorage.getItem('userEmail') || 'غير معروف', score: ok, total: n, type: 'kids_runner_sea', wrong: [], bestStreak: st.best, title: '🍍 مغامرة قاع الهامور', at: Date.now() };
            sessions.push(session); write('userSessions', sessions); if (window.Progress) Progress.onSessionSaved(session);
            const best = read('runner_sea_best', {}); best[st.cat] = Math.max(best[st.cat] || 0, st.coins); write('runner_sea_best', best);
        } catch (e) {}
        $('done-title').textContent = stars === 3 ? 'بطل قاع الهامور! 🏆' : 'وصلت نهاية المغامرة!';
        $('done-stars').innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? '' : 'off') + '">★</span>').join('');
        $('done-ok').textContent = AR(ok) + ' / ' + AR(n); $('done-coins').textContent = AR(st.coins); $('done-piggy').textContent = window.Piggy ? Piggy.words(coins) : AR(coins) + ' قرش';
        $('done-text').textContent = stars === 3 ? 'ممتاز! جاوبت صح تقريباً على كل الأسئلة وأنت تسبح!' : 'برافو! جرّب تاني علشان تجمع نجوم أكتر.';
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
    $('who-name').textContent = 'مغامرة ' + (playerName() || HERO()); $('start-title').textContent = 'مغامرة ' + (playerName() || HERO());
    renderClass(); resize();
    st = newState(classKey() || 'kids_2', []); st.gateT = 9e9; draw(); st = null;
})();
