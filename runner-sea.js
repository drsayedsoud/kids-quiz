// سباق البطل: مغامرة قاع الهامور مع سبونج بوب وبسيط وشفيق ومستر سلطع
(function () {
    'use strict';
    const $ = id => document.getElementById(id) || {
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        setAttribute: () => {}, getAttribute: () => null, addEventListener: () => {}, removeEventListener: () => {},
        appendChild: () => {}, removeChild: () => {}, querySelector: () => null, querySelectorAll: () => [], dataset: {}
    };
    const AR = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isLatin = s => /^[\x00-\x7FÀ-ɏ\s\d.,?!'"()\-:;]+$/.test(String(s || '').trim()) && /[A-Za-z]/.test(s);
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const soundOn = () => localStorage.getItem('soundOn') !== 'false';
    const play = n => { if (window.KidsTheme && soundOn()) KidsTheme.play(n); };
    const say = (t, c) => (soundOn() && window.KidsTheme) ? KidsTheme.speak(t, c) : Promise.resolve(false);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const rnd = (a, b) => a + Math.random() * (b - a);
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

    // ---------- optional hero sprites ----------
    const sprites = {}; let spriteList = null;
    fetch('assets/sprites/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { spriteList = new Set(m && m.files || []); }).catch(() => { spriteList = new Set(); });
    function sprite(name) {
        if (!spriteList || !spriteList.has(name + '.png')) return null;
        if (!sprites[name]) { const im = new Image(); im.src = 'assets/sprites/' + name + '.png'; sprites[name] = im; }
        return sprites[name].complete && sprites[name].naturalWidth ? sprites[name] : null;
    }

    // ---------- SpongeBob friends: the ones who ask the questions and cheer from the roadside ----------
    // crop: keep only this fraction of the sprite's height (SpongeBob's sheet has a scene strip under his feet)
    const FRIENDS = [
        { id: 'sea-friend-5', name: 'سبونج بوب', crop: 0.71 },
        { id: 'sea-friend-4', name: 'بسيط', crop: 1 },
        { id: 'sea-friend-2', name: 'شفيق', crop: 1 },
        { id: 'sea-friend-1', name: 'مستر سلطع', crop: 1 }
    ];
    const friendById = id => FRIENDS.find(f => f.id === id) || FRIENDS[0];
    const friendImgs = {};
    FRIENDS.forEach(f => { const im = new Image(); im.src = 'assets/sprites/' + f.id + '.png'; friendImgs[f.id] = im; });
    // a cropped copy of the sprite with any flat white background made transparent
    const friendCache = new Map(), friendUrl = new Map();
    function friendImage(id) {
        const f = friendById(id), raw = friendImgs[f.id];
        if (!raw || !raw.complete || !raw.naturalWidth) return null;
        if (friendCache.has(f.id)) return friendCache.get(f.id);
        const w = raw.naturalWidth, h = Math.max(1, Math.round(raw.naturalHeight * f.crop));
        const can = document.createElement('canvas'); can.width = w; can.height = h;
        const ctx = can.getContext('2d'); ctx.drawImage(raw, 0, 0, w, h, 0, 0, w, h);
        try {
            const im = ctx.getImageData(0, 0, w, h), d = im.data;
            if (d[3] > 0 && d[0] > 210 && d[1] > 210 && d[2] > 210) {
                for (let i = 0; i < d.length; i += 4) if (d[i] > 210 && d[i + 1] > 210 && d[i + 2] > 210) d[i + 3] = 0;
                ctx.putImageData(im, 0, 0);
            }
        } catch (e) {}
        friendCache.set(f.id, can);
        return can;
    }
    function friendDataUrl(id) {
        if (friendUrl.has(id)) return friendUrl.get(id);
        const can = friendImage(id); if (!can) return (friendImgs[friendById(id).id] || {}).src || '';
        let url = ''; try { url = can.toDataURL(); } catch (e) { url = friendImgs[friendById(id).id].src; }
        friendUrl.set(id, url); return url;
    }

    // ---------- backgrounds: one Bikini Bottom scene per dive ----------
    const bgList = ['bg-bikini-bottom.jpg', 'bg-sea-1.jpg', 'bg-sea-2.jpg', 'bg-sea-3.jpg'];
    let bgImg = null, bgIdx = Math.floor(Math.random() * bgList.length);
    function pickBg() {
        bgIdx = (bgIdx + 1) % bgList.length;
        const im = new Image();
        im.onload = () => { bgImg = im; };
        im.src = 'assets/scenes/' + bgList[bgIdx];
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
        const L = $('loading'); if (L) L.classList.remove('hidden'); const bar = $('loading-bar'); if (bar) bar.style.width = '5%';
        try {
            let manifest = null; try { const m = await fetch('./data/manifest.json', { cache: 'no-cache' }); if (m.ok) manifest = await m.json(); } catch (e) {}
            const cached = await idbGet('cat:' + cat);
            let items = cached && Array.isArray(cached.items) && cached.items.length && (!manifest || cached.v === manifest.version) ? cached.items : null;
            if (!items && cached && cached.items && cached.items.length && !manifest) items = cached.items;
            if (!items) { const txt = $('loading-txt'); if (txt) txt.textContent = '⬇️ جاري تنزيل أسئلة صفّك'; items = await fetchBank(cat, p => { if (bar) bar.style.width = p + '%'; }); idbPut('cat:' + cat, { v: manifest ? manifest.version : 'unknown', items }); }
            if (bar) bar.style.width = '100%'; banks[cat] = items; return items;
        } finally { setTimeout(() => { if (L) L.classList.add('hidden'); }, 250); }
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
        const stage = $('stage'); if (!stage) return;
        W = stage.clientWidth; H = stage.clientHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
        for (const [c, x] of [[cv, g], [cvf, gf]]) { if (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); } }
        horizonY = H * 0.4; feetY = H * 0.8;
        buildFar();
        const h = $('hero'); if (h) { h.style.bottom = (H - feetY) + 'px'; placeHero(); }
    }
    const F = z => z >= 1 ? 0 : Math.pow(1 - z, 2.2);
    const cxAt = z => W / 2 + camX * (1 - F(z));
    const yAt = z => horizonY + (feetY - horizonY) * F(z);
    const gapAt = z => W * 0.3 * (0.05 + 0.95 * F(z));
    const laneX = (lane, z) => cxAt(z) + (lane - 1) * gapAt(z);
    const scaleAt = z => 0.06 + 0.94 * F(z);
    const ZS = Array.from({ length: 21 }, (_, i) => 1 - i * (1.17 / 20));

    // ---------- state ----------
    let st = null, running = false, last = 0, raf = 0;
    function newState(cat, qs) {
        const c = CLASSES.find(x => x.k === cat) || CLASSES[1];
        return { cat, qs, gate: 0, ok: 0, coins: 0, lane: 1, jumping: false, jumpT: 0, stumbleT: 0, speed: c.speed, base: c.speed, objs: [], t: 0, spawnT: 1.2, gateT: 20.0, ground: 0, active: null, ended: false, endT: 9e9, best: 0, streak: 0, frame: 0, frameT: 0, dustT: 0, sliding: false, slideT: 0 };
    }
    function placeHero() { if (!st) return; const h = $('hero'); if (h) h.style.left = laneX(st.lane, 0) + 'px'; }
    const setProg = () => { const f = $('prog-fill'); if (f && st && st.qs) f.style.width = (st.gate / st.qs.length * 100) + '%'; };

    // ---------- spawning ----------
    function spawn(dt) {
        if (!st || !st.qs) return;
        const n = st.qs.length;
        if (st.ended || (st.gate >= n && !st.active)) return;
        st.spawnT -= dt;
        if (!st.active) st.gateT -= dt;
        if (!st.active && st.gate < n && st.gateT <= 0) {
            const item = st.qs[st.gate];
            const friend = FRIENDS[st.gate % FRIENDS.length].id;
            item.friend = friend;
            st.active = { type: 'gate', z: 1.02, item, done: false, friend }; st.objs.push(st.active);
            showQuestion(item, friend); st.gateT = 20.0; st.spawnT = 2.0;
            return;
        }
        if (st.spawnT <= 0 && st.gateT > 1.8 && st.gate < n) {
            const r = Math.random(), lane = Math.floor(Math.random() * LANES);
            if (r < 0.38) for (let i = 0; i < 3; i++) st.objs.push({ type: 'coin', lane, z: 1.02 + i * 0.07 });
            else if (r < 0.65) st.objs.push({ type: 'low', lane, z: 1.02 });
            else if (r < 0.85) st.objs.push({ type: 'high', lane, z: 1.02 });
            else st.objs.push({ type: 'cheerer', side: Math.random() > 0.5 ? 1 : -1, z: 1.02, friend: FRIENDS[Math.floor(Math.random() * FRIENDS.length)].id });
            st.spawnT = 1.1 + Math.random() * 0.6;
        }
    }
    function showQuestion(item, friendId) {
        if (!item || !item.q) return;
        const q = item.q, f = friendById(friendId);
        const qtxt = $('q-text'); if (qtxt) qtxt.innerHTML = esc(q.question);
        const from = $('q-from'); if (from) from.textContent = f.name + ' بيسألك:';
        const qfr = $('q-friend');
        if (qfr) { const url = friendDataUrl(f.id); if (url) { qfr.src = url; qfr.style.display = 'block'; } else qfr.style.display = 'none'; }
        const im = $('q-img'); if (im) { if (q.image && window.KidsTheme) { im.innerHTML = KidsTheme.richHtml(q.image, 80); im.classList.remove('hidden'); } else { im.innerHTML = ''; im.classList.add('hidden'); } }
        const qc = $('qcard'); if (qc) qc.classList.remove('hidden');
        const lbls = $('labels'); if (lbls && item.answers) lbls.innerHTML = item.answers.map((a, i) => '<div class="r-lane-label' + (isLatin(a) ? ' latin' : '') + '" data-lane="' + i + '">' + esc(a) + '</div>').join('');
        play('pop');
        readQuestion(item);
    }
    const readQuestion = item => { if (item && item.q) say(friendById(item.friend).name + ' بيسألك: ' + item.q.question + '. شمال: ' + (item.answers[0] || '') + '. في النص: ' + (item.answers[1] || '') + '. يمين: ' + (item.answers[2] || '')); };

    // ---------- underwater life: bubbles, fish schools, big fish, the shark ----------
    // every particle has a kind, a layer (back: behind the hero, front: over him) and a life in seconds
    let parts = [], bubT = 0, ventT = 2, schoolT = 3, bigT = 5, sharkT = 14, sharkCount = 0;
    const MAX_PARTS = 340;
    function bubble(n, x, y, layer) {
        for (let i = 0; i < n; i++) {
            const vy = -(35 + Math.random() * 55);
            parts.push({ kind: 'bubble', layer: layer || 'back', x: x + rnd(-16, 16), y: y + rnd(-10, 10), vx: rnd(-8, 8), vy, wob: Math.random() * 6.28, age: 0, life: 1.8 + Math.random() * 1.6, max: 3.4, r: 2.5 + Math.random() * 6 });
        }
    }
    function sparkle(x, y) {
        for (let i = 0; i < 9; i++) { const a = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 90; parts.push({ kind: 'spark', layer: 'front', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, gr: 240, age: 0, life: 0.55, max: 0.55, r: 2 + Math.random() * 2.5, col: '#f4cd5c' }); }
        parts.push({ kind: 'text', layer: 'front', x, y: y - 8, vx: 0, vy: -75, age: 0, life: 0.75, max: 0.75, text: '+' + AR(1) });
    }
    const FISH_COLS = [['#ff9a3c', '#e07a1f', true], ['#ffd23f', '#e0b020', false], ['#4cc9f0', '#2a9fd0', false], ['#ff7eb6', '#e0559a', false], ['#9b8cff', '#7466e0', false], ['#5ee6a8', '#2fbf80', false]];
    function addFish(o) {
        const dir = o.dir || (Math.random() > 0.5 ? 1 : -1), r = o.r, col = o.col || FISH_COLS[Math.floor(Math.random() * FISH_COLS.length)];
        const vx = dir * o.speed, x = dir > 0 ? -r * 2 - (o.off || 0) : W + r * 2 + (o.off || 0);
        parts.push({ kind: 'fish', layer: o.layer || 'back', x, y: o.y, vx, vy: rnd(-5, 5), dir, r, col: col[0], col2: col[1], stripes: col[2], wob: Math.random() * 6.28, age: 0, life: (W + r * 4 + (o.off || 0)) / o.speed + 0.5, max: 9e9 });
    }
    function addShark() {
        const dir = Math.random() > 0.5 ? 1 : -1, L = W * rnd(0.34, 0.44), speed = rnd(48, 70);
        const y = rnd(H * 0.14, H * 0.46);
        parts.push({ kind: 'shark', layer: 'back', x: dir > 0 ? -L : W + L, y, vx: dir * speed, vy: rnd(-4, 4), dir, L, wob: Math.random() * 6.28, age: 0, life: (W + L * 2) / speed + 0.5, max: 9e9 });
        sharkCount++;
    }
    function updateScenery(dt) {
        // a steady drizzle of bubbles rising from the sea floor across the whole screen
        bubT += dt * 6;
        while (bubT >= 1) {
            bubT -= 1;
            const vy = -(30 + Math.random() * 55), big = Math.random() < 0.12;
            parts.push({ kind: 'bubble', layer: Math.random() < 0.72 ? 'back' : 'front', x: Math.random() * W, y: H + 8, vx: 0, vy, wob: Math.random() * 6.28, age: 0, life: (H + 30) / -vy, max: (H + 30) / -vy, r: big ? 7 + Math.random() * 6 : 1.5 + Math.random() * 4.5, slow: true });
        }
        // bubble vents: a column of bubbles from one spot on the sea floor
        ventT -= dt;
        if (ventT <= 0) {
            ventT = rnd(1.6, 3.2);
            const x = Math.random() * W, vy = -(45 + Math.random() * 30);
            for (let i = 0; i < 7; i++) parts.push({ kind: 'bubble', layer: 'back', x: x + rnd(-6, 6), y: H + 6 + i * 22, vx: 0, vy, wob: Math.random() * 6.28, age: 0, life: (H + 30 + i * 22) / -vy, max: (H + 30) / -vy, r: 2 + Math.random() * 4, slow: true });
        }
        // schools of small fish crossing the water above the road
        schoolT -= dt;
        if (schoolT <= 0) {
            schoolT = rnd(4.5, 8);
            const n = 4 + Math.floor(Math.random() * 4), dir = Math.random() > 0.5 ? 1 : -1, y = rnd(H * 0.05, horizonY + H * 0.1), speed = rnd(42, 70), col = FISH_COLS[Math.floor(Math.random() * FISH_COLS.length)];
            for (let i = 0; i < n; i++) addFish({ dir, y: y + rnd(-H * 0.05, H * 0.05), r: rnd(7, 11), speed: speed + rnd(-4, 4), off: i * rnd(18, 34), col, layer: 'back' });
        }
        // a big fish now and then, some of them swimming right past the hero
        bigT -= dt;
        if (bigT <= 0) {
            bigT = rnd(5, 9);
            const near = Math.random() < 0.45;
            addFish(near ? { y: rnd(feetY - H * 0.22, feetY + H * 0.04), r: rnd(26, 36), speed: rnd(70, 105), layer: 'front' } : { y: rnd(H * 0.08, horizonY + H * 0.14), r: rnd(18, 28), speed: rnd(50, 80), layer: 'back' });
        }
        // the friendly shark visits every half minute or so
        sharkT -= dt;
        if (sharkT <= 0) { sharkT = rnd(26, 42); addShark(); }

        for (const p of parts) {
            p.age += dt; p.life -= dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.gr) p.vy += p.gr * dt;
            if (p.kind === 'bubble') { p.x += Math.sin(p.wob + p.age * (p.slow ? 2.2 : 3.5)) * (p.slow ? 14 : 10) * dt; if (p.slow) p.vy -= 6 * dt; }
            else if (p.kind === 'fish') p.y += Math.sin(p.wob + p.age * 1.6) * 9 * dt;
            else if (p.kind === 'shark') p.y += Math.sin(p.wob + p.age * 0.9) * 6 * dt;
        }
        parts = parts.filter(p => p.life > 0 && p.y > -40);
        if (parts.length > MAX_PARTS) { let drop = parts.length - MAX_PARTS; parts = parts.filter(p => { if (drop > 0 && p.kind === 'bubble') { drop--; return false; } return true; }); }
    }

    // ---------- update ----------
    function update(dt) {
        if (!st) return;
        st.t += dt;
        let mult = st.stumbleT > 0 ? 0.35 : 1;
        if (st.active && st.active.type === 'gate' && st.active.z <= 1.0) mult *= 0.15;
        if (st.stumbleT > 0) st.stumbleT -= dt;
        if (st.jumping) { st.jumpT -= dt; if (st.jumpT <= 0) { st.jumping = false; const h = $('hero'); if (h) h.classList.remove('jump'); bubble(7, laneX(st.lane, 0), feetY - 2, 'front'); heroFrame(); } }
        if (st.sliding) { st.slideT -= dt; if (st.slideT <= 0) { st.sliding = false; const h = $('hero'); if (h) h.classList.remove('slide'); bubble(5, laneX(st.lane, 0), feetY - 2, 'front'); heroFrame(); } }
        camX += (-(st.lane - 1) * W * 0.07 - camX) * Math.min(1, dt * 7);
        const v = st.speed * mult;
        st.ground = (st.ground + v * dt) % 1;
        spawn(dt);

        const nearGate = st.active && st.active.type === 'gate' && st.active.z < 0.75;
        const heroEl = $('hero');
        if (heroEl) {
            if (nearGate) {
                if (!heroEl.classList.contains('stand')) { heroEl.classList.remove('swimming', 'run'); heroEl.classList.add('stand'); }
            } else if (!heroEl.classList.contains('swimming')) { heroEl.classList.remove('stand'); heroEl.classList.add('swimming', 'run'); }
        }
        // the hero breathes out a trail of bubbles while swimming
        if (Math.random() < dt * (nearGate ? 2 : 7)) bubble(1, laneX(st.lane, 0) + rnd(-18, 18), feetY - rnd(30, 90), 'front');

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
                if (o.type === 'coin') { st.coins++; play('star'); const sc = $('st-coins'); if (sc) sc.textContent = AR(st.coins); sparkle(laneX(o.lane, 0.03), yAt(0.03) - gapAt(0.03) * 0.3); }
                else if (o.type === 'low' && !st.jumping) stumble();
                else if (o.type === 'high' && !st.sliding) stumble();
                else if (o.type === 'low' || o.type === 'high') play('star');
            }
        }
        st.objs = st.objs.filter(o => o.z > -0.17 && !(o.type === 'coin' && o.hit));
        if (st.gate >= st.qs.length && !st.active && !st.ended) { st.ended = true; st.objs.push({ type: 'finish', z: 0.95 }); }
        if (st.ended) { st.endT -= dt; if (st.endT <= 0) finish(); }
        if (!st.jumping) { st.dustT -= dt; if (st.dustT <= 0) { st.dustT = st.stumbleT > 0 ? 0.2 : 0.14; bubble(1, laneX(st.lane, 0), feetY - 2, 'back'); } }
        updateScenery(dt);
        if (st.frameT !== undefined) { st.frameT += dt; if (st.frameT > 0.12) { st.frameT = 0; const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero'; const framesCount = (spriteList && spriteList.has(pre + '-back-4.png')) ? 4 : 2; st.frame = (st.frame + 1) % framesCount; heroFrame(); } }
    }
    function stumble() {
        if (!st) return;
        st.stumbleT = 1.1; st.coins = Math.max(0, st.coins - 2); const sc = $('st-coins'); if (sc) sc.textContent = AR(st.coins);
        play('boing'); const stage = $('stage'); if (stage) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
        const h = $('hero'); if (h) { h.classList.add('stumble'); setTimeout(() => h.classList.remove('stumble'), 650); }
        bubble(12, laneX(st.lane, 0), feetY - 30, 'front');
        toast('أوبس! 😅');
    }
    function resolveGate(o) {
        if (!st || !o || !o.item) return;
        const item = o.item, picked = item.answers[st.lane], ok = picked === item.correct;
        st.gate++; st.active = null; setProg();
        document.querySelectorAll('.r-lane-label').forEach(l => { const a = item.answers[+l.dataset.lane]; if (a === item.correct) l.classList.add('ok'); else if (+l.dataset.lane === st.lane) l.classList.add('no'); });
        if (ok) {
            st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const sok = $('st-ok'); if (sok) sok.textContent = AR(st.ok);
            if (window.KidsTheme) { KidsTheme.playWow(); KidsTheme.burst(laneX(st.lane, 0), feetY - 80, 14); }
            bubble(14, laneX(st.lane, 0), feetY - 60, 'front');
            const cheer = ['برافو', 'شاطر', 'ممتاز', 'عظيم'][Math.floor(Math.random() * 4)];
            toast(cheer + ' 🎉');
            say(cheer + ' ' + who() + '!');
            st.speed = st.base * (1 + 0.03 * st.gate);
        } else {
            st.streak = 0; play('boing'); toast('الإجابة: ' + item.correct);
            if (window.Progress) { try { Progress.addWrong(item.q, st.cat); } catch (e) {} }
            say('مش دي ' + who() + '. الإجابة الصحيحة: ' + item.correct);
        }
        setTimeout(() => { const qc = $('qcard'); if (qc) qc.classList.add('hidden'); }, 1500);
        setTimeout(() => { const lbls = $('labels'); if (lbls) lbls.innerHTML = ''; }, 1500);
    }
    function toast(text) { const el = document.createElement('div'); el.className = 'r-toast'; el.textContent = text; const stage = $('stage'); if (stage) stage.appendChild(el); setTimeout(() => el.remove(), 1300); }

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

    // ---------- far layer: plain ocean used until the scene picture has loaded ----------
    let far = null;
    function buildFar() {
        far = document.createElement('canvas'); far.width = Math.max(1, Math.round(W * dpr)); far.height = Math.max(1, Math.round(H * dpr));
        const c = far.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const ocean = c.createLinearGradient(0, 0, 0, H);
        ocean.addColorStop(0, '#0f4c75'); ocean.addColorStop(0.45, '#1a759f'); ocean.addColorStop(1, '#5cb8b2');
        c.fillStyle = ocean; c.fillRect(0, 0, W, H);
    }

    function draw() {
        g.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
        const t = st ? st.t : 0;
        // the Bikini Bottom scene fills the whole stage; the sand road is drawn over its middle
        if (bgImg) {
            const s = Math.max(W / bgImg.width, H / bgImg.height), bw = bgImg.width * s, bh = bgImg.height * s;
            const slack = (bw - W) / 2, shift = Math.max(-slack, Math.min(slack, -camX * 0.35));
            g.drawImage(bgImg, (W - bw) / 2 + shift, (H - bh) / 2, bw, bh);
        } else if (far) g.drawImage(far, 0, 0, W, H);
        drawRays(t);
        drawGround(t);
        if (st && st.active && st.active.type === 'gate') band(g, st.lane - 1.46, st.lane - 0.54, 'rgba(255,235,150,' + (0.28 + 0.1 * Math.sin(t * 6)).toFixed(3) + ')', yAt, Math.min(1, st.active.z));

        const fog = g.createLinearGradient(0, horizonY - H * 0.08, 0, horizonY + H * 0.06);
        fog.addColorStop(0, 'rgba(20,90,125,0)'); fog.addColorStop(0.6, 'rgba(20,90,125,0.4)'); fog.addColorStop(1, 'rgba(20,90,125,0)');
        g.fillStyle = fog; g.fillRect(0, horizonY - H * 0.08, W, H * 0.14);

        drawParts(g, 'back');
        if (st) {
            const objs = st.objs.slice().sort((a, b) => b.z - a.z);
            for (const o of objs) drawObj(o.z < 0 ? gf : g, o);
        }
        drawParts(gf, 'front');
        placeLabels();
    }

    // sunlight shafts drifting down from the surface
    function drawRays(t) {
        const bottom = horizonY + H * 0.12;
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
            const x0 = W * (0.08 + i * 0.21) + Math.sin(t * 0.25 + i * 1.7) * W * 0.05, wTop = W * 0.05, wBot = W * (0.14 + 0.04 * Math.sin(t * 0.4 + i));
            const a = 0.05 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 2.1));
            const gr = g.createLinearGradient(0, 0, 0, bottom); gr.addColorStop(0, 'rgba(255,255,225,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,225,0)');
            g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - wTop, 0); g.lineTo(x0 + wTop, 0); g.lineTo(x0 + wBot + W * 0.06, bottom); g.lineTo(x0 - wBot + W * 0.06, bottom); g.closePath(); g.fill();
        }
        g.restore();
    }

    function drawGround(t) {
        // the sand road: a wide band in perspective, the scene stays visible on both sides
        band(g, -2.05, 2.05, 'rgba(70,110,120,0.28)');
        const sand = g.createLinearGradient(0, horizonY, 0, H);
        sand.addColorStop(0, '#a8b8a0'); sand.addColorStop(0.35, '#dfc99c'); sand.addColorStop(1, '#d1b37a');
        band(g, -1.85, 1.85, sand);
        // ripples in the sand
        g.strokeStyle = 'rgba(255,255,255,0.14)';
        eachStep(12, z => {
            const y = yAt(z), cx = cxAt(z), e = 1.8 * gapAt(z), ed = 1.85 * gapAt(z);
            g.lineWidth = Math.max(0.6, 2 * scaleAt(z));
            g.beginPath(); g.moveTo(cx - ed, y); g.lineTo(cx - e, y); g.moveTo(cx + e, y); g.lineTo(cx + ed, y); g.stroke();
        });
        // caustic light dancing on the sand
        eachStep(5, (z, k) => {
            const gp = gapAt(z), y = yAt(z), cx = cxAt(z), sway = Math.sin(t * 1.2 + k * 1.3) * gp * 0.2;
            g.fillStyle = 'rgba(255,255,240,' + (0.06 + 0.05 * Math.sin(t * 2 + k)).toFixed(3) + ')';
            g.beginPath(); g.ellipse(cx + ((k % 3) - 1) * gp * 0.7 + sway, y, gp * 0.42, gp * 0.09, 0, 0, Math.PI * 2); g.fill();
        });
        // lane lines
        for (let l = 0; l <= LANES; l++) { const o = l - 1.5; band(g, o - 0.02, o + 0.02, 'rgba(255,255,255,0.22)'); }
        // seaweed swaying along both edges of the road
        eachStep(4, (z, k) => {
            const gp = gapAt(z), y = yAt(z), cx = cxAt(z);
            if (gp < 4) return;
            for (const sd of [-1, 1]) {
                const x = cx + sd * gp * 2.0, hgt = gp * (0.7 + ((k * 7 + (sd + 1) * 3) % 5) / 8), sway = Math.sin(t * 1.6 + k * 0.9 + sd) * gp * 0.16;
                g.strokeStyle = sd > 0 ? 'rgba(52,150,88,0.9)' : 'rgba(70,165,95,0.9)'; g.lineWidth = Math.max(1, gp * 0.07); g.lineCap = 'round';
                for (let s = -1; s <= 1; s++) {
                    g.beginPath(); g.moveTo(x + s * gp * 0.1, y);
                    g.quadraticCurveTo(x + s * gp * 0.2 + sway, y - hgt * 0.55, x + s * gp * 0.28 + sway * 1.6, y - hgt);
                    g.stroke();
                }
            }
        });
    }

    function drawObj(c, o) {
        if (!o) return;
        const a = Math.max(0, Math.min(1, (1.02 - o.z) / 0.2)); if (a <= 0) return;
        c.globalAlpha = a;
        if (o.type === 'gate') drawFriendGate(c, cxAt(o.z), yAt(o.z), scaleAt(o.z), o.friend, o.z);
        else if (o.type === 'finish') drawFinish(c, o.z);
        else if (o.type === 'cheerer') {
            const x = cxAt(o.z) + o.side * gapAt(o.z) * 1.7, y = yAt(o.z), s = scaleAt(o.z);
            const im = friendImage(o.friend); if (!im) { c.globalAlpha = 1; return; }
            const w = W * 0.28 * s, h = w * im.height / im.width, bob = Math.sin((st ? st.t : 0) * 3 + o.z * 12) * h * 0.03;
            shadow(c, x, y, w * 0.4);
            c.save();
            if (o.side > 0) { c.translate(x, y - bob); c.scale(-1, 1); c.drawImage(im, -w / 2, -h, w, h); }
            else c.drawImage(im, x - w / 2, y - h - bob, w, h);
            c.restore();
        }
        else {
            const x = laneX(o.lane, o.z), y = yAt(o.z), gp = gapAt(o.z);
            if (o.type === 'coin') drawCoin(c, x, y, gp, (st ? st.t : 0) * 5 + o.z * 25);
            else if (o.type === 'low') drawRock(c, x, y, gp);
            else if (o.type === 'high') drawJelly(c, x, y, gp);
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

    // a rock on the sea floor with a little starfish on it: jump over it
    function drawRock(c, x, y, gp) {
        const w = gp * 0.9, h = w * 0.5;
        shadow(c, x, y, w * 0.6);
        c.fillStyle = '#6e8a86'; c.beginPath(); c.ellipse(x, y - h * 0.35, w * 0.48, h * 0.55, 0, Math.PI, 0); c.lineTo(x + w * 0.48, y); c.lineTo(x - w * 0.48, y); c.closePath(); c.fill();
        c.fillStyle = '#89a49f'; c.beginPath(); c.ellipse(x - w * 0.1, y - h * 0.55, w * 0.25, h * 0.22, -0.3, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#4c655f'; c.lineWidth = Math.max(1, w * 0.035); c.beginPath(); c.ellipse(x, y - h * 0.35, w * 0.48, h * 0.55, 0, Math.PI, 0); c.stroke();
        // starfish
        const sx = x + w * 0.2, sy = y - h * 0.75, sr = w * 0.16;
        c.fillStyle = '#ff9a5c'; c.beginPath();
        for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? sr * 0.45 : sr; c.lineTo(sx + Math.cos(ang) * rad, sy + Math.sin(ang) * rad * 0.8); }
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); circle(c, sx, sy, sr * 0.15); c.fill();
    }

    // a jellyfish floating over the lane: duck under it
    function drawJelly(c, x, y, gp) {
        const w = gp * 0.95, h = w * 1.6, t = st ? st.t : 0, bob = Math.sin(t * 2 + x * 0.01) * w * 0.06;
        shadow(c, x, y, w * 0.45);
        const cy = y - h + w * 0.45 + bob;
        c.strokeStyle = 'rgba(245,150,195,0.85)'; c.lineWidth = Math.max(1, w * 0.05); c.lineCap = 'round';
        for (let i = -2; i <= 2; i++) {
            const sx = x + i * w * 0.16, wob = Math.sin(t * 3 + i) * w * 0.1;
            c.beginPath(); c.moveTo(sx, cy + w * 0.22); c.quadraticCurveTo(sx + wob, cy + w * 0.55, sx - wob, cy + h * 0.5); c.stroke();
        }
        const gr = c.createRadialGradient(x - w * 0.15, cy - w * 0.18, w * 0.05, x, cy, w * 0.52);
        gr.addColorStop(0, 'rgba(255,228,242,0.97)'); gr.addColorStop(1, 'rgba(236,110,165,0.92)');
        c.fillStyle = gr; c.beginPath(); c.arc(x, cy, w * 0.5, Math.PI, 0);
        c.quadraticCurveTo(x + w * 0.3, cy + w * 0.3, x, cy + w * 0.26); c.quadraticCurveTo(x - w * 0.3, cy + w * 0.3, x - w * 0.5, cy); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 4; i++) { c.beginPath(); circle(c, x - w * 0.3 + i * w * 0.2, cy - w * (i % 2 ? 0.3 : 0.18), w * 0.05); c.fill(); }
        for (const sd of [-1, 1]) {
            c.fillStyle = '#fff'; c.beginPath(); circle(c, x + sd * w * 0.14, cy + w * 0.02, w * 0.08); c.fill();
            c.fillStyle = '#2b3542'; c.beginPath(); circle(c, x + sd * w * 0.14 + sd * w * 0.02, cy + w * 0.03, w * 0.04); c.fill();
        }
        c.strokeStyle = 'rgba(120,40,80,0.5)'; c.lineWidth = Math.max(1, w * 0.03); c.beginPath(); c.arc(x, cy + w * 0.1, w * 0.07, 0.2, Math.PI - 0.2); c.stroke();
    }

    function drawFriendGate(c, cx, y, s, friendId, z) {
        const im = friendImage(friendId), w = W * 0.45 * s, h = im ? w * im.height / im.width : w * 1.2;
        const bob = Math.sin((st ? st.t : 0) * 2.5) * h * 0.025;
        shadow(c, cx, y, w * 0.5);
        if (im) c.drawImage(im, cx - w / 2, y - h - bob, w, h);
        else { c.fillStyle = '#ffcc00'; rr(c, cx - w / 2, y - h, w, h, w * 0.2); c.fill(); }
        const gap = z !== undefined ? gapAt(z) : W * 0.31;
        for (let l = 0; l < LANES; l++) {
            const lx = cx + (l - 1) * Math.max(gap, W * 0.31), br = w * 0.35;
            c.fillStyle = 'rgba(255,255,255,0.75)';
            c.beginPath(); circle(c, lx, y - br * 1.5, br); c.fill();
            c.strokeStyle = 'rgba(100,200,255,0.9)'; c.lineWidth = Math.max(1, br * 0.1); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); circle(c, lx - br * 0.3, y - br * 1.5 - br * 0.3, br * 0.2); c.fill();
        }
    }

    // the finish: a chequered banner on two wooden posts with bunting
    function drawFinish(c, z) {
        const y = yAt(z), gp = gapAt(z), cx = cxAt(z), half = 1.6 * gp, top = y - gp * 2.3, bh = gp * 0.42, pw = Math.max(1.5, gp * 0.07);
        c.fillStyle = '#8a5a33'; c.fillRect(cx - half - pw / 2, top, pw, y - top); c.fillRect(cx + half - pw / 2, top, pw, y - top);
        const cols = 16, cw = half * 2 / cols;
        for (let row = 0; row < 2; row++) for (let i = 0; i < cols; i++) { c.fillStyle = (i + row) % 2 ? '#3d434a' : '#f5f2ea'; c.fillRect(cx - half + i * cw, top + row * bh / 2, cw + 0.5, bh / 2 + 0.5); }
        const flags = ['#ff9a5c', '#4cc9f0', '#ffd23f', '#ff7eb6', '#5ee6a8'];
        for (let i = 0; i < 8; i++) { const fx = cx - half + (i + 0.5) * half * 2 / 8, sag = Math.sin(i / 7 * Math.PI) * gp * 0.12; c.fillStyle = flags[i % flags.length]; c.beginPath(); c.moveTo(fx - gp * 0.09, top + bh + sag); c.lineTo(fx + gp * 0.09, top + bh + sag); c.lineTo(fx, top + bh + sag + gp * 0.22); c.closePath(); c.fill(); }
    }

    function drawFish(c, p) {
        const r = p.r, wag = Math.sin(p.age * 7 + p.wob) * 0.35;
        c.save(); c.translate(p.x, p.y); c.scale(p.dir, 1);
        c.fillStyle = p.col2;
        c.beginPath(); c.moveTo(-r * 0.75, 0); c.lineTo(-r * 1.45, -r * 0.55 + wag * r * 0.3); c.lineTo(-r * 1.45, r * 0.55 + wag * r * 0.3); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-r * 0.4, -r * 0.45); c.quadraticCurveTo(0, -r * 1.05, r * 0.35, -r * 0.45); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-r * 0.1, r * 0.4); c.lineTo(-r * 0.4, r * 0.85 - wag * r * 0.2); c.lineTo(r * 0.25, r * 0.45); c.closePath(); c.fill();
        c.fillStyle = p.col; c.beginPath(); c.ellipse(0, 0, r, r * 0.58, 0, 0, Math.PI * 2); c.fill();
        if (p.stripes) { c.save(); c.beginPath(); c.ellipse(0, 0, r, r * 0.58, 0, 0, Math.PI * 2); c.clip(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-r * 0.15, -r, r * 0.2, r * 2); c.fillRect(r * 0.42, -r, r * 0.16, r * 2); c.restore(); }
        c.fillStyle = 'rgba(255,255,255,0.2)'; c.beginPath(); c.ellipse(-r * 0.1, r * 0.2, r * 0.6, r * 0.22, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); circle(c, r * 0.55, -r * 0.14, r * 0.17); c.fill();
        c.fillStyle = '#1e2a36'; c.beginPath(); circle(c, r * 0.6, -r * 0.14, r * 0.09); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.arc(r * 0.8, r * 0.1, r * 0.12, 0.2, 1.6); c.stroke();
        c.restore();
    }

    // a big friendly shark with a smile, not a scary one
    function drawShark(c, p) {
        const L = p.L, wag = Math.sin(p.age * 4 + p.wob) * 0.22, grey = '#7d93a8', dark = '#5f7488';
        c.save(); c.translate(p.x, p.y); c.scale(p.dir, 1);
        c.fillStyle = dark;
        c.beginPath(); c.moveTo(-L * 0.42, 0); c.lineTo(-L * 0.6, -L * 0.3 + wag * L * 0.2); c.lineTo(-L * 0.5, -L * 0.02); c.lineTo(-L * 0.58, L * 0.2 + wag * L * 0.2); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-L * 0.12, -L * 0.16); c.quadraticCurveTo(-L * 0.02, -L * 0.5, L * 0.12, -L * 0.42); c.lineTo(L * 0.18, -L * 0.16); c.closePath(); c.fill();
        c.fillStyle = grey;
        c.beginPath(); c.moveTo(L * 0.5, 0); c.quadraticCurveTo(L * 0.3, -L * 0.24, -L * 0.1, -L * 0.2); c.quadraticCurveTo(-L * 0.35, -L * 0.14, -L * 0.46, 0); c.quadraticCurveTo(-L * 0.35, L * 0.14, -L * 0.1, L * 0.2); c.quadraticCurveTo(L * 0.3, L * 0.24, L * 0.5, 0); c.closePath(); c.fill();
        c.save(); c.clip(); c.fillStyle = '#e6eef4'; c.beginPath(); c.ellipse(L * 0.02, L * 0.14, L * 0.46, L * 0.13, 0, 0, Math.PI * 2); c.fill(); c.restore();
        c.fillStyle = dark; c.beginPath(); c.moveTo(L * 0.05, L * 0.08); c.lineTo(-L * 0.12, L * 0.32); c.lineTo(-L * 0.18, L * 0.1); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(40,60,80,0.35)'; c.lineWidth = Math.max(1, L * 0.012);
        for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(L * (0.18 - i * 0.05), -L * 0.02, L * 0.07, -1.1, 1.1); c.stroke(); }
        c.fillStyle = '#fff'; c.beginPath(); circle(c, L * 0.33, -L * 0.07, L * 0.045); c.fill();
        c.fillStyle = '#1e2a36'; c.beginPath(); circle(c, L * 0.345, -L * 0.07, L * 0.024); c.fill();
        c.strokeStyle = 'rgba(40,60,80,0.5)'; c.lineWidth = Math.max(1, L * 0.014); c.beginPath(); c.arc(L * 0.36, L * 0.04, L * 0.1, 0.25, 1.35); c.stroke();
        c.restore();
    }

    function drawParts(c, layer) {
        for (const p of parts) {
            if (p.layer !== layer) continue;
            let a = p.max > 1e8 ? 1 : p.life / p.max;
            if (p.kind === 'fish' || p.kind === 'shark') a = Math.min(1, p.age * 2, p.life * 2);
            c.globalAlpha = Math.max(0, Math.min(1, a));
            if (p.kind === 'text') {
                c.font = '900 22px Cairo, sans-serif'; c.textAlign = 'center'; c.lineWidth = 5;
                c.strokeStyle = '#fff'; c.strokeText(p.text, p.x, p.y);
                c.fillStyle = '#d99a25'; c.fillText(p.text, p.x, p.y);
            } else if (p.kind === 'fish') drawFish(c, p);
            else if (p.kind === 'shark') drawShark(c, p);
            else if (p.kind === 'bubble') {
                c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.1;
                c.fillStyle = 'rgba(200,240,255,0.22)';
                c.beginPath(); circle(c, p.x, p.y, p.r); c.fill(); c.stroke();
                c.fillStyle = 'rgba(255,255,255,0.7)';
                c.beginPath(); circle(c, p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.25); c.fill();
            } else {
                c.fillStyle = p.col; c.beginPath(); circle(c, p.x, p.y, p.r * (0.4 + 0.6 * a)); c.fill();
            }
        }
        c.globalAlpha = 1;
    }

    function placeLabels() {
        if (!st) return;
        const o = st.active; const labels = document.querySelectorAll('.r-lane-label');
        if (!o || o.type !== 'gate' || !labels.length) return;
        const s = scaleAt(o.z), y = yAt(o.z), cx = cxAt(o.z);
        const qcard = $('qcard');
        const qRect = qcard && !qcard.classList.contains('hidden') ? qcard.getBoundingClientRect() : null;
        const minTop = qRect ? (qRect.bottom + 8) : 130;
        const fw = W * 0.45 * s, br = fw * 0.4;
        const top = Math.max(y - br * 1.5, minTop);
        const lg = Math.max(gapAt(o.z), W * 0.31);
        labels.forEach(l => {
            const lane = +l.dataset.lane;
            l.style.left = (cx + (lane - 1) * lg) + 'px';
            l.style.top = top + 'px';
            l.style.fontSize = Math.max(0.65, Math.min(1.1, 0.4 + 0.8 * s)) + 'em';
            l.style.opacity = o.z > 0.98 ? 0 : 1;
            l.classList.toggle('cur', lane === st.lane);
        });
    }

    // ---------- hero ----------
    function heroFrame() {
        const pre = girl() && spriteList && spriteList.has('run-heroine-back-1.png') ? 'run-heroine' : 'run-hero';
        const f1 = sprite(pre + '-back-1'), f2 = sprite(pre + '-back-2'), f3 = sprite(pre + '-back-3'), f4 = sprite(pre + '-back-4'), fj = sprite(pre + '-jump');
        const has4 = spriteList && spriteList.has(pre + '-back-4.png');
        const svg = $('hero-svg');
        if (!f1 || !f2 || (has4 && (!f3 || !f4))) { if (svg) svg.style.display = 'block'; return; }
        if (svg) svg.style.display = 'none';
        const h1 = $('hero-f1'), h2 = $('hero-f2'), h3 = $('hero-f3'), h4 = $('hero-f4'), hj = $('hero-fj');
        if (f1 && h1) h1.src = f1.src;
        if (f2 && h2) h2.src = f2.src;
        if (f3 && h3) h3.src = f3.src;
        if (f4 && h4) h4.src = f4.src;
        if (fj && hj) hj.src = fj.src;
        if (h1) h1.classList.toggle('on', !st.jumping && st.frame === 0);
        if (h2) h2.classList.toggle('on', !st.jumping && st.frame === 1);
        if (h3) h3.classList.toggle('on', !st.jumping && st.frame === 2);
        if (h4) h4.classList.toggle('on', !st.jumping && st.frame === 3);
        if (hj) hj.classList.toggle('on', st.jumping && !!fj);
        if (st.jumping && !fj && h1) h1.classList.add('on');
    }

    let leanTimer = 0;
    function move(dir) {
        if (!running || !st) return; const l = Math.max(0, Math.min(LANES - 1, st.lane + dir)); if (l === st.lane) return;
        st.lane = l; placeHero(); play('click');
        bubble(4, laneX(st.lane, 0) - dir * 20, feetY - 40, 'front');
        const h = $('hero'); if (h) { h.classList.remove('lean-l', 'lean-r'); h.classList.add(dir < 0 ? 'lean-l' : 'lean-r'); }
        clearTimeout(leanTimer); leanTimer = setTimeout(() => { if (h) h.classList.remove('lean-l', 'lean-r'); }, 200);
    }
    function jump() { if (!running || !st || st.jumping) return; st.jumping = true; st.jumpT = 0.62; const h = $('hero'); if (h) { h.classList.remove('jump'); void h.offsetWidth; h.classList.add('jump'); } play('whoosh'); heroFrame(); }
    function slide() { if (!running || !st || st.jumping || st.sliding) return; st.sliding = true; st.slideT = 0.72; const h = $('hero'); if (h) { h.classList.remove('slide'); void h.offsetWidth; h.classList.add('slide'); } play('whoosh'); heroFrame(); }

    const bl = $('btn-left'), br = $('btn-right'), bj = $('btn-jump'), bs = $('btn-slide');
    if (bl) bl.onclick = () => move(-1);
    if (br) br.onclick = () => move(1);
    if (bj) bj.onclick = jump;
    if (bs) bs.onclick = slide;

    document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); jump(); } else if (e.key === 'ArrowDown') { e.preventDefault(); slide(); } });
    let touch = null;
    const stageEl = $('stage');
    if (stageEl) {
        stageEl.addEventListener('pointerdown', e => { if (e.target.closest('button, a, .r-over')) return; touch = { x: e.clientX, y: e.clientY, t: Date.now() }; });
        stageEl.addEventListener('pointerup', e => {
            if (!touch) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
            if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
            else if (dy < -30) jump();
            else if (dy > 30) slide();
            else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) { const f = e.clientX / W; if (f < 0.33) move(-1); else if (f > 0.67) move(1); else jump(); }
        });
    }

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
        const sc = $('start-class');
        if (sc) {
            sc.innerHTML = CLASSES.map(c => '<button type="button" class="' + (c.k === cat ? 'on' : '') + '" data-k="' + c.k + '">' + c.ic + ' ' + c.name + '</button>').join('');
            sc.querySelectorAll('button').forEach(b => b.onclick = () => { localStorage.setItem('kids_class', b.dataset.k); play('pop'); renderClass(); });
        }
    }
    async function start() {
        pickBg();
        const cat = classKey(); if (!cat) { play('boing'); if (window.UI) UI.toast('اختر صفّك أولاً يا بطل', { type: 'warn' }); return; }
        let items; try { items = await loadBank(cat); } catch (e) { if (window.UI) UI.toast('تعذر تحميل الأسئلة، تأكد من الإنترنت ثم حاول مرة أخرى', { type: 'warn' }); return; }
        const qs = pickQuestions(cat, items, GATES);
        if (qs.length < 3) { if (window.UI) UI.toast('أسئلة هذا الصف طويلة على السباق، جرّب صفاً آخر', { type: 'warn' }); return; }
        st = newState(cat, qs); camX = 0; parts = []; bubT = 0; ventT = 1; schoolT = 2; bigT = 4; sharkT = 14;
        const tot = $('st-total'), sok = $('st-ok'), scn = $('st-coins');
        if (tot) tot.textContent = AR(st.qs.length); if (sok) sok.textContent = '٠'; if (scn) scn.textContent = '٠'; setProg();
        const sEl = $('start'), dEl = $('done'), qEl = $('qcard'), lEl = $('labels');
        if (sEl) sEl.classList.add('hidden'); if (dEl) dEl.classList.add('hidden'); if (qEl) qEl.classList.add('hidden'); if (lEl) lEl.innerHTML = '';
        const heroEl = $('hero'); if (heroEl) heroEl.className = 'r-hero swimming run'; resize();
        running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
        play('go');
        say('يلا ' + who() + '! اسبح في قاع الهامور مع أصدقائك، واجاوب على أسئلتهم في الحارة الصحيحة');
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
        const dTitle = $('done-title'), dStars = $('done-stars'), dOk = $('done-ok'), dCoins = $('done-coins'), dPiggy = $('done-piggy'), dTxt = $('done-text'), doneEl = $('done');
        if (dTitle) dTitle.textContent = stars === 3 ? 'بطل قاع الهامور! 🏆' : 'وصلت نهاية المغامرة!';
        if (dStars) dStars.innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? '' : 'off') + '">★</span>').join('');
        if (dOk) dOk.textContent = AR(ok) + ' / ' + AR(n); if (dCoins) dCoins.textContent = AR(st.coins); if (dPiggy) dPiggy.textContent = window.Piggy ? Piggy.words(coins) : AR(coins) + ' قرش';
        if (dTxt) dTxt.textContent = stars === 3 ? 'ممتاز! جاوبت صح تقريباً على كل الأسئلة وأنت تسبح!' : 'برافو! جرّب تاني علشان تجمع نجوم أكتر.';
        if (doneEl) doneEl.classList.remove('hidden'); play('tada'); if (window.KidsTheme) KidsTheme.confetti(stars === 3 ? 5000 : 3000);
        say('مبروك ' + who() + '! جاوبت صح على ' + AR(ok) + ' من ' + AR(n) + '، وجمعت ' + AR(st.coins) + ' عملة، وكسبت ' + (window.Piggy ? Piggy.words(coins) : coins + ' قرش') + ' لحصالتك');
    }
    const syncSound = () => { const bs = $('btn-sound'); if (bs) bs.textContent = soundOn() ? '🔊' : '🔇'; };
    const btnS = $('btn-sound'); if (btnS) btnS.onclick = () => { localStorage.setItem('soundOn', soundOn() ? 'false' : 'true'); syncSound(); if (!soundOn() && window.speechSynthesis) speechSynthesis.cancel(); };
    syncSound();
    const pause = () => { if (!running || !st) return; running = false; if (window.speechSynthesis) speechSynthesis.cancel(); const pEl = $('pause'); if (pEl) pEl.classList.remove('hidden'); };
    const btnP = $('btn-pause'); if (btnP) btnP.onclick = pause;
    const btnRes = $('btn-resume'); if (btnRes) btnRes.onclick = () => { const pEl = $('pause'); if (pEl) pEl.classList.add('hidden'); running = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(loop); if (st.active) readQuestion(st.active.item); };
    const btnQ = $('btn-quit'); if (btnQ) btnQ.onclick = () => { location.href = 'index.html'; };
    const btnSt = $('btn-start'), btnAg = $('btn-again'), btnRd = $('btn-read');
    if (btnSt) btnSt.onclick = start; if (btnAg) btnAg.onclick = start;
    if (btnRd) btnRd.onclick = () => { if (st && st.active) readQuestion(st.active.item); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('resize', () => { resize(); if (st && !running) draw(); });
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (e) {} }

    // ---------- boot ----------
    const wPhoto = $('who-photo'), hBadge = $('hero-badge'), wName = $('who-name'), sTitle = $('start-title');
    if (wPhoto) wPhoto.src = playerPhoto(); if (hBadge) hBadge.src = playerPhoto();
    if (wName) wName.textContent = 'مغامرة ' + (playerName() || HERO()); if (sTitle) sTitle.textContent = 'مغامرة ' + (playerName() || HERO());
    renderClass(); resize();
    st = newState(classKey() || 'kids_2', []); st.gateT = 9e9; draw(); st = null;
})();
