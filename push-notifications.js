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

// دالة عامة: إرسال إشعار عام
export async function sendGeneralNotification(playerId, title, body, data = {}) {
  return sendPushNotification(playerId, title, body, {
    type: 'general',
    url: '/',
    ...data
  });
}
