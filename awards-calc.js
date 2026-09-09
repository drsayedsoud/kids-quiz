// حساب الفائزين اليوميين والأسبوعيين مع الأوسمة والإشعارات
// يُستخدم من admin.html أو كـ Cloud Function

import { notifyDailyWinner, notifyWeeklyWinner } from './push-notifications.js';

export async function calculateDailyWinners(db, ref, get, update) {
  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `daily_${today}`;

  try {
    // 1. جمع جميع النتائج من اليوم من جميع الفئات
    const stats = {};
    const snap = await get(ref(db, 'stats/daily/' + today));
    const dailyStats = snap.val() || {};

    // 2. حساب البيانات من Firebase (من آخر 24 ساعة)
    const now = Date.now();
    const dayAgo = now - 86400000;

    const allPlayers = {};

    // قراءة من leaderboard (آخر 24 ساعة)
    const lb = await get(ref(db, 'leaderboard'));
    const leaderboardData = lb.val() || {};

    for (const [weekKey, week] of Object.entries(leaderboardData)) {
      for (const [playerId, entry] of Object.entries(week)) {
        if (entry.at && entry.at > dayAgo) {
          if (!allPlayers[playerId]) {
            allPlayers[playerId] = {
              name: entry.name,
              games: 0,
              score: 0,
              total: 0,
              correct: 0,
              lastAt: 0
            };
          }
          allPlayers[playerId].games++;
          allPlayers[playerId].score += entry.score || 0;
          allPlayers[playerId].total += entry.total || 0;
          allPlayers[playerId].lastAt = Math.max(allPlayers[playerId].lastAt, entry.at);
        }
      }
    }

    // 3. حساب النسب المئوية والترتيبات
    const players = Object.entries(allPlayers)
      .map(([id, p]) => ({
        id,
        name: p.name,
        games: p.games,
        score: p.score,
        total: p.total,
        accuracy: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
        at: p.lastAt
      }))
      .filter(p => p.games > 0);

    if (players.length === 0) {
      return { success: true, message: 'لا توجد بيانات اليوم', winners: [] };
    }

    // 4. ترتيب الفائزين حسب المعايير
    const topScore = players.sort((a, b) => b.score - a.score).slice(0, 1);
    const topAccuracy = players.sort((a, b) => b.accuracy - a.accuracy).slice(0, 1);
    const topActivity = players.sort((a, b) => b.games - a.games).slice(0, 1);

    const winners = [
      { player: topScore[0], medal: '🏆', type: 'top_score', label: 'الأعلى نقاطاً' },
      { player: topAccuracy[0], medal: '⭐', type: 'top_accuracy', label: 'أفضل نسبة صحة' },
      { player: topActivity[0], medal: '🔥', type: 'top_activity', label: 'الأكثر نشاطاً' }
    ].filter(w => w.player);

    // 5. حفظ الأوسمة في ملفات اللاعبين
    const updates = {};
    for (const w of winners) {
      const medalsPath = `players/${w.player.id}/medals/${dayKey}`;
      updates[medalsPath] = {
        rank: 1,
        medal: w.medal,
        type: w.type,
        label: w.label,
        score: w.player.score,
        accuracy: w.player.accuracy,
        games: w.player.games,
        at: Date.now()
      };

      // إضافة إلى سجل الإشعارات
      updates[`notifications/${w.player.id}/${Date.now()}`] = {
        type: 'daily_award',
        medal: w.medal,
        label: w.label,
        message: `🎉 أنت ${w.label}! ${w.player.score} نقطة`,
        at: Date.now(),
        read: false
      };

      // إرسال Web Push Notification
      try {
        await notifyDailyWinner(w.player.id, w.player.name, w.medal, w.label, w.player.score);
      } catch (e) {
        console.warn('⚠️ فشل إرسال push للفائز اليومي:', e);
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }

    return {
      success: true,
      message: `تم تحديث ${winners.length} أوسمة يومية`,
      winners: winners.map(w => ({
        medal: w.medal,
        label: w.label,
        name: w.player.name,
        score: w.player.score,
        accuracy: w.player.accuracy
      }))
    };
  } catch (error) {
    console.error('خطأ في حساب الفائزين اليوميين:', error);
    return { success: false, error: error.message };
  }
}

export async function calculateWeeklyWinners(db, ref, get, update, query, orderByChild, limitToLast) {
  try {
    // 1. تحديد أسبوع اليوم (الجمعة ليلاً)
    const today = new Date();
    const weekKey = getWeekKey(today);

    // 2. جمع جميع النتائج من الأسبوع الحالي
    const snapLb = await get(ref(db, 'leaderboard/' + weekKey));
    const weeklyData = snapLb.val() || {};

    const players = [];
    for (const [playerId, entry] of Object.entries(weeklyData)) {
      if (entry && entry.name) {
        players.push({
          id: playerId,
          name: entry.name,
          score: entry.score || 0,
          total: entry.total || 0,
          accuracy: entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0,
          at: entry.at || 0
        });
      }
    }

    if (players.length < 3) {
      return { success: true, message: `عدد اللاعبين ${players.length} أقل من 3`, winners: [] };
    }

    // 3. ترتيب حسب النقاط
    const topThree = players.sort((a, b) => (b.score - a.score) || (a.at - b.at)).slice(0, 3);

    const medals = ['🥇', '🥈', '🥉'];
    const labels = ['بطل الأسبوع', 'اللاعب المميز', 'الثالث'];

    const winners = topThree.map((p, i) => ({
      id: p.id,
      name: p.name,
      medal: medals[i],
      label: labels[i],
      rank: i + 1,
      score: p.score
    }));

    // 4. حفظ الأوسمة الأسبوعية
    const updates = {};
    const weekDateKey = `weekly_${weekKey}`;

    for (const w of winners) {
      const medalsPath = `players/${w.id}/medals/${weekDateKey}`;
      updates[medalsPath] = {
        rank: w.rank,
        medal: w.medal,
        type: 'weekly_award',
        label: w.label,
        score: w.score,
        weekKey: weekKey,
        at: Date.now()
      };

      // إضافة إشعار أسبوعي
      updates[`notifications/${w.id}/${Date.now()}`] = {
        type: 'weekly_award',
        medal: w.medal,
        label: w.label,
        message: `🎉 ${w.medal} ${w.label} هذا الأسبوع! نقاطك: ${w.score}`,
        at: Date.now(),
        read: false,
        important: true
      };

      // إرسال Web Push Notification
      try {
        await notifyWeeklyWinner(w.id, w.name, w.medal, w.label, w.rank, w.score);
      } catch (e) {
        console.warn('⚠️ فشل إرسال push للفائز الأسبوعي:', e);
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }

    return {
      success: true,
      message: `تم تحديث ${winners.length} أوسمة أسبوعية للأسبوع ${weekKey}`,
      weekKey,
      winners: winners.map(w => ({
        medal: w.medal,
        label: w.label,
        name: w.name,
        rank: w.rank,
        score: w.score
      }))
    };
  } catch (error) {
    console.error('خطأ في حساب الفائزين الأسبوعيين:', error);
    return { success: false, error: error.message };
  }
}

function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}
