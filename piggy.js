// "زوّد رصيد حصالتك" — kids level 4. Same quiz engine and the level-2 question bank, but the hero track becomes a
// piggy bank: +10 piasters per correct answer, −10 per wrong one, the balance is read aloud in Egyptian Arabic,
// every new high is celebrated, and the child can cash the balance as a bank cheque (which resets it to zero).
(function () {
    const TYPE = 'kids_piggy';
    // قيمة المسألة الواحدة بالقروش (يضبطها الوالدان في صفحة ملفي، مفتاح piggyStep)؛ واحدة للحصالة ولتدريبات الرياضيات
    const STEPS = [5, 10, 25, 50, 100];
    const step = () => { const v = parseInt(localStorage.getItem('piggyStep')) || 10; return STEPS.includes(v) ? v : 10; };
    const K = { bal: 'piggyBalance', best: 'piggyBest', name: 'piggyName', total: 'piggyEarnedTotal', cheques: 'piggyCheques', log: 'piggyChequeLog' };
    const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
    const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
    const num = k => parseInt(get(k, '0')) || 0;
    const ar = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const soundOn = () => get('soundOn', 'true') !== 'false';
    const page = location.pathname.toLowerCase();

    const Piggy = { active: false, TYPE };
    window.Piggy = Piggy;
    // the piggy-bank icon (assets/piggy.svg) used everywhere instead of the 🐷 emoji
    const PIG = '<img class="pig-img" src="assets/piggy.svg" alt="">';
    Piggy.icon = PIG;
    // The piggy name, else the name used in rooms (so a child joining a piggy room is greeted by name too)
    Piggy.name = () => (get(K.name, '') || get('mp_playerName', '')).trim().slice(0, 20);
    Piggy.balance = () => num(K.bal);
    Piggy.step = step; Piggy.STEPS = STEPS;
    Piggy.onChange = null; // pages hook this to refresh their own balance display
    const log = () => { try { return JSON.parse(get(K.log, '[]')) || []; } catch (e) { return []; } };
    Piggy.log = log;

    // 250 -> "جنيهان و٥٠ قرشاً"
    function words(p) {
        p = Math.max(0, p | 0);
        const pounds = Math.floor(p / 100), pt = p % 100;
        const pw = pounds === 0 ? '' : pounds === 1 ? 'جنيه واحد' : pounds === 2 ? 'جنيهان' : pounds <= 10 ? ar(pounds) + ' جنيهات' : ar(pounds) + ' جنيهاً';
        const qw = pt === 0 ? '' : pt === 1 ? 'قرش واحد' : pt === 2 ? 'قرشان' : pt <= 10 ? ar(pt) + ' قروش' : ar(pt) + ' قرشاً';
        if (!pw && !qw) return 'صفر قرش';
        return pw && qw ? pw + ' و' + qw : (pw || qw);
    }
    // 250 -> "٢٫٥٠ جنيه" (cheque box)
    const figure = p => ar(Math.floor(p / 100)) + '٫' + ar(String(p % 100).padStart(2, '0')) + ' جنيه';
    Piggy.words = words;
    // بابا وماما ورقم بابا من بطاقة البطل (صفحة ملفي): توقيع الشيك وزر «ابعت لبابا» على واتساب
    const signer = () => { const f = get('kids_father', '').trim(), m = get('kids_mother', '').trim(); return (f || m) ? [m && 'ماما ' + m, f && 'بابا ' + f].filter(Boolean).join(' / ') : 'ماما / بابا'; };
    const fatherPhone = () => { let p = get('kids_father_phone', '').replace(/[^0-9٠-٩+]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); p = p.replace(/^[+]/, '').replace(/^00/, ''); if (/^01[0-9]{9}$/.test(p)) p = '2' + p; return /^[0-9]{10,15}$/.test(p) ? p : ''; };

    // ---------- speech: balance messages get priority, the question reading waits its turn ----------
    let busy = false, pending = null, origSpeak = null;
    function patchSpeak() {
        if (!window.KidsTheme || origSpeak) return;
        origSpeak = KidsTheme.speak;
        KidsTheme.speak = function (t, c) { if (busy) { pending = [t, c]; return; } origSpeak.call(KidsTheme, t, c); };
    }
    // Voices load lazily on some phones: warm the list up so the first message picks the right one
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices()); } catch (e) {} }
    const voiceFor = re => { try { return speechSynthesis.getVoices().find(v => re.test(v.lang)); } catch (e) { return null; } };
    const arabicVoice = () => voiceFor(/^ar[-_]EG/i) || voiceFor(/^ar/i);
    function playClip(file) {
        if (!soundOn()) return;
        try { const a = new Audio(file); a.volume = 1; a.play().catch(() => {}); } catch (e) {}
    }
    // Speaks the Arabic message exactly the way the standalone Mahmoud app does: an Arabic voice installed on the phone
    // if there is one, otherwise the audio from Google's online TTS. Never English phrases. Resolves when the reading is
    // over (the maths trainer waits for it before the next problem). quiet: no sound clips, only the voice.
    function speak(text, kind, quiet) {
        if (!soundOn()) return Promise.resolve();
        kind = kind || 'good';
        patchSpeak();
        let done = null; const finished = new Promise(r => { done = r; });
        busy = true;
        const release = () => { busy = false; if (pending && origSpeak) { const p = pending; pending = null; origSpeak.call(KidsTheme, p[0], p[1]); } done(); };
        setTimeout(() => { if (busy) release(); }, 15000); // never block the question reading for good
        try {
            if ('speechSynthesis' in window) speechSynthesis.cancel();
            if (window.KidsTheme && KidsTheme.stopFallback) KidsTheme.stopFallback();
            const arV = ('speechSynthesis' in window) ? arabicVoice() : null;
            if (arV) {
                const u = new SpeechSynthesisUtterance();
                u.text = KidsTheme && KidsTheme.arabicizeForSpeech ? KidsTheme.arabicizeForSpeech(text).replace(/ كم؟/g, '؟') : text;
                u.lang = arV.lang; u.voice = arV; u.rate = 0.92; u.pitch = 1.1;
                u.onend = release; u.onerror = release;
                speechSynthesis.speak(u);
            } else if (window.KidsTheme && KidsTheme.speakOnline) {
                // no Arabic voice on this phone: Google's Arabic audio (the Mahmoud fallback); if even that fails, just the clip
                KidsTheme.speakOnline(text).then(ok => { if (!ok && kind === 'bad' && !quiet) playClip('assets/lose.mp3'); release(); });
            } else {
                if (kind === 'bad' && !quiet) playClip('assets/lose.mp3');
                release();
            }
        } catch (e) { release(); }
        return finished;
    }

    // ---------- overlays (name prompt, cheque) ----------
    function overlay(html) {
        let el = document.getElementById('piggy-overlay');
        if (!el) { el = document.createElement('div'); el.id = 'piggy-overlay'; document.body.appendChild(el); }
        el.innerHTML = html;
        el.style.display = 'flex';
        return el;
    }
    const closeOverlay = () => { const el = document.getElementById('piggy-overlay'); if (el) el.style.display = 'none'; };

    function askName(done) {
        const el = overlay('<div class="piggy-card"><div class="pg-pig">' + PIG + '</div><h3>اكتب اسمك يا بطل</h3><p>عشان نكتب اسمك على الشيك ونقول لك مبروك باسمك</p>' +
            '<input id="piggy-name-input" maxlength="20" placeholder="اسمك هنا…" autocomplete="off"><button type="button" class="pg-go">يلا نبدأ 🚀</button></div>');
        const input = el.querySelector('#piggy-name-input');
        input.value = Piggy.name();
        const go = () => { const n = input.value.trim().slice(0, 20); if (!n) { input.focus(); input.classList.add('kids-shake'); setTimeout(() => input.classList.remove('kids-shake'), 600); return; } set(K.name, n); closeOverlay(); done(n); };
        el.querySelector('.pg-go').onclick = go;
        input.onkeydown = e => { if (e.key === 'Enter') go(); };
        setTimeout(() => input.focus(), 50);
    }
    Piggy.askName = askName;

    function showCheque() {
        const bal = Piggy.balance();
        if (bal <= 0) {
            if (window.UI) UI.toast('حصالتك فاضية دلوقتي، جاوب صح عشان تزوّد رصيدك 🐷', { type: 'info' });
            return;
        }
        const name = Piggy.name() || 'البطل الصغير';
        const n = num(K.cheques) + 1;
        const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        const el = overlay('<div class="cheque">' +
            '<div class="ch-stamp">✔ مستحق الدفع</div>' +
            '<div class="ch-head"><span>🏦 بنك الأبطال الصغار</span><span>شيك رقم ' + ar(n) + '</span></div>' +
            '<div class="ch-date">التاريخ: ' + date + '</div>' +
            '<div class="ch-line">يُرجى صرف مبلغ <b>' + words(bal) + '</b> فقط لا غير</div>' +
            '<div class="ch-line">للبطل / البطلة: <b>' + esc(name) + '</b></div>' +
            '<div class="ch-amount">' + figure(bal) + '</div>' +
            '<div class="ch-sign"><span>التوقيع: ـــــــــــــــ</span><span>' + esc(signer()) + '</span></div>' +
            '<div class="ch-btns"><button type="button" class="ch-done">✅ تم الصرف</button>' + (fatherPhone() ? '<button type="button" class="ch-wa">💬 ابعت لبابا</button>' : '') + '<button type="button" class="ch-back">رجوع</button></div></div>');
        const wa = el.querySelector('.ch-wa');
        if (wa) wa.onclick = () => {
            const msg = '🧾 شيك رقم ' + ar(n) + ' من بنك الأبطال الصغار\nللبطل: ' + name + '\nالمبلغ: ' + words(bal) + ' (' + figure(bal) + ')\nالتاريخ: ' + date + '\nيُرجى الصرف 😄';
            window.open('https://wa.me/' + fatherPhone() + '?text=' + encodeURIComponent(msg), '_blank');
        };
        el.querySelector('.ch-back').onclick = closeOverlay;
        el.querySelector('.ch-done').onclick = () => {
            set(K.cheques, n);
            set(K.bal, 0); set(K.best, 0);
            const l = log(); l.unshift({ n, amount: bal, at: Date.now(), name }); set(K.log, JSON.stringify(l.slice(0, 50)));
            // anonymous usage counters, flushed to stats/daily by finish-online.js on the next results page
            set('piggyPendingCheques', num('piggyPendingCheques') + 1);
            set('piggyPendingCashed', num('piggyPendingCashed') + bal);
            closeOverlay();
            render(false);
            if (typeof Piggy.onChange === 'function') { try { Piggy.onChange(); } catch (e) {} }
            if (window.KidsTheme) { KidsTheme.play('tada'); KidsTheme.confetti(4000); KidsTheme.cheer('🧾 مبروك، اتصرف الشيك!', '#ffd166'); }
            speak('مبروك يا بطل ' + name + '! صرفت شيك بمبلغ ' + words(bal) + '. يلا نبدأ رصيد جديد', 'cheque');
            if (window.UI) UI.toast('رصيد الحصالة رجع صفر، ابدأ تجميع من جديد 🐷', { type: 'ok' });
        };
    }
    Piggy.cheque = showCheque;

    // ---------- home: start the level ----------
    Piggy.start = function () {
        const go = () => {
            ['mp_roomCode', 'mp_isHost', 'selectedJuz', 'selectedSura', 'mp_pick', 'resumeNow'].forEach(k => localStorage.removeItem(k));
            localStorage.setItem('quizType', TYPE);
            localStorage.setItem('quizTitle', '🐷 زوّد رصيد حصالتك');
            location.href = 'quiz.html';
        };
        if (Piggy.name()) go(); else askName(go);
    };

    // ---------- quiz page: the piggy bar replaces the hero track ----------
    let bar = null;
    function render(animate, delta) {
        if (!bar) return;
        const bal = Piggy.balance();
        const amount = bar.querySelector('.amount');
        amount.textContent = words(bal);
        bar.querySelector('.who').textContent = Piggy.name() || 'البطل';
        bar.querySelector('.pig').innerHTML = PIG + (bal >= 500 ? '<span class="pig-x">💎</span>' : bal >= 100 ? '<span class="pig-x">✨</span>' : '');
        if (animate) {
            amount.classList.remove('pop', 'dip'); void amount.offsetWidth;
            amount.classList.add(delta > 0 ? 'pop' : 'dip');
            const f = document.createElement('span');
            f.className = 'piggy-delta ' + (delta > 0 ? 'up' : 'down');
            f.textContent = (delta > 0 ? '+' : '−') + ar(Math.abs(delta));
            bar.appendChild(f);
            setTimeout(() => f.remove(), 1200);
        }
    }
    function buildBar() {
        const track = document.getElementById('kids-hero-track');
        const host = track ? track.parentElement : document.querySelector('.container');
        if (!host) return;
        if (track) track.style.display = 'none';
        bar = document.createElement('div');
        bar.id = 'piggy-bar';
        bar.innerHTML = '<div class="pig">' + PIG + '</div><div class="bal"><small>رصيد حصالة <b class="who"></b> <button type="button" class="edit" title="تغيير الاسم">✏️</button></small><div class="amount"></div></div>' +
            '<button type="button" class="cheque-btn">🧾 اصرف شيك</button>';
        if (track) host.insertBefore(bar, track); else host.prepend(bar);
        bar.querySelector('.cheque-btn').onclick = showCheque;
        bar.querySelector('.edit').onclick = () => askName(() => render(false));
        render(false);
    }
    function smallCelebration(bal, quiet) {
        if (!window.KidsTheme) return;
        setTimeout(() => {
            if (!quiet) KidsTheme.play('star');
            KidsTheme.burst(window.innerWidth / 2, 120, 18);
            KidsTheme.cheer('🎉 وصلت ' + words(bal) + '!', '#ffd166');
        }, 1300);
    }
    function bigCelebration(bal, quiet) {
        if (!window.KidsTheme) return;
        setTimeout(() => {
            if (!quiet) KidsTheme.play('tada');
            KidsTheme.confetti(5000);
            const el = document.createElement('div');
            el.className = 'piggy-pound';
            el.innerHTML = '<div class="coin">🏆</div><div>جنيه كامل!</div><small>' + words(bal) + ' في حصالتك</small>';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3200);
        }, 1300);
    }
    // Returns a promise that resolves when the spoken message is over; opts.quiet = voice only, no sound effects
    function onAnswer(ok, opts) {
        const quiet = !!(opts && opts.quiet);
        let bal = Piggy.balance();
        const best = num(K.best);
        const STEP = step();
        if (ok) { bal += STEP; set(K.total, num(K.total) + STEP); } else bal = Math.max(0, bal - STEP);
        set(K.bal, bal);
        render(true, ok ? STEP : -STEP);
        const who = Piggy.name() ? 'يا بطل ' + Piggy.name() : 'يا بطل';
        if (ok) {
            const newHigh = bal > best;
            if (newHigh) set(K.best, bal);
            const fullPound = newHigh && bal % 100 === 0;
            if (fullPound) bigCelebration(bal, quiet); else if (newHigh) smallCelebration(bal, quiet);
            return new Promise(res => setTimeout(() => speak(fullPound ? 'جنيه كامل ' + who + '! برافو عليك، معاك دلوقتي ' + words(bal) : 'مبروك ' + who + '! معاك دلوقتي ' + words(bal), fullPound ? 'pound' : 'good', quiet).then(res), quiet ? 300 : 1000));
        }
        return new Promise(res => setTimeout(() => speak('يا خسارة ' + who + '! رصيدك نقص ' + words(STEP) + '. معاك دلوقتي ' + words(bal), 'bad', quiet).then(res), quiet ? 300 : 900));
    }

    // تدريبات الرياضيات (math.html) تستخدم الحصالة نفسها: إجابة صحيحة تزوّد الرصيد بقيمة المسألة والخطأ يخصمها
    Piggy.answer = onAnswer;

    if (page.endsWith('quiz.html') && get('quizType', '') === TYPE) {
        Piggy.active = true;
        const init = () => { document.body.classList.add('piggy-mode'); buildBar(); patchSpeak(); };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
        document.addEventListener('quiz-answer', e => onAnswer(!!(e.detail && e.detail.ok)));
    }

    // ---------- results page: show the balance and offer the cheque ----------
    if (page.endsWith('finish.html')) {
        const init = () => {
            let session = null;
            try { session = JSON.parse(localStorage.getItem('userSessions') || '[]').pop(); } catch (e) {}
            if (!session || session.type !== TYPE) return;
            document.body.classList.add('piggy-mode');
            const box = document.createElement('div');
            box.className = 'piggy-finish';
            box.innerHTML = '<div class="pig">' + PIG + '</div><div class="t"><small>رصيد حصالة ' + esc(Piggy.name() || 'البطل') + ' دلوقتي</small><b>' + words(Piggy.balance()) + '</b></div>' +
                '<div class="btns"><button type="button" class="cheque-btn">🧾 اصرف شيك</button><button type="button" class="again">🐷 العب تاني</button></div>';
            const container = document.querySelector('.container');
            const h1 = container && container.querySelector('h1');
            if (h1) h1.after(box); else if (container) container.prepend(box);
            Piggy.onChange = () => { const b = box.querySelector('.t b'); if (b) b.textContent = words(Piggy.balance()); };
            box.querySelector('.cheque-btn').onclick = showCheque;
            box.querySelector('.again').onclick = () => Piggy.start();
            setTimeout(() => speak('رصيد حصالتك دلوقتي ' + words(Piggy.balance()), 'info'), 1800);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    }

    // ---------- profile page: balance, totals and the cheque history ----------
    if (page.endsWith('profile.html')) {
        const init = () => {
            const card = document.getElementById('piggy-card');
            if (!card) return;
            // the card is always shown: it also holds the parents' "value per question" setting (piggyStep)
            const stat = (ic, v, t) => '<div class="stat"><span class="ic">' + ic + '</span><b>' + v + '</b><span>' + t + '</span></div>';
            const refresh = () => {
                const cur = log();
                document.getElementById('pg-name').textContent = Piggy.name() || 'البطل';
                document.getElementById('pg-stats').innerHTML =
                    stat('💰', words(Piggy.balance()), 'الرصيد الحالي') + stat('🏆', words(num(K.total)), 'كل ما كسبه') +
                    stat('🧾', ar(cur.length), 'شيكات مصروفة') + stat('💵', words(cur.reduce((a, c) => a + (c.amount || 0), 0)), 'إجمالي الشيكات');
                document.getElementById('pg-log-sub').textContent = cur.length ? 'آخر ' + ar(Math.min(cur.length, 50)) + ' شيك' : 'لا توجد شيكات بعد، جمّع الرصيد ثم اضغط «اصرف شيك»';
                document.getElementById('pg-log').innerHTML = cur.map(c => '<div class="lb-row"><span class="lb-rank">' + ar(c.n) + '</span><span class="lb-name">' + esc(c.name || '') + '<small> · ' + new Date(c.at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) + '</small></span><span class="lb-score">' + words(c.amount) + '</span></div>').join('');
            };
            Piggy.onChange = refresh;
            refresh();
            document.getElementById('pg-cheque').onclick = showCheque;
            document.getElementById('pg-play').onclick = () => Piggy.start();
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    }
})();
