// نظام إرسال الإشعارات (مجاني - Realtime Database فقط)
import { db, ref, set } from './firebase-init.js';

export async function sendPushNotification(playerId, title, body, data = {}) {
  try {
    console.log('📨 إرسال إشعار:', { playerId, title, body });

    // حفظ في Firebase - سيتم عرضه في البروفيل
    await set(ref(db, `notifications/${playerId}/${Date.now()}`), {
      type: data.type || 'general',
      title,
      body,
      medal: data.medal || '',
      at: Date.now(),
      read: false,
      important: data.important || false
    });

    // عرض إشعار محلي على الفور (إذا كان التطبيق مفتوح)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        vibrate: [200, 100, 200],
        tag: data.type || 'notification'
      });
    }

    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال الإشعار:', error);
    return false;
  }
}

// دالة مساعدة: إرسال إشعار فوز يومي
export async function notifyDailyWinner(playerId, playerName, medal, label, score) {
  const title = `🏆 ${label}!`;
  const body = `👏 ${playerName}، أنت ${label} اليوم مع ${score} نقطة!`;
  
  return sendPushNotification(playerId, title, body, {
    important: false,
    type: 'daily_award',
    medal,
    url: '/profile.html?tab=medals'
  });
}

// دالة مساعدة: إرسال إشعار فوز أسبوعي
export async function notifyWeeklyWinner(playerId, playerName, medal, label, rank, score) {
  const title = `${medal} بطل الأسبوع!`;
  const body = `🎉 ${playerName}، أنت ${label} الأسبوع مع ${score} نقطة!`;
  
  return sendPushNotification(playerId, title, body, {
    important: true,
    type: 'weekly_award',
    medal,
    rank,
    url: '/profile.html?tab=medals',
    requireInteraction: true
  });
}

// دالة عامة: إرسال إشعار عام لفائز معين
export async function sendGeneralNotification(playerId, title, body, data = {}) {
  return sendPushNotification(playerId, title, body, {
    type: 'general',
    url: '/',
    ...data
  });
}

// ========== Broadcast Notifications ==========

// إرسال إشعار لجميع اللاعبين
export async function broadcastNotification(title, body, data = {}) {
  try {
    console.log('📢 بث إشعار لجميع اللاعبين:', { title, body });

    // الحصول على جميع اللاعبين
    const { db, ref, get } = await import('./firebase-init.js');
    const playersSnap = await get(ref(db, 'players'));

    const results = [];
    let count = 0;

    playersSnap.forEach((playerSnap) => {
      const playerId = playerSnap.key;
      // إرسال الإشعار لكل لاعب
      sendPushNotification(playerId, title, body, {
        type: data.type || 'broadcast',
        ...data
      }).then(() => count++);
      results.push({ playerId, sent: true });
    });

    console.log(`✅ تم إرسال إشعارات إلى ${count} لاعب`);
    return { success: true, count, results };
  } catch (error) {
    console.error('❌ خطأ في البث:', error);
    return { success: false, error: error.message };
  }
}

// إرسال إشعار لأفضل N لاعبين
export async function notifyTopPlayers(count, title, body, data = {}) {
  try {
    console.log(`📢 بث إشعار لأفضل ${count} لاعب:`, { title, body });

    const { db, ref, get, query, orderByChild, limitToLast } = await import('./firebase-init.js');

    const playersSnap = await get(query(ref(db, 'players'), orderByChild('points'), limitToLast(count)));
    const topPlayers = [];

    playersSnap.forEach((playerSnap) => {
      topPlayers.push({
        id: playerSnap.key,
        name: playerSnap.val().name,
        points: playerSnap.val().points
      });
    });

    topPlayers.reverse(); // ترتيب تنازلي

    let sentCount = 0;
    for (const player of topPlayers) {
      await sendPushNotification(player.id, title, body, {
        type: data.type || 'top-players',
        ...data
      });
      sentCount++;
    }

    console.log(`✅ تم إرسال إشعارات إلى أفضل ${sentCount} لاعب`);
    return { success: true, count: sentCount, topPlayers };
  } catch (error) {
    console.error('❌ خطأ في البث:', error);
    return { success: false, error: error.message };
  }
}

// إرسال إشعار لمجموعة معينة من اللاعبين
export async function notifyPlayerGroup(playerIds, title, body, data = {}) {
  try {
    console.log(`📢 بث إشعار لـ ${playerIds.length} لاعب:`, { title, body });

    let sentCount = 0;
    for (const playerId of playerIds) {
      await sendPushNotification(playerId, title, body, {
        type: data.type || 'group',
        ...data
      });
      sentCount++;
    }

    console.log(`✅ تم إرسال إشعارات إلى ${sentCount} لاعب`);
    return { success: true, count: sentCount };
  } catch (error) {
    console.error('❌ خطأ في البث:', error);
    return { success: false, error: error.message };
  }
}
