import { db, ref, get, query, orderByChild, limitToLast } from './firebase-init.js';
import { getLocalUserId } from './mp-common.js';

(async function checkDailyHero() {
    const today = new Date().toLocaleDateString('en-CA');
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toLocaleDateString('en-CA');

    if (localStorage.getItem('dailyHeroChecked') === today) return;

    const myId = getLocalUserId();
    if (!myId) return;

    try {
        const snap = await get(query(ref(db, `leaderboard_daily/${yesterday}`), orderByChild('points'), limitToLast(10)));
        if (!snap.exists()) return;

        const rows = [];
        snap.forEach(c => rows.push({ id: c.key, ...c.val() }));
        rows.sort((a, b) => b.points - a.points);

        const myRank = rows.findIndex(r => r.id === myId);
        if (myRank !== -1) {
            localStorage.setItem('dailyHeroChecked', today);

            setTimeout(() => {
                if (window.KidsTheme) {
                    KidsTheme.playWow();
                    KidsTheme.burst(window.innerWidth / 2, window.innerHeight / 2, 40);
                }

                const msg = myRank === 0
                    ? '🏆 أنت بطل اليوم! احتللت المركز الأول في لوحة الشرف أمس! هيا العب مرة أخرى! 🌟'
                    : `🎉 رائع! أنت في أفضل 10 لاعبين اليومية (المركز ${myRank + 1})! هيا حسّن نتيجتك! 💪`;

                if (window.UI && window.UI.toast) {
                    window.UI.toast(msg, { type: 'ok', ms: 10000 });
                }
            }, 1500);
        } else {
            localStorage.setItem('dailyHeroChecked', today);
        }
    } catch (e) {
        console.warn('Daily hero check failed', e);
    }
})();
