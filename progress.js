// Player progress kept on the device: wrong-answer bank, favourites, achievements, stickers, daily streak.
// Classic script shared by quiz.html, finish.html, profile.html and index.html.
(function () {
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };
    const key = q => String(q && q.question || '').trim();
    const slim = q => ({ question: q.question, choice1: q.choice1, choice2: q.choice2, choice3: q.choice3, choice4: q.choice4, correct_answer: q.correct_answer, explanation: q.explanation || '', src: q.src || q.type || '' });

    const Progress = {};

    // ---------- wrong-answer bank (smart review mode + spaced repetition) ----------
    // box 0 = just missed (back after 1 day), 1 = right once (3 days), 2 = right twice (7 days); right again -> leaves the bank
    const REPEAT_DAYS = [1, 3, 7];
    Progress.getWrong = () => read('wrongBank', []);
    Progress.addWrong = function (q, src) {
        if (!q || !key(q)) return;
        const bank = Progress.getWrong().filter(x => key(x) !== key(q));
        const item = slim(q); item.src = src || item.src; item.misses = ((Progress.getWrong().find(x => key(x) === key(q)) || {}).misses || 0) + 1; item.at = Date.now(); item.box = 0;
        bank.unshift(item);
        write('wrongBank', bank.slice(0, 300));
    };
    Progress.isDue = w => Date.now() - (w.at || 0) >= REPEAT_DAYS[Math.min(REPEAT_DAYS.length - 1, w.box || 0)] * 86400000;
    Progress.promoteWrong = function (q) {
        const bank = Progress.getWrong();
        const i = bank.findIndex(x => key(x) === key(q));
        if (i < 0) return;
        const box = (bank[i].box || 0) + 1;
        if (box >= REPEAT_DAYS.length) bank.splice(i, 1);
        else { bank[i].box = box; bank[i].at = Date.now(); }
        write('wrongBank', bank);
    };
    Progress.removeWrong = function (q) { write('wrongBank', Progress.getWrong().filter(x => key(x) !== key(q))); };

    // ---------- favourites ----------
    Progress.getFav = () => read('favBank', []);
    Progress.isFav = q => Progress.getFav().some(x => key(x) === key(q));
    Progress.toggleFav = function (q, src) {
        if (!q || !key(q)) return false;
        const bank = Progress.getFav();
        const i = bank.findIndex(x => key(x) === key(q));
        if (i >= 0) { bank.splice(i, 1); write('favBank', bank); return false; }
        const item = slim(q); item.src = src || item.src; item.at = Date.now();
        bank.unshift(item); write('favBank', bank.slice(0, 500)); return true;
    };
    Progress.removeFav = q => { write('favBank', Progress.getFav().filter(x => key(x) !== key(q))); };

    // ---------- daily streak (days in a row with at least one quiz) ----------
    // Days are the phone's local calendar days, like the daily quests
    const localDay = d => (d || new Date()).toLocaleDateString('en-CA');
    Progress.touchDay = function () {
        const today = localDay();
        const s = read('dailyStreak', { last: null, count: 0, best: 0 });
        if (s.last === today) return s;
        const y = new Date(); y.setDate(y.getDate() - 1);
        const y2 = new Date(); y2.setDate(y2.getDate() - 2);
        // one missed day a week is forgiven, so a single busy day does not wipe out a long streak
        const canForgive = s.count > 0 && (!s.forgivenAt || Date.now() - s.forgivenAt > 7 * 86400000);
        if (s.last === localDay(y)) s.count += 1;
        else if (s.last === localDay(y2) && canForgive) { s.count += 1; s.forgivenAt = Date.now(); }
        else s.count = 1;
        s.last = today; s.best = Math.max(s.best || 0, s.count);
        write('dailyStreak', s); return s;
    };
    Progress.streak = () => read('dailyStreak', { last: null, count: 0, best: 0 });

    // ---------- المهام اليومية (Daily Quests) ----------
    Progress.QUEST_DEFS = [
        { id: 'q_games', icon: '🎮', title: 'العب تحديين (أي قسم)', target: 2, reward: 50 },
        { id: 'q_correct', icon: '✅', title: 'أجب 20 إجابة صحيحة', target: 20, reward: 100 },
        { id: 'q_perfect', icon: '🌟', title: 'احصل على العلامة الكاملة', target: 1, reward: 80 },
        { id: 'q_math', icon: '🔢', title: 'حُلّ ٥ مسائل في تدريب الحساب', target: 1, reward: 50 },
        { id: 'q_daily', icon: '⭐', title: 'العب تحدي اليوم', target: 1, reward: 50 }
    ];

    Progress.getDailyTasks = function() {
        const today = new Date().toLocaleDateString('en-CA');
        let data = read('dailyQuests', { date: '', tasks: [] });

        if (data.date !== today) {
            const shuffled = [...Progress.QUEST_DEFS].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3).map(t => ({ id: t.id, current: 0, claimed: false }));
            data = { date: today, tasks: selected };
            write('dailyQuests', data);
        } else if (data.tasks.some(t => !Progress.QUEST_DEFS.some(d => d.id === t.id))) {
            // a quest that no longer exists (the old seerah one): swap it for one the child does not have today
            const valid = data.tasks.filter(t => Progress.QUEST_DEFS.some(d => d.id === t.id));
            const unused = Progress.QUEST_DEFS.filter(d => !valid.some(t => t.id === d.id));
            while (valid.length < 3 && unused.length) valid.push({ id: unused.shift().id, current: 0, claimed: false });
            data.tasks = valid;
            write('dailyQuests', data);
        }
        
        return data.tasks.map(t => {
            const def = Progress.QUEST_DEFS.find(d => d.id === t.id);
            return Object.assign({}, def, { current: t.current, claimed: t.claimed });
        });
    };

    Progress.updateQuest = function(type, amount = 1) {
        const today = new Date().toLocaleDateString('en-CA');
        let data = read('dailyQuests', { date: '', tasks: [] });
        if (data.date !== today) return; // Wait for initialization

        let changed = false;
        data.tasks.forEach(t => {
            const def = Progress.QUEST_DEFS.find(d => d.id === t.id);
            if (!def || t.claimed || t.current >= def.target) return;

            if (type === 'game' && t.id === 'q_games') { t.current += amount; changed = true; }
            if (type === 'correct' && t.id === 'q_correct') { t.current += amount; changed = true; }
            if (type === 'perfect' && t.id === 'q_perfect') { t.current += amount; changed = true; }
            if (type === 'math' && t.id === 'q_math') { t.current += amount; changed = true; }
            if (type === 'daily' && t.id === 'q_daily') { t.current += amount; changed = true; }
            
            if (t.current > def.target) t.current = def.target;
        });

        if (changed) write('dailyQuests', data);
    };

    Progress.claimQuest = function(id) {
        let data = read('dailyQuests', { date: '', tasks: [] });
        const task = data.tasks.find(t => t.id === id);
        const def = Progress.QUEST_DEFS.find(d => d.id === id);
        if (task && def && !task.claimed && task.current >= def.target) {
            task.claimed = true;
            write('dailyQuests', data);
            
            let balance = parseInt(localStorage.getItem('piggyBalance') || '0');
            balance += def.reward;
            localStorage.setItem('piggyBalance', balance);
            return def.reward;
        }
        return 0;
    };

    // ---------- stats over saved sessions ----------
    Progress.sessions = () => read('userSessions', []).filter(s => s && typeof s.score === 'number');
    Progress.stats = function () {
        const ss = Progress.sessions();
        const withTotal = ss.filter(s => s.total > 0);
        const pct = s => Math.round(s.score / s.total * 100);
        const kids = withTotal.filter(s => String(s.type || '').startsWith('kids'));
        return {
            games: ss.length,
            correct: ss.reduce((a, s) => a + (s.score || 0), 0),
            answered: ss.reduce((a, s) => a + (s.total || 0), 0),
            best: withTotal.length ? Math.max(...withTotal.map(pct)) : 0,
            avg: withTotal.length ? Math.round(withTotal.reduce((a, s) => a + pct(s), 0) / withTotal.length) : 0,
            perfect: withTotal.filter(s => s.score === s.total && s.total >= 5).length,
            bestStreak: Math.max(0, ...ss.map(s => s.bestStreak || 0)),
            kidsStars: kids.reduce((a, s) => a + (pct(s) >= 90 ? 3 : pct(s) >= 60 ? 2 : pct(s) > 0 ? 1 : 0), 0),
            kidsGames: kids.length,
            types: [...new Set(ss.map(s => s.type).filter(Boolean))].length,
            dailyPlayed: ss.filter(s => s.type === 'daily').length,
            reviewCleared: read('reviewCleared', 0),
            favs: Progress.getFav().length,
            cheques: parseInt(localStorage.getItem('piggyCheques')) || 0,
            rooms: ss.filter(s => s.multiplayer || /تحدي مباشر/.test(String(s.title || ''))).length,
            streakDays: Progress.streak().best || 0
        };
    };

    // ---------- achievements ----------
    Progress.DEFS = [
        { id: 'first', icon: '🎯', title: 'أول خطوة', desc: 'أنهيت أول مسابقة', check: s => s.games >= 1 },
        { id: 'ten', icon: '🎮', title: 'لاعب مثابر', desc: '10 مسابقات', check: s => s.games >= 10 },
        { id: 'fifty', icon: '🏋️', title: 'محترف', desc: '50 مسابقة', check: s => s.games >= 50 },
        { id: 'c100', icon: '💯', title: 'مئة إجابة', desc: '100 إجابة صحيحة', check: s => s.correct >= 100 },
        { id: 'c500', icon: '🧠', title: 'عقل حافظ', desc: '500 إجابة صحيحة', check: s => s.correct >= 500 },
        { id: 'c2000', icon: '🏛️', title: 'عالم', desc: '2000 إجابة صحيحة', check: s => s.correct >= 2000 },
        { id: 's5', icon: '🔥', title: 'سلسلة نارية', desc: '5 إجابات صحيحة متتالية', check: s => s.bestStreak >= 5 },
        { id: 's10', icon: '⚡', title: 'لا يُوقَف', desc: '10 إجابات صحيحة متتالية', check: s => s.bestStreak >= 10 },
        { id: 'perfect', icon: '🌟', title: 'العلامة الكاملة', desc: 'مسابقة بلا أي خطأ', check: s => s.perfect >= 1 },
        { id: 'perfect5', icon: '👑', title: 'ملك الدقة', desc: '5 مسابقات بلا أخطاء', check: s => s.perfect >= 5 },
        { id: 'd3', icon: '📅', title: 'ثلاثة أيام', desc: 'لعبت 3 أيام متتالية', check: s => s.streakDays >= 3 },
        { id: 'd7', icon: '🗓️', title: 'أسبوع كامل', desc: 'لعبت 7 أيام متتالية', check: s => s.streakDays >= 7 },
        { id: 'daily5', icon: '⭐', title: 'صاحب التحدي', desc: '5 تحديات يومية', check: s => s.dailyPlayed >= 5 },
        { id: 'explorer', icon: '🧭', title: 'مستكشف', desc: 'لعبت في 3 صفوف مختلفة', check: s => s.types >= 3 },
        { id: 'piggy1', icon: '🐷', title: 'صاحب الحصالة', desc: 'صرفت أول شيك من حصالتك', check: s => s.cheques >= 1 },
        { id: 'piggy5', icon: '💰', title: 'مليونير صغير', desc: 'صرفت 5 شيكات من حصالتك', check: s => s.cheques >= 5 },
        { id: 'rooms3', icon: '👫', title: 'يحب أصحابه', desc: 'لعبت 3 تحديات مع الأصحاب', check: s => s.rooms >= 3 },
        { id: 'stars10', icon: '🎈', title: 'بطل صغير', desc: 'جمعت 10 نجوم في مسابقات الأطفال', check: s => s.kidsStars >= 10 },
        { id: 'stars50', icon: '🦸', title: 'بطل خارق', desc: 'جمعت 50 نجمة في مسابقات الأطفال', check: s => s.kidsStars >= 50 }
    ];
    Progress.unlocked = () => read('achievements', {});
    // Re-evaluates everything and returns the achievements unlocked just now
    Progress.evaluate = function () {
        const stats = Progress.stats();
        const have = Progress.unlocked();
        const fresh = [];
        Progress.DEFS.forEach(d => { if (!have[d.id] && d.check(stats)) { have[d.id] = Date.now(); fresh.push(d); } });
        write('achievements', have);
        return fresh;
    };

    // ---------- kids stickers: one per 3-star kids result, from a growing collection ----------
    Progress.STICKERS = ['🦁', '🐘', '🦒', '🐬', '🦋', '🐝', '🪁', '🚀', '🌙', '⭐', '🌻', '🍉', '🦄', '🐢', '🦜', '🐼', '🎈', '🏆', '🧸', '🎠', '🐙', '🦊', '🍭', '🎨'];
    Progress.stickers = () => read('stickers', []);
    Progress.awardSticker = function () {
        const have = Progress.stickers();
        const left = Progress.STICKERS.filter(s => !have.includes(s));
        if (!left.length) return null;
        const s = left[Math.floor(Math.random() * left.length)];
        have.push(s); write('stickers', have); return s;
    };

    // Called once per finished quiz (from the engine) with the saved session
    Progress.onSessionSaved = function (session) {
        Progress.touchDay();
        const result = { achievements: Progress.evaluate(), sticker: null };
        if (session && String(session.type || '').startsWith('kids') && session.total >= 5 && session.score / session.total >= 0.9) result.sticker = Progress.awardSticker();
        if (session && session.type === 'review' && session.score > 0) write('reviewCleared', read('reviewCleared', 0) + session.score);
        
        // Update daily quests
        if (session) {
            Progress.updateQuest('game', 1);
            if (session.score > 0) Progress.updateQuest('correct', session.score);
            if (session.score === session.total && session.total >= 5) Progress.updateQuest('perfect', 1);
            if (session.type === 'math') Progress.updateQuest('math', 1);
            if (session.type === 'daily') Progress.updateQuest('daily', 1);
        }

        try { sessionStorage.setItem('justUnlocked', JSON.stringify(result)); } catch (e) {}
        return result;
    };

    window.Progress = Progress;
})();
