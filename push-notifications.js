// نظام إرسال Web Push Notifications

export async function sendPushNotification(playerId, title, body, data = {}) {
  try {
    // البيانات المطلوبة لـ Firebase Cloud Messaging
    const message = {
      notification: {
        title,
        body
      },
      data: {
        url: data.url || '/',
        ...data
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/assets/icon-192.png',
          badge: '/assets/badge-72.png',
          requireInteraction: data.important || false,
          vibrate: [200, 100, 200]
        }
      }
    };

    // إرسال عبر Cloud Function (تطبيق لاحق)
    console.log('📨 إرسال إشعار:', { playerId, title, body });

    // للآن: حفظ في Realtime Database فقط
    // سيتم استدعاء Cloud Function لاحقاً لإرسال الإشعار الفعلي
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
