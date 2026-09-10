// مغامرة الغابة: الطفل هو المغامر. خمس مراحل، في كل مرحلة ١٢ عقبة، وكل عقبة سؤال من بنك صفّه الدراسي.
// المشهد يُرسم بطبقات SVG متحركة (سماء، جبال، أشجار بعيدة ومتوسطة وقريبة، طريق، عقبات)، والبطل يمشي ويقفز فوق كل عقبة
// بعد الإجابة الصحيحة. الأصوات: قراءة الأسئلة والتشجيع بصوت KidsTheme، هتاف "wooow"، وأصوات بيئة خفيفة (عصافير، ماء، نحل).
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
    const readOn = () => !window.KidsTheme || KidsTheme.readEnabled();
    const play = n => { if (window.KidsTheme && soundOn()) KidsTheme.play(n); };
    const say = (text, choices) => (soundOn() && window.KidsTheme) ? KidsTheme.speak(text, choices) : Promise.resolve(false);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const HEROES = ['assets/patman.png', 'assets/superman.png', 'assets/hulkman.png', 'assets/mahmoud.png', 'assets/child.jpeg'];
    const PER_LEVEL = 12;

    // ---------- the child ----------
    const card = () => read('gbCard', null);
    const playerName = () => ((card() && card().name) || localStorage.getItem('mp_playerName') || (window.Piggy && Piggy.name()) || '').trim().slice(0, 20);
    const playerPhoto = () => (card() && (card().photo || card().avatar)) || localStorage.getItem('mp_avatar') || HEROES[0];
    const girl = () => localStorage.getItem('kids_gender') === 'girl';
    const HERO = () => girl() ? 'البطلة' : 'البطل';
    const who = () => playerName() || (girl() ? 'يا بطلة' : 'يا بطل');
    const heroTitle = () => 'مغامرة ' + (playerName() || HERO());

    // ---------- class (shared key with the home page) ----------
    const CLASSES = [{ k: 'kids_1', name: 'حضانة', ic: '🧸' }, { k: 'kids_2', name: 'ثاني ابتدائي', ic: '٢' }, { k: 'kids_3', name: 'ثالث ابتدائي', ic: '٣' }];
    const classKey = () => { const k = localStorage.getItem('kids_class') || localStorage.getItem('daily_class') || ''; return CLASSES.some(c => c.k === k) ? k : ''; };

    // ---------- small ambient synth (birds, water, bees) ----------
    let ac = null;
    const ctx = () => { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } };
    function tone(f, start, dur, type, vol, f2) {
        const c = ctx(); if (!c || !soundOn()) return;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, c.currentTime + start);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, c.currentTime + start + dur);
        g.gain.setValueAtTime(0.0001, c.currentTime + start);
        g.gain.exponentialRampToValueAtTime(vol || 0.08, c.currentTime + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
        o.connect(g).connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
    }
    function noise(start, dur, vol, lp) {
        const c = ctx(); if (!c || !soundOn()) return;
        const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = c.createBufferSource(); s.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 900;
        const g = c.createGain(); g.gain.value = vol || 0.1;
        s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + start);
    }
    const AMB = {
        birds: () => { [0, 0.16, 0.3, 0.9, 1.05].forEach((t, i) => tone(2100 + i * 150, t, 0.09, 'sine', 0.05, 2900 + i * 100)); },
        water: () => { noise(0, 0.9, 0.08, 700); noise(0.3, 0.9, 0.06, 500); },
        bees: () => { tone(190, 0, 0.7, 'sawtooth', 0.025, 230); tone(240, 0.1, 0.6, 'triangle', 0.02, 200); },
        owl: () => { tone(420, 0, 0.25, 'sine', 0.06, 380); tone(400, 0.35, 0.35, 'sine', 0.06, 340); },
        wind: () => { noise(0, 1.4, 0.05, 400); },
        step: () => { noise(0, 0.08, 0.04, 1200); },
        night: () => { [0, 0.5, 1.1].forEach(t => tone(3200, t, 0.05, 'sine', 0.02, 3400)); },
        horn: () => { tone(420, 0, 0.18, 'square', 0.03); tone(420, 0.25, 0.3, 'square', 0.03); },
        traffic: () => { noise(0, 1.2, 0.04, 300); tone(520, 0.4, 0.12, 'square', 0.015); },
        bell: () => { tone(1800, 0, 0.15, 'sine', 0.05, 1700); tone(2200, 0.18, 0.2, 'sine', 0.04, 2000); },
        meow: () => { tone(700, 0, 0.35, 'sine', 0.05, 520); },
        bark: () => { tone(300, 0, 0.1, 'sawtooth', 0.04, 180); tone(320, 0.16, 0.1, 'sawtooth', 0.04, 190); },
        whistle: () => { tone(2400, 0, 0.12, 'sine', 0.04, 2600); tone(2600, 0.16, 0.25, 'sine', 0.04, 2300); },
        market: () => { noise(0, 1, 0.03, 600); [0.1, 0.4, 0.7].forEach(t => tone(900 + Math.random() * 300, t, 0.08, 'triangle', 0.02)); }
    };
    const amb = n => { try { if (AMB[n]) AMB[n](); } catch (e) {} };

    // ---------- optional generated art: assets/sprites/manifest.json lists the PNGs that exist ----------
    let SPR = new Set();
    const spritesReady = fetch('assets/sprites/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { SPR = new Set(m && m.files || []); }).catch(() => {});
    const spr = name => SPR.has(name + '.png') ? 'assets/sprites/' + name + '.png' : null;
    // wide obstacles (1024x512 sprites) sit flat on the path, the others stand on it
    const WIDE = new Set(['mud', 'leaves', 'ice', 'river', 'stream', 'puddle', 'pond', 'flowers']);
    function obSprite(k, x) {
        const src = spr((OB[k] && OB[k].sp) || 'ob-' + k); if (!src) return null;
        return WIDE.has(k) ? '<image href="' + src + '" x="' + (x - 190) + '" y="370" width="380" height="190" preserveAspectRatio="xMidYMax meet"/>' : '<image href="' + src + '" x="' + (x - 150) + '" y="280" width="300" height="280" preserveAspectRatio="xMidYMax meet"/>';
    }
    const PET_SPRITE = { '🐇': 'rabbit', '🦆': 'duck', '🐿️': 'squirrel', '🐐': 'goat', '🐕': 'dog', '🐈': 'cat', '🕊️': 'pigeon' };

    // ---------- obstacles: how they look, what they say ----------
    // draw(x, th) returns SVG placed on the path (path centre y ≈ 540, the hero's feet at y ≈ 555)
    const em = (x, y, s, ch, cls) => '<text x="' + x + '" y="' + y + '" font-size="' + s + '" text-anchor="middle"' + (cls ? ' class="' + cls + '"' : '') + '>' + ch + '</text>';
    const OB = {
        log: { ic: '🌳', name: 'جذع شجرة', line: 'قدامك جذع شجرة كبير مقطوع وقافل الطريق!', pass: 'قفزت فوق الجذع!', amb: 'step',
            draw: (x, th) => '<rect x="' + (x - 75) + '" y="508" width="150" height="46" rx="23" fill="' + th.trunk + '"/><rect x="' + (x - 75) + '" y="512" width="150" height="14" rx="7" fill="rgba(255,255,255,0.12)"/><ellipse cx="' + (x + 75) + '" cy="531" rx="14" ry="23" fill="#c9a06a"/><ellipse cx="' + (x + 75) + '" cy="531" rx="8" ry="14" fill="none" stroke="#9c7548" stroke-width="2"/><ellipse cx="' + (x + 75) + '" cy="531" rx="3" ry="6" fill="#9c7548"/>' },
        river: { ic: '🌊', name: 'نهر صغير', line: 'قدامك نهر، والمية جارية! جاوب صح علشان تعدّي على الحجارة', pass: 'عدّيت النهر من غير ما تتبل!', amb: 'water',
            draw: x => '<path d="M' + (x - 110) + ' 500 q30 -8 60 0 t60 0 t60 0 t40 0 v78 h-220 z" fill="#5f9fc9"/><path d="M' + (x - 110) + ' 500 q30 -8 60 0 t60 0 t60 0 t40 0 v20 h-220 z" fill="#8cc4e6" opacity="0.7"/><g class="ripple" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"><path d="M' + (x - 80) + ' 530 q12 -5 24 0 t24 0"/><path d="M' + (x + 10) + ' 552 q12 -5 24 0 t24 0"/><path d="M' + (x - 40) + ' 565 q12 -5 24 0 t24 0"/></g><ellipse cx="' + (x - 40) + '" cy="545" rx="16" ry="8" fill="#8d8d86"/><ellipse cx="' + x + '" cy="538" rx="15" ry="8" fill="#9a9a92"/><ellipse cx="' + (x + 45) + '" cy="548" rx="16" ry="8" fill="#8d8d86"/>' },
        rock: { ic: '⛰️', name: 'صخرة كبيرة', line: 'صخرة كبيرة في نص الطريق! جاوب صح علشان تتسلقها', pass: 'تسلقت الصخرة زي الأبطال!', amb: 'step',
            draw: x => '<path d="M' + (x - 70) + ' 560 q-6 -50 30 -62 q30 -22 70 -6 q40 10 36 68 z" fill="#8a8f8a"/><path d="M' + (x - 40) + ' 500 q30 -22 70 -6 q14 4 22 18 q-40 -10 -92 -12 z" fill="#b5bab4"/><path d="M' + (x - 60) + ' 545 q40 -8 100 2" stroke="#6b706b" stroke-width="3" fill="none"/>' },
        mud: { ic: '🟤', name: 'بركة طين', line: 'بركة طين كبيرة! جاوب صح علشان تقفز فوقها من غير ما تتوسخ', pass: 'قفزت فوق الطين وفضلت نضيف!', amb: 'step',
            draw: x => '<ellipse cx="' + x + '" cy="545" rx="95" ry="26" fill="#5b3f2a"/><ellipse cx="' + x + '" cy="541" rx="80" ry="18" fill="#6e4d33"/><circle cx="' + (x - 30) + '" cy="540" r="5" fill="#8a6543" class="bob"/><circle cx="' + (x + 25) + '" cy="546" r="4" fill="#8a6543" class="bob"/>' },
        bees: { ic: '🐝', name: 'خلية نحل', line: 'خلية نحل فوق الطريق والنحل بيطنّ! جاوب صح وعدّي بهدوء', pass: 'عدّيت بهدوء والنحل ما حسّش بيك!', amb: 'bees',
            draw: (x, th) => '<rect x="' + (x - 4) + '" y="300" width="8" height="110" fill="' + th.trunk + '"/><path d="M' + (x - 60) + ' 320 q60 -30 120 0" stroke="' + th.trunk + '" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cx="' + x + '" cy="440" rx="34" ry="42" fill="#d6a04a"/><path d="M' + (x - 30) + ' 420 h60 M' + (x - 33) + ' 440 h66 M' + (x - 28) + ' 460 h56" stroke="#a97428" stroke-width="4"/><circle cx="' + x + '" cy="470" r="6" fill="#5e3f14"/>' + em(x - 50, 470, 22, '🐝', 'bee') + em(x + 48, 430, 22, '🐝', 'bee') + em(x + 10, 505, 20, '🐝', 'bee') },
        bridge: { ic: '🌉', name: 'جسر مكسور', line: 'الجسر الخشبي فيه لوح ناقص! جاوب صح علشان تقفز فوق الفتحة', pass: 'قفزت فوق الفتحة بشجاعة!', amb: 'step',
            draw: x => '<ellipse cx="' + x + '" cy="560" rx="120" ry="22" fill="#2d3a30"/><rect x="' + (x - 110) + '" y="470" width="8" height="80" fill="#7a5537"/><rect x="' + (x + 102) + '" y="470" width="8" height="80" fill="#7a5537"/><path d="M' + (x - 106) + ' 478 q106 24 212 0" stroke="#a37a4e" stroke-width="4" fill="none"/>' + [-100, -74, -48, -22, 30, 56, 82].map(d => '<rect x="' + (x + d) + '" y="520" width="22" height="14" rx="3" fill="#a37a4e"/>').join('') + '<rect x="' + (x - 10) + '" y="545" width="22" height="14" rx="3" fill="#7a5537" transform="rotate(25 ' + x + ' 552)"/>' },
        web: { ic: '🕸️', name: 'شبكة عنكبوت', line: 'شبكة عنكبوت كبيرة بين الشجرتين! جاوب صح علشان تلاقي طريق من غيرها', pass: 'لقيت الطريق وعدّيت الشبكة!', amb: 'wind',
            draw: (x, th) => { let s = '<rect x="' + (x - 90) + '" y="360" width="14" height="200" fill="' + th.trunk + '"/><rect x="' + (x + 76) + '" y="360" width="14" height="200" fill="' + th.trunk + '"/><g stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.8">'; for (let r = 18; r <= 78; r += 15) s += '<circle cx="' + x + '" cy="450" r="' + r + '"/>'; for (let a = 0; a < 360; a += 30) s += '<line x1="' + x + '" y1="450" x2="' + (x + 80 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" y2="' + (450 + 80 * Math.sin(a * Math.PI / 180)).toFixed(1) + '"/>'; return s + '</g>' + em(x + 30, 440, 26, '🕷️', 'bob'); } },
        thorns: { ic: '🌿', name: 'شجيرة شوك', line: 'شجيرة شوك مالية الطريق! جاوب صح علشان تلاقي ممر', pass: 'لقيت ممر وعدّيت الشوك!', amb: 'wind',
            draw: x => '<ellipse cx="' + (x - 40) + '" cy="520" rx="46" ry="40" fill="#3d6b3a"/><ellipse cx="' + (x + 30) + '" cy="515" rx="52" ry="46" fill="#4a7c45"/><ellipse cx="' + x + '" cy="540" rx="60" ry="26" fill="#345e32"/>' + [-70, -40, -10, 20, 50, 75].map((d, i) => '<path d="M' + (x + d) + ' ' + (505 - (i % 2) * 20) + ' l6 -18 l6 18" fill="#2b4a29"/>').join('') + '<circle cx="' + (x - 20) + '" cy="500" r="4" fill="#c95d5d"/><circle cx="' + (x + 40) + '" cy="490" r="4" fill="#c95d5d"/>' },
        owl: { ic: '🦉', name: 'البومة الحكيمة', line: 'البومة الحكيمة واقفة على الغصن وعندها سؤال ليك!', pass: 'البومة قالت: برافو، عدّي يا شاطر!', amb: 'owl',
            draw: (x, th) => '<rect x="' + (x + 30) + '" y="330" width="12" height="230" fill="' + th.trunk + '"/><path d="M' + (x + 36) + ' 430 q-50 -20 -80 0" stroke="' + th.trunk + '" stroke-width="9" fill="none" stroke-linecap="round"/>' + em(x - 20, 432, 54, '🦉', 'bob') },
        fox: { ic: '🦊', name: 'الثعلب', line: 'الثعلب واقف في نص الطريق وعايز يختبرك بسؤال!', pass: 'الثعلب فسح لك الطريق، برافو!', amb: 'wind', draw: x => em(x, 552, 62, '🦊', 'bob') },
        turtle: { ic: '🐢', name: 'السلحفاة', line: 'سلحفاة كبيرة نايمة في الطريق! جاوب صح علشان تعدّي من جنبها', pass: 'عدّيت من جنب السلحفاة بلطف!', amb: 'water', draw: x => em(x, 552, 62, '🐢', 'bob') },
        frog: { ic: '🐸', name: 'الضفدع', line: 'الضفدع فوق الحجر بيسأل: تعرف الإجابة؟', pass: 'الضفدع نطّ وفسح لك الطريق!', amb: 'water', draw: x => '<ellipse cx="' + x + '" cy="548" rx="50" ry="16" fill="#7c8578"/>' + em(x, 535, 54, '🐸', 'bob') },
        gate: { ic: '🚪', name: 'بوابة خشبية', line: 'بوابة الغابة مقفولة! الإجابة الصحيحة هي المفتاح', pass: 'البوابة اتفتحت! يلا كمّل', amb: 'step',
            draw: x => '<rect x="' + (x - 80) + '" y="400" width="16" height="160" fill="#6d4a2c"/><rect x="' + (x + 64) + '" y="400" width="16" height="160" fill="#6d4a2c"/><path d="M' + (x - 80) + ' 400 q80 -50 160 0" stroke="#6d4a2c" stroke-width="16" fill="none"/>' + [430, 470, 510].map(y => '<rect x="' + (x - 66) + '" y="' + y + '" width="132" height="14" rx="4" fill="#9c6b3e"/>').join('') + '<rect x="' + (x - 6) + '" y="410" width="12" height="150" fill="#8a5c33"/>' + em(x, 500, 26, '🔒') },
        waterfall: { ic: '💦', name: 'الشلال', line: 'شلال كبير والمية بتخبّط! جاوب صح علشان تعدّي من وراه', pass: 'عدّيت من ورا الشلال، يا سلام!', amb: 'water',
            draw: x => '<rect x="' + (x + 40) + '" y="180" width="90" height="380" fill="#6d7d6c"/><rect x="' + (x + 60) + '" y="180" width="50" height="360" fill="#a9d4ea" opacity="0.85"/><g class="wave" stroke="#ffffff" stroke-width="3" opacity="0.7"><line x1="' + (x + 70) + '" y1="200" x2="' + (x + 70) + '" y2="520"/><line x1="' + (x + 92) + '" y1="220" x2="' + (x + 92) + '" y2="530"/></g><ellipse cx="' + (x + 40) + '" cy="552" rx="120" ry="20" fill="#7fb8d8"/><ellipse cx="' + (x + 40) + '" cy="548" rx="90" ry="10" fill="#cfe8f4" opacity="0.7" class="ripple"/>' },
        monkey: { ic: '🐒', name: 'القرد الشقي', line: 'القرد الشقي متعلق في الشجرة وعايز يلعب معاك لعبة الأسئلة!', pass: 'القرد صقّف لك، برافو!', amb: 'birds',
            draw: (x, th) => '<path d="M' + (x - 80) + ' 300 q80 -40 160 20" stroke="' + th.trunk + '" stroke-width="10" fill="none" stroke-linecap="round"/><line x1="' + x + '" y1="315" x2="' + x + '" y2="400" stroke="#6b4a2a" stroke-width="4"/>' + em(x, 440, 58, '🐒', 'bob') },
        parrot: { ic: '🦜', name: 'الببغاء', line: 'الببغاء بيكرر السؤال وعايز يسمع إجابتك!', pass: 'الببغاء قال: برافو برافو!', amb: 'birds', draw: (x, th) => '<rect x="' + (x + 20) + '" y="350" width="12" height="210" fill="' + th.trunk + '"/>' + em(x, 470, 56, '🦜', 'bob') },
        leaves: { ic: '🍂', name: 'كومة أوراق', line: 'كومة أوراق خريف عالية! جاوب صح علشان تقفز فوقها', pass: 'قفزت فوق الأوراق وطارت حواليك!', amb: 'wind',
            draw: x => '<ellipse cx="' + x + '" cy="545" rx="90" ry="30" fill="#b3612e"/><ellipse cx="' + (x - 10) + '" cy="528" rx="60" ry="26" fill="#d98a3a"/><ellipse cx="' + (x + 20) + '" cy="516" rx="36" ry="18" fill="#e6b04c"/>' + em(x - 50, 520, 22, '🍂') + em(x + 55, 530, 22, '🍁') },
        deer: { ic: '🦌', name: 'الغزال', line: 'غزال جميل واقف في الطريق وبيبصّ لك! جاوب صح علشان يعدّيك', pass: 'الغزال مشى جنبك وودّعك!', amb: 'wind', draw: x => em(x, 552, 66, '🦌', 'bob') },
        boulders: { ic: '🗻', name: 'صخور متساقطة', line: 'صخور وقعت من الجبل وقفلت الطريق! جاوب صح علشان تعدّي بينها', pass: 'عدّيت بين الصخور بحذر!', amb: 'step',
            draw: x => '<circle cx="' + (x - 50) + '" cy="535" r="30" fill="#7d8384"/><circle cx="' + (x + 10) + '" cy="528" r="36" fill="#8f9596"/><circle cx="' + (x + 62) + '" cy="540" r="26" fill="#737a7b"/><circle cx="' + (x - 10) + '" cy="490" r="22" fill="#a2a8a9"/>' },
        ice: { ic: '🧊', name: 'جليد زلق', line: 'الطريق مليان جليد زلق! جاوب صح علشان تعدّي من غير ما تقع', pass: 'عدّيت الجليد زي المتزلجين!', amb: 'wind',
            draw: x => '<ellipse cx="' + x + '" cy="545" rx="100" ry="24" fill="#bfe3f2"/><ellipse cx="' + x + '" cy="540" rx="80" ry="14" fill="#e6f5fb" opacity="0.8"/><path d="M' + (x - 60) + ' 540 l20 -4 l20 6 l25 -5" stroke="#fff" stroke-width="2" fill="none"/>' },
        snowman: { ic: '⛄', name: 'رجل الثلج', line: 'رجل الثلج واقف في نص الطريق وعنده سؤال ليك!', pass: 'رجل الثلج ضحك وقال: عدّي يا بطل!', amb: 'wind', draw: x => em(x, 552, 66, '⛄', 'bob') },
        cave: { ic: '🕳️', name: 'مدخل الكهف', line: 'الكهف مظلم! جاوب صح علشان الفانوس ينوّر لك الطريق', pass: 'الفانوس نوّر وعدّيت الكهف!', amb: 'wind',
            draw: x => '<path d="M' + (x - 120) + ' 560 v-120 q120 -110 240 0 v120 z" fill="#5a5f63"/><path d="M' + (x - 80) + ' 560 v-80 q80 -80 160 0 v80 z" fill="#15191c"/><path d="M' + (x - 120) + ' 440 q60 -60 120 -70" stroke="#7a8084" stroke-width="6" fill="none"/>' },
        bat: { ic: '🦇', name: 'الخفاش', line: 'خفاش بيطير حوالين الطريق! جاوب صح علشان يروح لبيته', pass: 'الخفاش طار بعيد وعدّيت!', amb: 'night', draw: x => em(x, 430, 50, '🦇', 'bob') + em(x + 60, 470, 34, '🦇', 'bob') },
        eagle: { ic: '🦅', name: 'النسر', line: 'نسر كبير واقف على الصخرة وبيراقبك! جاوب صح علشان يسمح لك تعدّي', pass: 'النسر رفرف بجناحه وعدّيت!', amb: 'wind', draw: x => '<path d="M' + (x - 50) + ' 560 q10 -60 50 -60 q40 0 50 60 z" fill="#7d8384"/>' + em(x, 505, 56, '🦅', 'bob') },
        bear: { ic: '🐻', name: 'الدب النايم', line: 'دب كبير نايم جنب الطريق! جاوب صح وعدّي بهدوء من غير ما تصحّيه', pass: 'عدّيت على أطراف صوابعك والدب لسه نايم!', amb: 'night', draw: x => em(x, 552, 66, '🐻', 'bob') + em(x + 50, 490, 24, '💤', 'bob') },
        butterfly: { ic: '🦋', name: 'الفراشة', line: 'الفراشة الجميلة واقفة على الزهرة وعايزة تلعب معاك لعبة الأسئلة!', pass: 'الفراشة طارت فرحانة بإجابتك!', amb: 'birds', draw: x => em(x, 552, 36, '🌸') + em(x + 10, 500, 48, '🦋', 'bob') },
        hedgehog: { ic: '🦔', name: 'القنفذ', line: 'القنفذ الصغير في نص الطريق! جاوب صح علشان يفسح لك', pass: 'القنفذ مشى جنب الطريق، برافو!', amb: 'wind', draw: x => em(x, 552, 56, '🦔', 'bob') },
        stream: { ic: '💧', name: 'جدول الجبل', line: 'جدول مية بارد نازل من الجبل! جاوب صح علشان تقفز فوقه', pass: 'قفزت فوق الجدول!', amb: 'water', draw: x => '<path d="M' + (x - 70) + ' 500 q35 -6 70 0 t70 0 v78 h-140 z" fill="#79b3d6"/><g class="ripple" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"><path d="M' + (x - 40) + ' 530 q12 -5 24 0 t24 0"/><path d="M' + (x - 10) + ' 555 q12 -5 24 0 t24 0"/></g>' },
        dark: { ic: '🏮', name: 'الدرب المظلم', line: 'الطريق ضلمة خالص! جاوب صح علشان الفانوس ينوّر', pass: 'الفانوس نوّر الطريق كله!', amb: 'night', draw: x => '<ellipse cx="' + x + '" cy="520" rx="130" ry="90" fill="#050a10" opacity="0.75"/>' + em(x, 470, 40, '🏮', 'bob') }
    };

    // ---------- levels ----------
    const FOREST_LEVELS = [
        { id: 1, name: 'غابة الصباح', ic: '🌲', c: '#5f9e83', pet: { ic: '🐇', name: 'أرنوب' }, intro: 'الشمس طالعة والعصافير بتغني. الطريق للكنز مليان عقبات، وكل عقبة ليها سؤال!',
          obst: ['log', 'butterfly', 'mud', 'bees', 'rock', 'hedgehog', 'web', 'river', 'thorns', 'fox', 'bridge', 'gate'],
          th: { sky: ['#a9d3ee', '#f5eedc'], sun: { x: 0.78, y: 105, r: 44, c: '#fff4c2' }, mount: ['#a3bccd', '#8ba7bb'], far: '#8aa891', mid: ['#6f9b74', '#4f7c58'], near: ['#4b8258', '#2e5a3b'], trunk: '#5a4030', ground: ['#86a862', '#5d7d44'], path: ['#cdb07f', '#a98455'], fog: '#f2f6f3', fogA: 0.55, rays: true, leaves: '#cfe08a', pine: 0.55, fore: '#2f5236' } },
        { id: 2, name: 'نهر الغابة', ic: '🏞️', c: '#4f8a9c', pet: { ic: '🦆', name: 'بطبوط' }, intro: 'المية بتجري والضفادع بتنطّ. عدّي النهر والشلال وقابل حيوانات الغابة!',
          obst: ['river', 'frog', 'log', 'turtle', 'waterfall', 'monkey', 'mud', 'parrot', 'bridge', 'bees', 'rock', 'gate'],
          th: { sky: ['#b6dfe6', '#eef6ea'], sun: { x: 0.2, y: 120, r: 40, c: '#fff8d6' }, mount: ['#8fb3b8', '#76989e'], far: '#6f9d90', mid: ['#4f8a7f', '#356b62'], near: ['#3f7a6a', '#25504a'], trunk: '#4d3a2a', ground: ['#7aa464', '#557a45'], path: ['#c2ab7d', '#9d8256'], fog: '#e8f4ef', fogA: 0.6, rays: false, leaves: null, pine: 0.3, fore: '#244a3d' } },
        { id: 3, name: 'غابة الخريف', ic: '🍂', c: '#c9793f', pet: { ic: '🐿️', name: 'سنجوب' }, intro: 'الأوراق لونها دهبي وبتطير مع الهوا. الغزلان والبوم مستنيينك بأسئلة جديدة!',
          obst: ['leaves', 'rock', 'fox', 'log', 'web', 'deer', 'thorns', 'mud', 'owl', 'river', 'bridge', 'gate'],
          th: { sky: ['#f0d1a8', '#fbeedc'], sun: { x: 0.72, y: 130, r: 48, c: '#ffe2a8' }, mount: ['#c0a08a', '#a3846f'], far: '#c48a55', mid: ['#c97b3f', '#a8552e'], near: ['#b0562c', '#7d3f24'], trunk: '#5a3b28', ground: ['#b58a4a', '#8a6335'], path: ['#d6b489', '#ad8a5c'], fog: '#f8ead8', fogA: 0.5, rays: true, leaves: '#e2a23f', pine: 0.15, fore: '#6b3d1f' } },
        { id: 4, name: 'الجبل والكهف', ic: '⛰️', c: '#6e7d99', pet: { ic: '🐐', name: 'معيزة' }, intro: 'الهوا بارد والصخور عالية. اتسلق الجبل، عدّي الجليد، ونوّر الكهف بفانوسك!',
          obst: ['boulders', 'ice', 'rock', 'bridge', 'snowman', 'cave', 'bat', 'log', 'stream', 'eagle', 'thorns', 'gate'],
          th: { sky: ['#9fb0c8', '#e6ebf2'], sun: { x: 0.3, y: 100, r: 36, c: '#ffffff' }, mount: ['#7f8ea8', '#5f6d88'], snow: true, far: '#4f6560', mid: ['#3f5f58', '#2c4640'], near: ['#36554f', '#213a35'], trunk: '#3a3a3a', ground: ['#8d9591', '#6a726e'], path: ['#b9bdb8', '#8f938e'], fog: '#e4e9ef', fogA: 0.7, rays: false, leaves: null, pine: 0.9, fore: '#2a3f3a' } },
        { id: 5, name: 'الغابة الليلية', ic: '🌙', c: '#3e4d8a', pet: { ic: '🐕', name: 'بوبي' }, intro: 'القمر طالع والنجوم بتلمع واليراعات بتنوّر. المغامرة الأخيرة، والكنز الكبير في آخرها!',
          obst: ['dark', 'owl', 'bat', 'log', 'web', 'river', 'deer', 'bear', 'mud', 'rock', 'bridge', 'gate'],
          th: { sky: ['#0d1533', '#2b3f6e'], moon: { x: 0.76, y: 100, r: 38 }, stars: true, mount: ['#1e2a4d', '#151f3a'], far: '#14263a', mid: ['#183a44', '#0f2a33'], near: ['#123640', '#0a2229'], trunk: '#1c2a2e', ground: ['#2c4a3a', '#1d3328'], path: ['#5d6a58', '#465340'], fog: '#3a4f70', fogA: 0.45, rays: false, leaves: null, fire: true, pine: 0.5, fore: '#0b1a15' } }
    ];
    // ---------- worlds: the forest here, the city in city-world.js (same engine, own scenery and obstacles) ----------
    if (window.CityWorld) Object.assign(OB, CityWorld.OB);
    const WORLDS = [
        { id: 'forest', name: 'الغابة', ic: '🌲', title: 'مغامرة الغابة', levels: FOREST_LEVELS, deco: ['🌲', '🌳', '🍄', '🦋', '🌿'], done: 'خلّصت كل مراحل الغابة! أنت مغامر حقيقي 🧭' },
        { id: 'city', name: 'المدينة', ic: '🏙️', title: 'مغامرة المدينة', levels: window.CityWorld ? CityWorld.LEVELS : [], deco: ['🏠', '🚌', '⛲', '🌳', '🏪'], done: 'خلّصت كل مراحل المدينة! أنت مغامر حقيقي 🧭' }
    ].filter(w => w.levels.length);
    { const q = new URLSearchParams(location.search).get('world'); if (q && WORLDS.some(w => w.id === q)) localStorage.setItem('forest_world', q); }
    let world = WORLDS.find(w => w.id === localStorage.getItem('forest_world')) || WORLDS[0];
    const LV = () => world.levels;
    const SPACING = 900, FIRST_X = 1100;
    const obstX = i => FIRST_X + i * SPACING;

    // ---------- scene drawing ----------
    function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
    function pine(x, base, h, g, dark) {
        const w = h * 0.55, t = h * 0.14;
        let s = '<rect x="' + (x - w * 0.07) + '" y="' + (base - t) + '" width="' + (w * 0.14) + '" height="' + t + '" fill="' + dark + '"/>';
        for (let i = 0; i < 3; i++) { const y = base - t - i * h * 0.26, ww = w * (1 - i * 0.22), hh = h * (0.42 - i * 0.04); s += '<path d="M' + (x - ww / 2) + ' ' + y + ' L' + x + ' ' + (y - hh) + ' L' + (x + ww / 2) + ' ' + y + ' z" fill="' + g + '"/>'; }
        return s;
    }
    function roundTree(x, base, h, g, dark) {
        const r = h * 0.28, t = h * 0.42;
        return '<path d="M' + (x - h * 0.05) + ' ' + base + ' q' + (h * 0.02) + ' -' + (t * 0.5) + ' 0 -' + t + ' h' + (h * 0.1) + ' q-' + (h * 0.02) + ' ' + (t * 0.5) + ' 0 ' + t + ' z" fill="' + dark + '"/>' +
            '<circle cx="' + (x - r * 0.8) + '" cy="' + (base - t - r * 0.3) + '" r="' + r + '" fill="' + g + '"/><circle cx="' + (x + r * 0.8) + '" cy="' + (base - t - r * 0.4) + '" r="' + (r * 0.95) + '" fill="' + g + '"/><circle cx="' + x + '" cy="' + (base - t - r * 1.1) + '" r="' + (r * 1.05) + '" fill="' + g + '"/><circle cx="' + x + '" cy="' + (base - t - r * 0.5) + '" r="' + (r * 0.9) + '" fill="' + g + '" opacity="0.9"/>';
    }
    function mountains(len, base, amp, seed, fill, snow) {
        const r = rng(seed); let d = 'M0 ' + base, x = 0, pts = [];
        while (x < len + 300) { const w = 160 + r() * 220, h = amp * (0.5 + r()); pts.push([x + w / 2, base - h]); d += ' L' + (x + w / 2) + ' ' + (base - h); x += w; d += ' L' + x + ' ' + (base - h * 0.35); }
        d += ' L' + (len + 400) + ' ' + base + ' L' + (len + 400) + ' 620 L0 620 z';
        let s = '<path d="' + d + '" fill="' + fill + '"/>';
        if (snow) s += pts.map(p => '<path d="M' + (p[0] - 40) + ' ' + (p[1] + 34) + ' L' + p[0] + ' ' + p[1] + ' L' + (p[0] + 40) + ' ' + (p[1] + 34) + ' q-20 8 -40 -2 q-20 10 -40 2 z" fill="#f3f6f8" opacity="0.9"/>').join('');
        return s;
    }
    function treeRow(len, base, hMin, hMax, gap, seed, fill, trunk, pineRatio, avoid) {
        const r = rng(seed); let s = '', x = 30;
        while (x < len + 300) {
            const h = hMin + r() * (hMax - hMin), skip = avoid && avoid.some(a => Math.abs(x - a) < 170);
            if (!skip) s += r() < pineRatio ? pine(x, base, h, fill, trunk) : roundTree(x, base, h, fill, trunk);
            x += gap * (0.6 + r() * 0.9);
        }
        return s;
    }
    function buildScene(level) {
        const th = level.th, n = level.obst.length, endX = obstX(n) + 200, worldW = endX + 1400;
        const L = f => Math.ceil(worldW * f) + 1600;
        const avoid = level.obst.map((_, i) => obstX(i)).concat([endX]);
        const gid = (n, a, b) => '<linearGradient id="' + n + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
        let defs = '<defs>' + gid('gSky', th.sky[0], th.sky[1]) + (th.mid ? gid('gMid', th.mid[0], th.mid[1]) + gid('gNear', th.near[0], th.near[1]) + gid('gGround', th.ground[0], th.ground[1]) + gid('gPath', th.path[0], th.path[1]) : '') +
            '<linearGradient id="gFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + th.fog + '" stop-opacity="0"/><stop offset="0.6" stop-color="' + th.fog + '" stop-opacity="' + th.fogA + '"/><stop offset="1" stop-color="' + th.fog + '" stop-opacity="0"/></linearGradient>' +
            '<radialGradient id="gSun"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff2b0" stop-opacity="0.35"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient></defs>';
        // sky (fixed)
        let sky = '<rect x="-2000" y="-3000" width="8000" height="3650" fill="url(#gSky)"/>';
        if (th.stars) { const r = rng(5); for (let i = 0; i < 140; i++) sky += '<circle cx="' + (r() * 2000 - 200).toFixed(0) + '" cy="' + (r() * 1300 - 950).toFixed(0) + '" r="' + (0.8 + r() * 1.6).toFixed(1) + '" fill="#fff" class="twinkle" style="animation-delay:-' + (r() * 3).toFixed(1) + 's"/>'; }
        if (th.sun) sky += '<g class="sun"><circle cx="' + th.sun.x * 600 + '" cy="' + th.sun.y + '" r="' + th.sun.r * 3.2 + '" fill="url(#gSun)"/><circle cx="' + th.sun.x * 600 + '" cy="' + th.sun.y + '" r="' + th.sun.r + '" fill="' + th.sun.c + '"/></g>';
        if (th.moon) sky += '<circle cx="' + th.moon.x * 600 + '" cy="' + th.moon.y + '" r="' + th.moon.r * 3 + '" fill="url(#gSun)" opacity="0.5"/><circle cx="' + th.moon.x * 600 + '" cy="' + th.moon.y + '" r="' + th.moon.r + '" fill="#f4f1dc"/><circle cx="' + (th.moon.x * 600 - 10) + '" cy="' + (th.moon.y - 8) + '" r="7" fill="#e3e0c8"/><circle cx="' + (th.moon.x * 600 + 12) + '" cy="' + (th.moon.y + 10) + '" r="5" fill="#e3e0c8"/>';
        { const r = rng(11); let clouds = ''; for (let i = 0; i < 10; i++) { const cx = r() * 2000, cy = (i < 6 ? 60 + r() * 120 : -700 + r() * 600), w = 90 + r() * 120; const cs = spr('cloud-' + (1 + i % 3)); if (cs) { clouds += '<image href="' + cs + '" x="' + (cx - w) + '" y="' + (cy - w / 2) + '" width="' + (w * 2) + '" height="' + w + '" preserveAspectRatio="xMidYMid meet"' + (th.stars ? ' opacity="0.35"' : '') + '/>'; continue; } clouds += '<g fill="' + (th.stars ? '#2c3d66' : '#ffffff') + '"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + w / 2 + '" ry="' + w / 6 + '"/><ellipse cx="' + (cx - w / 5) + '" cy="' + (cy - w / 10) + '" rx="' + w / 4 + '" ry="' + w / 6 + '"/><ellipse cx="' + (cx + w / 6) + '" cy="' + (cy - w / 12) + '" rx="' + w / 3.5 + '" ry="' + w / 5.5 + '"/></g>'; }
          sky += '<g class="clouds" opacity="' + (th.stars ? 0.5 : 0.75) + '">' + clouds + '<g transform="translate(2000 0)">' + clouds + '</g></g>'; }
        const bird = (x, y, s) => '<path class="flapbird" d="M' + (x - s) + ' ' + y + ' q' + (s / 2) + ' -' + (s / 2) + ' ' + s + ' 0 q' + (s / 2) + ' -' + (s / 2) + ' ' + s + ' 0" stroke="' + (th.stars ? '#0b1230' : '#3a4a52') + '" stroke-width="' + (s / 5).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
        const bu = spr(th.stars ? 'bat-up' : 'bird-up') || spr('bird-up'), bd = spr(th.stars ? 'bat-down' : 'bird-down') || spr('bird-down');
        const sbird = (x, y, s) => bu && bd ? '<g class="sbird"><image class="up" href="' + bu + '" x="' + (x - s) + '" y="' + (y - s) + '" width="' + (2 * s) + '" height="' + (2 * s) + '"/><image class="down" href="' + bd + '" x="' + (x - s) + '" y="' + (y - s) + '" width="' + (2 * s) + '" height="' + (2 * s) + '"/></g>' : bird(x, y, s);
        sky += '<g class="flock">' + sbird(0, 150, 14) + sbird(36, 168, 11) + sbird(-30, 176, 10) + sbird(70, 140, 9) + '</g><g class="flock slow">' + sbird(0, 90, 9) + sbird(28, 102, 8) + '</g>';
        if (th.rays) sky += '<g class="rays" fill="#fff6d0"><polygon points="' + (th.sun.x * 600) + ',' + th.sun.y + ' ' + (th.sun.x * 600 - 380) + ',600 ' + (th.sun.x * 600 - 240) + ',600"/><polygon points="' + (th.sun.x * 600) + ',' + th.sun.y + ' ' + (th.sun.x * 600 - 90) + ',600 ' + (th.sun.x * 600 + 60) + ',600"/><polygon points="' + (th.sun.x * 600) + ',' + th.sun.y + ' ' + (th.sun.x * 600 + 200) + ',600 ' + (th.sun.x * 600 + 340) + ',600"/></g>';
        const ctx = { L, avoid, rng, treeRow, obstX, th };
        const mid = th.kind === 'city' && window.CityWorld ? CityWorld.layers(level, ctx) : forestLayers(level, ctx);
        const layers = [{ f: 0, s: sky, id: 'L-sky' }].concat(mid.back, [
            { f: 1, s: level.obst.map((k, i) => '<g class="ob" data-i="' + i + '">' + (obSprite(k, obstX(i)) || OB[k].draw(obstX(i), th)) + '</g>').join('') + treasureSvg(endX), id: 'L-obst' }
        ], mid.front, [
            { f: 1.3, s: (function () { const r = rng(91); let s = ''; for (let x = 0; x < L(1.3) + 300; x += 260 + r() * 300) s += '<ellipse cx="' + x + '" cy="' + (606 + r() * 8) + '" rx="' + (36 + r() * 50) + '" ry="' + (10 + r() * 14) + '" fill="' + th.fore + '" opacity="0.85"/>'; return s; })() }
        ]);
        // optional photo background (assets/scenes/<world>-<level>.jpg): tiled with mirrored copies at parallax 0.2, shown only once it loads
        const photoSrc = 'assets/scenes/' + world.id + '-' + level.id + '.jpg';
        { const tw = 1778, n = Math.ceil((L(0.2) + 800) / tw) + 1; let s = ''; for (let i = -1; i < n; i++) s += '<image data-src="' + photoSrc + '" x="' + (i * tw) + '" y="-520" width="' + tw + '" height="1000" preserveAspectRatio="none"' + (i % 2 ? ' transform="translate(' + ((2 * i + 1) * tw) + ' 0) scale(-1 1)"' : '') + '/>'; layers.splice(1, 0, { f: 0.2, s: s, id: 'L-photo', hidden: true }); }
        let extras = '';
        if (th.leaves) { const r = rng(7); for (let i = 0; i < 7; i++) extras += '<ellipse cx="' + (r() * 1000) + '" cy="0" rx="6" ry="3" fill="' + th.leaves + '" class="leaf" style="animation-delay:-' + (r() * 9).toFixed(1) + 's"/>'; }
        if (th.fire) { const r = rng(9); for (let i = 0; i < 14; i++) extras += '<circle cx="' + (r() * 1000) + '" cy="' + (250 + r() * 300) + '" r="2.5" fill="#f4e27a" class="firefly" style="animation-delay:-' + (r() * 5).toFixed(1) + 's"/>'; }
        const svg = $('world');
        svg.innerHTML = defs + layers.map(l => '<g data-f="' + l.f + '"' + (l.id ? ' id="' + l.id + '"' : '') + (l.ph ? ' data-ph="1"' : '') + (l.hidden ? ' style="display:none"' : '') + '>' + l.s + '</g>').join('') + '<g>' + extras + '</g>';
        usePhoto(photoSrc);
        return { endX, worldW };
    }
    function forestLayers(level, ctx) {
        const th = level.th, L = ctx.L;
        return { back: [
            { f: 0.12, s: mountains(L(0.12), 470, 200, 21, th.mount[0], th.snow), ph: true },
            { f: 0.2, s: mountains(L(0.2), 480, 130, 33, th.mount[1], th.snow), ph: true },
            { f: 0.38, s: treeRow(L(0.38), 484, 70, 130, 60, 41, th.far, th.far, th.pine), ph: true },
            { f: 0.38, s: '<rect x="-400" y="400" width="' + (L(0.38) + 800) + '" height="110" fill="url(#gFog)" class="mist"/>' },
            { f: 0.62, s: treeRow(L(0.62), 494, 130, 230, 95, 57, 'url(#gMid)', th.trunk, th.pine), ph: true },
            { f: 1, s: '<rect x="-400" y="470" width="' + (L(1) + 800) + '" height="140" fill="url(#gGround)"/><path d="M-400 500 q300 -14 600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 t600 0 L' + (L(1) + 800) + ' 590 L-400 590 z" fill="url(#gPath)"/>', id: 'L-ground' },
            { f: 1, s: treeRow(L(1), 505, 230, 340, 200, 73, 'url(#gNear)', th.trunk, th.pine, ctx.avoid), id: 'L-near', ph: true }
        ], front: [] };
    }
    // When the photo for this level exists: show it, hide the drawn scenery behind the path, and colour the sky above it from its top edge
    const photoCache = {};
    function usePhoto(src) {
        const apply = ok => { const g = $('L-photo'); if (!g || !ok) return; g.querySelectorAll('image[data-src]').forEach(im => im.setAttribute('href', im.dataset.src)); g.style.display = ''; document.querySelectorAll('#world > g[data-ph]').forEach(x => x.style.display = 'none'); if (photoCache[src].sky) { const r = document.querySelector('#L-sky > rect'); if (r) r.setAttribute('fill', photoCache[src].sky); } };
        if (photoCache[src]) return apply(photoCache[src].ok);
        const im = new Image();
        im.onload = () => { let sky = null; try { const c = document.createElement('canvas'); c.width = 8; c.height = 2; const g = c.getContext('2d'); g.drawImage(im, 0, 0, im.width, Math.max(1, im.height * 0.02), 0, 0, 8, 2); const d = g.getImageData(0, 0, 8, 2).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; sky = 'rgb(' + Math.round(r / n) + ',' + Math.round(gg / n) + ',' + Math.round(b / n) + ')'; } catch (e) {} photoCache[src] = { ok: true, sky }; apply(true); };
        im.onerror = () => { photoCache[src] = { ok: false }; };
        im.src = src;
    }
    function treasureSvg(x) {
        return '<g id="treasure"><circle cx="' + x + '" cy="520" r="70" fill="#ffe9a8" opacity="0.35" class="twinkle"/><rect x="' + (x - 40) + '" y="520" width="80" height="40" rx="6" fill="#8a5a33"/><path d="M' + (x - 40) + ' 522 v-12 a12 12 0 0 1 12 -12 h56 a12 12 0 0 1 12 12 v12 z" fill="#a86f45"/><rect x="' + (x - 40) + '" y="518" width="80" height="6" fill="#d1a54a"/><rect x="' + (x - 6) + '" y="524" width="12" height="12" rx="2" fill="#d1a54a"/>' + em(x, 505, 22, '✨', 'twinkle') + '</g>';
    }

    // ---------- camera ----------
    let cam = 0, vw = 1000, scale = 1;
    // Portrait phones: the world is at least 640 units wide and the sky simply extends upward; the hero is sized from the same scale
    function fit() {
        const sc = $('scene'), W = sc.clientWidth || 360, H = sc.clientHeight || 400;
        vw = Math.max(640, W * 600 / H); scale = W / vw;
        const vh = H / scale;
        $('world').setAttribute('viewBox', '0 ' + (600 - vh).toFixed(0) + ' ' + vw.toFixed(0) + ' ' + vh.toFixed(0));
        const h = hero(); h.style.bottom = (45 * scale).toFixed(0) + 'px'; h.style.width = Math.max(72, Math.min(190, 130 * scale)).toFixed(0) + 'px';
        const p = $('pet'); p.style.bottom = (42 * scale).toFixed(0) + 'px'; p.style.fontSize = Math.max(26, Math.min(64, 46 * scale)).toFixed(0) + 'px';
        applyCam();
    }
    function applyCam() {
        document.querySelectorAll('#world > g[data-f]').forEach(g => g.setAttribute('transform', 'translate(' + (-cam * parseFloat(g.dataset.f)).toFixed(1) + ' 0)'));
        positionCallout();
    }
    const camFor = x => x - 0.7 * vw;   // the obstacle sits at 70% of the screen, the hero at ~22-43%
    const camPast = x => x - 0.06 * vw; // the obstacle is behind the hero
    function tween(from, to, ms, fn, ease) {
        return new Promise(res => { const t0 = performance.now(); const e = ease || (p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2); (function step(now) { const p = Math.min(1, (now - t0) / ms); fn(from + (to - from) * e(p)); if (p < 1) requestAnimationFrame(step); else res(); })(t0); });
    }
    let calloutX = null;
    function positionCallout() {
        const el = $('callout'); if (el.classList.contains('hidden') || calloutX === null) return;
        const pct = (calloutX - cam) / vw * 100; el.style.left = Math.max(28, Math.min(80, pct)) + '%'; el.style.top = '30%';
    }
    function showCallout(text, x) { calloutX = x; const el = $('callout'); el.textContent = text; el.classList.remove('hidden'); positionCallout(); }
    function hideCallout() { calloutX = null; $('callout').classList.add('hidden'); }
    const hero = () => $('hero');
    // generated hero frames (hero-stand.png ... or heroine-* for a girl) replace the drawn adventurer when they exist
    let heroImg = false;
    function setupHero() {
        const pre = girl() && spr('heroine-stand') ? 'heroine' : 'hero';
        heroImg = !!spr(pre + '-stand');
        $('hero-frames').classList.toggle('hidden', !heroImg); $('hero-svg').style.display = heroImg ? 'none' : '';
        $('hero-photo').src = playerPhoto();
        if (!heroImg) return;
        $('hero-frames').querySelectorAll('img').forEach(im => { im.src = spr(pre + '-' + im.dataset.pose) || spr(pre + '-stand'); });
    }
    function heroState(s) { hero().className = 'f-hero ' + s + (heroImg ? ' img' : '');
        if (heroImg) { const pose = s === 'walk' ? null : (s === 'jump' || s === 'cheer' || s === 'sad') ? s : 'stand'; $('hero-frames').querySelectorAll('img').forEach(im => im.classList.toggle('on', pose !== null && im.dataset.pose === pose)); }
        const p = $('pet'); p.className = 'f-pet ' + s + (p.dataset.walk ? ' img' : ''); if (p.dataset.walk) { const im = p.querySelector('img'); if (im) im.src = (s === 'cheer' || s === 'jump') ? p.dataset.jump : p.dataset.walk; } }

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
        const L = $('loading'); L.classList.remove('hidden'); $('loading-bar').style.width = '5%'; $('loading-txt').textContent = 'جاري تجهيز الغابة...';
        try {
            let manifest = null; try { const m = await fetch('./data/manifest.json', { cache: 'no-cache' }); if (m.ok) manifest = await m.json(); } catch (e) {}
            const cached = await idbGet('cat:' + cat);
            let items = cached && Array.isArray(cached.items) && cached.items.length && (!manifest || cached.v === manifest.version) ? cached.items : null;
            if (!items && cached && cached.items && cached.items.length && !manifest) items = cached.items;
            if (!items) {
                $('loading-txt').textContent = '⬇️ جاري تنزيل أسئلة صفّك';
                items = await fetchBank(cat, p => { $('loading-bar').style.width = p + '%'; });
                idbPut('cat:' + cat, { v: manifest ? manifest.version : 'unknown', items });
            }
            $('loading-bar').style.width = '100%';
            banks[cat] = items; return items;
        } finally { setTimeout(() => L.classList.add('hidden'), 250); }
    }
    const choicesOf = q => [q.choice1, q.choice2, q.choice3, q.choice4].map(c => String(c ?? '').trim()).filter(Boolean);
    function usable(q) {
        if (!q || !q.question || q.correct_answer === undefined || q.correct_answer === null) return false;
        if (String(q.type || '') === 'clock' || /clock:/.test(String(q.image || ''))) return false;
        const ch = choicesOf(q); if (ch.length < 2 || !ch.includes(String(q.correct_answer).trim())) return false;
        return String(q.question).length <= 110 && ch.every(c => c.length <= 42);
    }
    function pickQuestions(cat, items, n) {
        const usedKey = 'forest_used_' + cat, used = new Set(read(usedKey, []));
        const pool = items.filter(usable); let fresh = pool.filter(q => !used.has(q.question));
        if (fresh.length < n) { fresh = pool; write(usedKey, []); used.clear(); }
        const chosen = shuffle(fresh).slice(0, n);
        write(usedKey, [...used].concat(chosen.map(q => q.question)).slice(-800));
        return chosen;
    }

    // ---------- progress ----------
    const prog = () => read('forest_progress', {});
    const pk = cat => world.id === 'forest' ? cat : cat + ':' + world.id;
    const progOf = cat => Object.assign({ unlocked: 1, stars: {}, coins: 0, done: 0 }, prog()[pk(cat)] || {});
    const saveProg = (cat, p) => { const all = prog(); all[pk(cat)] = p; write('forest_progress', all); };
    const RUN = 'forest_run';
    let run = null; // { cat, level, i, lanterns, qs, marks, streak, best, wrongQs }

    // ---------- map ----------
    const MAP_POS = [[0.22, 0.9], [0.72, 0.72], [0.28, 0.52], [0.74, 0.32], [0.4, 0.1]];
    function renderMap() {
        $('map-photo').src = playerPhoto(); $('map-name').textContent = playerName() || 'بطل جديد';
        const cat = classKey();
        $('map-class').innerHTML = CLASSES.map(c => '<button type="button" class="' + (c.k === cat ? 'on' : '') + '" data-k="' + c.k + '">' + c.ic + ' ' + c.name + '</button>').join('');
        $('map-class').querySelectorAll('button').forEach(b => b.onclick = () => { localStorage.setItem('kids_class', b.dataset.k); play('pop'); renderMap(); });
        $('map-world').innerHTML = WORLDS.map(w => '<button type="button" class="' + (w.id === world.id ? 'on' : '') + '" data-w="' + w.id + '">' + w.ic + ' ' + w.name + '</button>').join('');
        $('map-world').querySelectorAll('button').forEach(b => b.onclick = () => { world = WORLDS.find(w => w.id === b.dataset.w) || world; localStorage.setItem('forest_world', world.id); play('whoosh'); renderMap(); });
        $('map-world-name').textContent = world.title + ' 🧭';
        $('map-hint').textContent = cat ? 'اختر مرحلة وابدأ ' + world.title : 'اختر صفّك أولاً ثم المرحلة';
        const p = cat ? progOf(cat) : { unlocked: 1, stars: {} };
        const W = 400, H = 520;
        const pts = MAP_POS.map(([x, y]) => [x * W, y * H]);
        let d = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; d += ' C' + (a[0] + (i % 2 ? 120 : -120)) + ' ' + a[1] + ' ' + (b[0] + (i % 2 ? 120 : -120)) + ' ' + b[1] + ' ' + b[0] + ' ' + b[1]; }
        let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '"><path d="' + d + '" stroke="rgba(255,255,255,0.25)" stroke-width="18" fill="none" stroke-linecap="round"/><path d="' + d + '" stroke="#e8d7a8" stroke-width="6" fill="none" stroke-dasharray="2 16" stroke-linecap="round"/>';
        [[40, 300], [360, 440], [60, 140], [340, 80], [200, 470]].forEach(([x, y], i) => { svg += '<text x="' + x + '" y="' + y + '" font-size="26" opacity="0.5" text-anchor="middle">' + world.deco[i] + '</text>'; });
        svg += '</svg>';
        $('map-path').innerHTML = svg + LV().map((lv, i) => {
            const locked = i + 1 > p.unlocked, st = p.stars[lv.id] || 0, next = i + 1 === p.unlocked;
            return '<button type="button" class="m-lv' + (locked ? ' locked' : '') + (next ? ' next' : '') + '" style="left:' + MAP_POS[i][0] * 100 + '%;top:' + MAP_POS[i][1] * 100 + '%;--c:' + lv.c + '" data-lv="' + lv.id + '"><div class="ball">' + (locked ? '🔒' : lv.ic) + '</div><b>' + lv.name + '</b><div class="stars">' + (locked ? '' : [1, 2, 3].map(k => '<span class="' + (k <= st ? '' : 'off') + '">★</span>').join('')) + '</div></button>';
        }).join('');
        $('map-path').querySelectorAll('.m-lv').forEach(b => b.onclick = () => {
            const lv = LV()[+b.dataset.lv - 1];
            if (!classKey()) { play('boing'); if (window.UI) UI.toast('اختر صفّك أولاً يا بطل', { type: 'warn' }); return; }
            if (b.classList.contains('locked')) { play('boing'); if (window.UI) UI.toast('أنهِ المرحلة اللي قبلها الأول 🔒', { type: 'warn' }); return; }
            play('whoosh'); showIntro(lv);
        });
        const saved = read(RUN, null);
        $('map-resume').classList.toggle('hidden', !(saved && saved.cat === classKey() && (saved.world || 'forest') === world.id && saved.qs && saved.i < saved.qs.length));
    }
    function mapPhoto() { const src = 'assets/scenes/map-' + world.id + '.jpg'; const im = new Image(); im.onload = () => { $('map').style.backgroundImage = 'linear-gradient(rgba(16,28,22,0.55), rgba(16,28,22,0.75)), url(' + src + ')'; $('map').style.backgroundSize = 'cover'; }; im.onerror = () => { $('map').style.backgroundImage = ''; }; im.src = src; }
    function showMap() { mapPhoto(); hideSheet(); $('intro').classList.add('hidden'); $('done').classList.add('hidden'); renderMap(); $('map').classList.remove('hidden'); }

    // ---------- intro ----------
    let pendingLevel = null;
    function showIntro(lv) {
        pendingLevel = lv;
        $('intro-num').textContent = world.title + ' · المرحلة ' + AR(lv.id) + ' من ' + AR(LV().length);
        $('intro-em').textContent = lv.ic; $('intro-name').textContent = lv.name;
        $('intro-text').textContent = lv.intro + ' قدامك ' + AR(lv.obst.length) + ' عقبة، وكل إجابة صحيحة تنوّر فانوس 🏮';
        $('map').classList.add('hidden'); $('intro').classList.remove('hidden');
    }

    // ---------- play ----------
    let level = null, endX = 0, busy = false;
    async function startLevel(lv, resume) {
        const cat = classKey(); if (!cat) return showMap();
        let items; try { items = await loadBank(cat); } catch (e) { if (window.UI) UI.toast('تعذر تحميل الأسئلة، تأكد من الإنترنت ثم حاول مرة أخرى', { type: 'warn' }); return showMap(); }
        level = lv;
        if (!resume) run = { cat, world: world.id, level: lv.id, i: 0, lanterns: 0, qs: pickQuestions(cat, items, lv.obst.length), marks: [], streak: 0, best: 0 };
        write(RUN, run);
        $('intro').classList.add('hidden'); $('map').classList.add('hidden'); $('done').classList.add('hidden');
        $('title').textContent = heroTitle(); $('subtitle').textContent = lv.ic + ' ' + lv.name + ' · المرحلة ' + AR(lv.id);
        $('hero-name-text').textContent = playerName() || HERO(); $('hero-face').setAttribute('href', playerPhoto());
        { const p = $('pet'), n = PET_SPRITE[lv.pet.ic], s = n && spr('pet-' + n); p.title = lv.pet.name; if (s) { p.innerHTML = '<img src="' + s + '" alt="">'; p.dataset.walk = s; p.dataset.jump = spr('pet-' + n + '-jump') || s; p.classList.add('img'); } else { p.textContent = lv.pet.ic; p.classList.remove('img'); delete p.dataset.walk; } }
        $('lanterns-total').textContent = AR(lv.obst.length);
        await spritesReady; setupHero();
        const built = buildScene(lv); endX = built.endX;
        renderTrack(); fit();
        cam = run.i === 0 ? camFor(obstX(0)) - 700 : camFor(obstX(run.i)) - 500; applyCam();
        heroState('idle');
        amb(lv.th.stars ? 'night' : 'birds');
        const name = playerName();
        // never wait on the voice for more than a few seconds (a slow online voice must not freeze the game)
        await Promise.race([wait(4000), say((name ? 'يلا يا ' + name + '! ' : (girl() ? 'يلا يا بطلة! ' : 'يلا يا بطل! ')) + (run.i === 0 ? 'المرحلة ' + AR(lv.id) + ': ' + lv.name + '. قدامك ' + AR(lv.obst.length) + ' عقبة، وكل عقبة ليها سؤال. وصاحبك ' + lv.pet.name + ' ماشي وراك. يلا بينا!' : 'نكمل مغامرتنا من العقبة رقم ' + AR(run.i + 1)))]);
        await wait(name ? 2600 : 1800);
        arrive();
    }
    function renderTrack() {
        $('track').innerHTML = level.obst.map((k, i) => '<i class="' + (i < run.i ? (run.marks[i] ? 'done' : 'miss') : i === run.i ? 'cur' : '') + '">' + OB[k].ic + '</i>').join('');
        $('lanterns').textContent = AR(run.lanterns);
    }
    let tries = 0, current = null;
    async function arrive() {
        const i = run.i;
        if (i >= level.obst.length) return finishLevel();
        renderTrack(); hideCallout();
        heroState('walk'); amb('step');
        const target = camFor(obstX(i));
        await tween(cam, target, Math.max(900, Math.abs(target - cam) * 1.6), v => { cam = v; applyCam(); });
        heroState('idle');
        const ob = OB[level.obst[i]];
        amb(ob.amb);
        showCallout('❓ ' + ob.name, obstX(i));
        openQuestion(ob, run.qs[i]);
    }
    function openQuestion(ob, q) {
        current = q; tries = 0;
        $('ob-em').textContent = ob.ic; $('ob-name').textContent = ob.name; $('ob-line').textContent = ob.line;
        const img = $('q-img');
        if (q.image && window.KidsTheme) { img.innerHTML = KidsTheme.richHtml(q.image, 120); img.classList.remove('hidden'); } else { img.innerHTML = ''; img.classList.add('hidden'); }
        $('q-text').innerHTML = esc(q.question);
        $('expl').classList.add('hidden'); $('btn-next').classList.add('hidden');
        const ch = shuffle(choicesOf(q));
        $('choices').innerHTML = ch.map(c => '<button type="button" class="f-choice' + (isLatin(c) ? ' latin' : '') + (c.length > 22 ? ' long' : '') + '" data-v="' + esc(c) + '">' + esc(c) + '</button>').join('');
        $('choices').querySelectorAll('.f-choice').forEach(b => b.onclick = () => answer(b));
        $('sheet').classList.remove('hidden'); $('sheet').scrollTop = 0;
        setTimeout(fit, 50);
        const name = playerName();
        const line = (name ? name + '، ' : '') + ob.line;
        if (readOn()) say(line + '. ' + q.question, ch); else say(line);
    }
    function hideSheet() { $('sheet').classList.add('hidden'); setTimeout(fit, 50); }
    async function answer(btn) {
        if (busy) return; const v = btn.dataset.v, ok = v === String(current.correct_answer).trim();
        if (ok) {
            busy = true;
            btn.classList.add('ok'); $('choices').querySelectorAll('.f-choice').forEach(b => b.disabled = true);
            const r = btn.getBoundingClientRect(); if (window.KidsTheme) { KidsTheme.burst(r.left + r.width / 2, r.top + r.height / 2, 14); KidsTheme.playWow(); }
            run.marks[run.i] = true; run.lanterns++; run.streak++; run.best = Math.max(run.best, run.streak);
            heroState('cheer');
            const ob = OB[level.obst[run.i]];
            const cheers = ['برافو', 'شاطر', 'ممتاز', 'عظيم', 'يا سلام عليك', 'إجابة صحيحة'];
            say(cheers[Math.floor(Math.random() * cheers.length)] + ' ' + who() + '! ' + ob.pass);
            $('lanterns').textContent = AR(run.lanterns);
            await wait(1300);
            hideSheet();
            await passObstacle(ob);
        } else {
            tries++;
            btn.classList.add('no', 'kids-shake'); btn.disabled = true; play('boing'); heroState('sad');
            if (tries === 1) { say('مش دي ' + who() + '، فكّر تاني وجرّب اختيار تاني'); return; }
            busy = true;
            run.marks[run.i] = false; run.streak = 0;
            if (window.Progress) { try { Progress.addWrong(current, 'kids_forest'); } catch (e) {} }
            const correct = String(current.correct_answer).trim();
            $('choices').querySelectorAll('.f-choice').forEach(b => { b.disabled = true; if (b.dataset.v === correct) b.classList.add('ok'); });
            $('expl').textContent = '✅ الإجابة الصحيحة: ' + correct + (current.explanation && current.explanation.length < 140 && !/^إجابة صحيحة/.test(current.explanation) ? ' · ' + current.explanation : '');
            $('expl').classList.remove('hidden');
            say('مش مشكلة ' + who() + '. الإجابة الصحيحة هي: ' + correct + '. العصفور هيساعدك تعدّي المرة دي', null);
            $('btn-next').classList.remove('hidden'); $('sheet').scrollTop = $('sheet').scrollHeight;
            $('btn-next').onclick = async () => { $('btn-next').onclick = null; hideSheet(); await passObstacle(OB[level.obst[run.i]], true); };
            busy = false;
        }
    }
    async function passObstacle(ob, helped) {
        busy = true; hideCallout();
        const x = obstX(run.i);
        if (helped) { const bird = document.createElement('div'); bird.className = 'f-callout'; bird.textContent = '🐦'; bird.style.left = '30%'; bird.style.top = '22%'; bird.style.fontSize = '2em'; bird.style.background = 'transparent'; bird.style.boxShadow = 'none'; $('scene').appendChild(bird); setTimeout(() => bird.remove(), 1600); play('star'); }
        heroState('jump'); if (ob.amb === 'water') amb('water'); else play('whoosh');
        await tween(cam, camPast(x), 900, v => { cam = v; applyCam(); });
        heroState('idle');
        run.i++; write(RUN, run);
        busy = false;
        await wait(250);
        arrive();
    }
    async function finishLevel() {
        renderTrack();
        heroState('walk');
        await tween(cam, camFor(endX) - 0.1 * vw, 1600, v => { cam = v; applyCam(); });
        heroState('cheer');
        localStorage.removeItem(RUN);
        const n = level.obst.length, l = run.lanterns, stars = l >= n ? 3 : l >= Math.ceil(n * 0.7) ? 2 : 1;
        const step = window.Piggy ? Piggy.step() : 10, coins = l * step;
        // piggy bank: the lanterns become piasters (same keys as piggy.js)
        try { const bal = (parseInt(localStorage.getItem('piggyBalance')) || 0) + coins; localStorage.setItem('piggyBalance', String(bal)); localStorage.setItem('piggyEarnedTotal', String((parseInt(localStorage.getItem('piggyEarnedTotal')) || 0) + coins)); if (bal > (parseInt(localStorage.getItem('piggyBest')) || 0)) localStorage.setItem('piggyBest', String(bal)); } catch (e) {}
        const p = progOf(run.cat); p.stars[level.id] = Math.max(p.stars[level.id] || 0, stars); p.unlocked = Math.max(p.unlocked, Math.min(LV().length, level.id + 1)); p.coins += coins; p.done++; saveProg(run.cat, p);
        try {
            const sessions = read('userSessions', []);
            const session = { date: new Date().toLocaleString('ar-EG'), email: localStorage.getItem('userEmail') || 'غير معروف', score: l, total: n, type: 'kids_forest', wrong: [], bestStreak: run.best, title: '🧭 ' + world.title + ' · ' + level.name, at: Date.now() };
            sessions.push(session); write('userSessions', sessions);
            if (window.Progress) Progress.onSessionSaved(session);
        } catch (e) {}
        $('done-title').textContent = stars === 3 ? 'كل الفوانيس نوّرت! 🏆' : 'وصلت الكنز!';
        $('done-stars').innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? '' : 'off') + '">★</span>').join('');
        $('done-lanterns').textContent = AR(l) + ' / ' + AR(n);
        $('done-coins').textContent = window.Piggy ? Piggy.words(coins) : AR(coins) + ' قرش';
        const last = level.id >= LV().length;
        $('done-text').textContent = last ? world.done : (stars === 3 ? 'ممتاز! المرحلة الجاية اتفتحت.' : 'برافو! المرحلة الجاية اتفتحت، وتقدر تعيد دي علشان تنوّر كل الفوانيس.');
        $('btn-next-level').classList.toggle('hidden', last);
        $('done').classList.remove('hidden');
        play('tada'); if (window.KidsTheme) KidsTheme.confetti(stars === 3 ? 5000 : 3000);
        say('مبروك ' + who() + '! وصلت الكنز ونوّرت ' + AR(l) + ' فانوس من ' + AR(n) + '، وكسبت ' + (window.Piggy ? Piggy.words(coins) : coins + ' قرش') + ' لحصالتك. ' + (last ? 'خلّصت ' + world.name + ' كلها، أنت مغامر حقيقي!' : 'يلا نروح المرحلة الجاية!'));
    }

    // ---------- buttons ----------
    const syncSound = () => { const t = soundOn() ? '🔊' : '🔇'; $('btn-sound').textContent = t; $('map-sound').textContent = t; };
    const toggleSound = () => { localStorage.setItem('soundOn', soundOn() ? 'false' : 'true'); syncSound(); if (!soundOn() && window.speechSynthesis) speechSynthesis.cancel(); else play('pop'); };
    $('btn-sound').onclick = toggleSound; $('map-sound').onclick = toggleSound; syncSound();
    $('btn-map').onclick = () => { if (window.speechSynthesis) speechSynthesis.cancel(); play('whoosh'); showMap(); };
    $('btn-intro-map').onclick = () => { play('whoosh'); showMap(); };
    $('btn-done-map').onclick = () => { play('whoosh'); showMap(); };
    $('btn-start').onclick = () => { ctx(); play('go'); startLevel(pendingLevel, false); };
    $('btn-resume').onclick = () => { const s = read(RUN, null); if (!s) return renderMap(); world = WORLDS.find(w => w.id === (s.world || 'forest')) || WORLDS[0]; localStorage.setItem('forest_world', world.id); run = s; ctx(); play('go'); startLevel(LV()[s.level - 1], true); };
    $('btn-next-level').onclick = () => { play('whoosh'); showIntro(LV()[Math.min(LV().length, level.id + 1) - 1]); };
    $('btn-replay').onclick = () => { play('whoosh'); showIntro(level); };
    $('btn-read').onclick = () => { if (!current) return; const ch = [...$('choices').querySelectorAll('.f-choice')].map(b => b.dataset.v); say(current.question, ch); };
    window.addEventListener('resize', fit);
    document.addEventListener('visibilitychange', () => { if (document.hidden && window.speechSynthesis) speechSynthesis.cancel(); });
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (e) {} }

    // ---------- start: the map ----------
    $('title').textContent = heroTitle();
    $('hero-face').setAttribute('href', playerPhoto());
    $('hero-name-text').textContent = playerName() || HERO();
    buildScene(LV()[0]); fit(); cam = camFor(obstX(0)) - 700; applyCam();
    showMap();
})();
