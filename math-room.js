// Maths rooms on top of math.html: the host creates a room from the header button (same options as the sidebar +
// number of problems), friends join through the normal lobby, and everyone solves the SAME problems in the same
// order (a seed from the room code drives the generator on every phone, so nothing is stored per problem).
// Scores are pushed after every answer; the finish page shows the podium like any other room.
import { db, ref, set, get, update, onValue } from './firebase-init.js';
import { getLocalUserId, saveRoomToLocal, clearMpState, isRoomExpired, escapeHtml, AVATARS, fetchRoom } from './mp-common.js';

const $ = id => document.getElementById(id);
const myId = getLocalUserId();
const HINDI = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

// ==========================================
// 1) Create a room (header button -> options dialog -> lobby)
// ==========================================
const opts = Object.assign({ count: 10 }, window.MathDrill ? window.MathDrill.getSettings() : {});

const GROUPS = [
    { key: 'mode', label: 'نوع التدريب', items: [['add_sub', '➕➖ جمع وطرح'], ['multiplication', '✖️ ضرب'], ['word', '📖 مسائل كلامية']] },
    { key: 'digits', label: 'عدد الأرقام', modes: ['add_sub'], items: [[2, 'رقمين (٢)'], [3, '٣ أرقام (٣)']] },
    { key: 'opType', label: 'نوع العملية', modes: ['add_sub'], items: [['+', 'جمع ➕'], ['-', 'طرح ➖'], ['mix', 'مختلط 🎲']] },
    { key: 'table', label: 'جدول الضرب', modes: ['multiplication'], select: [['all', 'كل الجداول (عشوائي)']].concat(Array.from({ length: 11 }, (_, i) => [String(i + 2), 'جدول ' + HINDI(i + 2)])) },
    { key: 'layout', label: 'شكل المسألة', modes: ['add_sub', 'multiplication'], items: [['vertical', 'رأسي ⬇️'], ['horizontal', 'أفقي ➡️']] },
    { key: 'wdiff', label: 'مستوى الصعوبة', modes: ['word'], items: [['easy', 'سهل 🟢'], ['medium', 'متوسط 🟡'], ['hard', 'سوبر 🔴']] },
    { key: 'wop', label: 'نوع المسألة', modes: ['word'], items: [['+', 'جمع ➕'], ['-', 'طرح ➖'], ['×', 'ضرب ✖️'], ['mix', 'مختلط 🎲']] },
    { key: 'count', label: 'عدد المسائل', items: [[10, '١٠ مسائل'], [20, '٢٠ مسألة'], [30, '٣٠ مسألة']] }
];

function renderOptions() {
    const box = $('roomOptions');
    if (!box) return;
    box.innerHTML = '';
    GROUPS.forEach(g => {
        if (g.modes && !g.modes.includes(opts.mode)) return;
        const wrap = document.createElement('div');
        wrap.className = 'control-group';
        wrap.innerHTML = '<label class="sidebar-label">' + g.label + ':</label>';
        if (g.select) {
            const sel = document.createElement('select');
            sel.className = 'custom-select';
            g.select.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (String(opts[g.key]) === v) o.selected = true; sel.appendChild(o); });
            sel.onchange = () => { opts[g.key] = sel.value; };
            wrap.appendChild(sel);
        } else {
            const seg = document.createElement('div');
            seg.className = 'segmented-control';
            g.items.forEach(([v, t]) => {
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'segment-btn' + (opts[g.key] === v ? ' active' : ''); b.textContent = t;
                b.onclick = () => { opts[g.key] = v; renderOptions(); if (window.KidsTheme) KidsTheme.play('pop'); };
                seg.appendChild(b);
            });
            wrap.appendChild(seg);
        }
        box.appendChild(wrap);
    });
}

async function uniqueCode() {
    for (let i = 0; i < 8; i++) {
        const code = String(10000 + Math.floor(Math.random() * 90000));
        const snap = await get(ref(db, 'rooms/' + code));
        if (!snap.exists()) return code;
    }
    throw new Error('تعذر إيجاد كود غرفة حر، حاول مرة أخرى');
}

async function createRoom() {
    const btn = $('createRoomBtn');
    btn.disabled = true; btn.textContent = '⏳ جاري إنشاء الغرفة...';
    try {
        const code = await uniqueCode();
        const pick = { mode: opts.mode, digits: opts.digits, opType: opts.opType, layout: opts.layout, table: opts.table, wdiff: opts.wdiff, wop: opts.wop };
        const room = {
            code, hostId: myId, status: 'waiting', createdAt: Date.now(), round: 1, currentQuestionIndex: 0, phase: 'question',
            settings: { category: 'math', mode: 'questions', val: opts.count, qTime: 30, maxPlayers: 10, showLive: true, sync: false, teams: false, roomName: '', questionCount: 0, pick: JSON.stringify(pick) },
            players: {}
        };
        await set(ref(db, 'rooms/' + code), room);
        saveRoomToLocal(code, room);
        window.location.href = 'lobby.html?room=' + code;
    } catch (e) {
        if (window.UI) window.UI.fail(e, 'تعذر إنشاء الغرفة'); else alert('تعذر إنشاء الغرفة: ' + (e.message || e));
        btn.disabled = false; btn.textContent = '🚀 أنشئ الغرفة';
    }
}

const modal = $('roomModal');
if ($('roomBtn') && modal) {
    const open = () => { Object.assign(opts, window.MathDrill ? window.MathDrill.getSettings() : {}); renderOptions(); modal.classList.remove('hidden'); };
    const close = () => modal.classList.add('hidden');
    $('roomBtn').onclick = open;
    $('closeRoomModalBtn').onclick = close;
    $('cancelRoomBtn').onclick = close;
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    $('createRoomBtn').onclick = createRoom;
}

// ==========================================
// 2) Play a started room (arrived from the lobby: mp_roomCode + quizType === 'math')
// ==========================================
const roomCode = localStorage.getItem('mp_roomCode');
if (roomCode && localStorage.getItem('quizType') === 'math' && window.MathDrill) {
    playRoom(roomCode).catch(e => { console.error(e); solo(); });
}

function solo() { clearMpState(); if (window.MathDrill) window.MathDrill.startSolo(); }

async function playRoom(code) {
    const room = await fetchRoom(code);
    const s = (room && room.settings) || {};
    if (!room || isRoomExpired(room) || s.category !== 'math' || room.status !== 'playing') { solo(); return; }

    let pick = {}; try { pick = JSON.parse(s.pick || '{}') || {}; } catch (e) {}
    const total = Math.max(1, Math.min(100, parseInt(s.val) || 10));
    const round = parseInt(localStorage.getItem('mp_round')) || room.round || 1;
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i) * (i + 1);
    seed += round * 7919;

    const isHost = room.hostId === myId;
    let leaving = false, finished = false;
    const strip = $('mpStrip');
    strip.classList.remove('hidden');
    $('roomBtn').style.display = 'none';
    $('mpStripTitle').textContent = '👥 غرفة ' + code + (s.roomName ? ' · ' + s.roomName : '');
    if (isHost) $('mpEndBtn').style.display = '';
    let bar = document.createElement('div'); bar.className = 'mp-progress'; bar.innerHTML = '<i></i>'; strip.appendChild(bar);
    const setBar = answered => { bar.querySelector('i').style.width = Math.round(100 * Math.min(total, answered) / total) + '%'; };

    // ---- my answers -> the room ----
    const onAnswer = (ok, answered, score, given) => {
        setBar(answered);
        const patch = { score, answered };
        patch['answers/' + (answered - 1)] = { c: String(given || '').slice(0, 300), ok: !!ok, t: Date.now() };
        update(ref(db, `rooms/${code}/players/${myId}`), patch).catch(e => console.error(e));
    };
    const onFinish = (score, tot) => {
        if (finished) return;
        finished = true; leaving = true;
        setBar(tot);
        update(ref(db, `rooms/${code}/players/${myId}`), { hasFinished: true, score }).catch(() => {});
        // The finish page reads the last saved session (score ring, stats); the room podium comes from the database
        try {
            const sessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
            sessions.push({ date: new Date().toLocaleString('ar-EG'), email: localStorage.getItem('userEmail') || 'غير معروف', score, total: tot, type: 'math', wrong: [], bestStreak: 0, title: '👥 غرفة حساب ' + code, at: Date.now() });
            localStorage.setItem('userSessions', JSON.stringify(sessions));
        } catch (e) {}
        if (window.KidsTheme) KidsTheme.play('tada');
        window.MathDrill.toast('انتهت مسائلك! 🏁 نشوف الترتيب...', 'success');
        setTimeout(() => { window.location.href = 'finish.html'; }, 1400);
    };

    window.MathDrill.startRoom({ settings: pick, seed, total, onAnswer, onFinish });

    // Reconnect (page reloaded mid-game): continue from the last answered problem
    const me = room.players && room.players[myId];
    if (me && me.answered > 0) {
        if (me.answered >= total || me.hasFinished) { onFinish(me.score || 0, total); return; }
        window.MathDrill.skipTo(me.answered, me.score || 0);
        setBar(me.answered);
    }

    // ---- live players strip ----
    onValue(ref(db, `rooms/${code}/players`), snap => {
        const players = snap.val() || {};
        const entries = Object.entries(players).sort((a, b) => (b[1].score || 0) - (a[1].score || 0) || (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
        const top = entries.length ? (entries[0][1].score || 0) : 0;
        $('mpPlayers').innerHTML = entries.map(([id, p]) => `
            <div class="mp-player${id === myId ? ' me' : ''}${top > 0 && (p.score || 0) === top ? ' lead' : ''}">
                <img src="${escapeHtml(p.avatar || AVATARS[0])}" alt="">
                <span class="nm">${escapeHtml(p.name || 'لاعب')}${id === myId ? ' (أنت)' : ''}</span>
                <span class="sc">${HINDI(p.score || 0)} ⭐</span>
                <span class="pg">${p.hasFinished ? '✅ انتهى' : HINDI(p.answered || 0) + ' / ' + HINDI(total)}</span>
            </div>`).join('');
    });

    // ---- room watchdog: closed by the host, or ended for everyone ----
    onValue(ref(db, `rooms/${code}`), snap => {
        if (leaving) return;
        const data = snap.val();
        if (!data) {
            leaving = true; clearMpState();
            const go = () => { window.location.href = 'index.html'; };
            if (window.UI) window.UI.dialog({ emoji: '🚪', title: 'أُغلقت الغرفة', text: 'أغلق المضيف هذه الغرفة. يمكنك إنشاء غرفة جديدة أو الانضمام بكود آخر.', primary: 'الرئيسية' }).then(go); else go();
            return;
        }
        if (data.phase === 'done' || data.status === 'finished') window.MathDrill.endRoom();
    });

    $('mpEndBtn').onclick = async () => {
        const ok = window.UI ? await window.UI.dialog({ emoji: '🏁', title: 'إنهاء الغرفة للجميع؟', text: 'ستُعرض النتائج الآن لكل اللاعبين بما وصلوا إليه.', primary: 'نعم، إنهاء', secondary: 'رجوع', danger: true }) : confirm('إنهاء الغرفة للجميع؟');
        if (!ok) return;
        try { await update(ref(db, `rooms/${code}`), { phase: 'done' }); } catch (e) { if (window.UI) window.UI.fail(e, 'تعذر إنهاء الغرفة'); }
    };
}
