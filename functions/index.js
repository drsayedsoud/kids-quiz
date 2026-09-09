// Firebase Cloud Functions - إرسال Web Push Notifications
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendAwardNotification = functions.database
  .ref('notifications/{userId}/{timestamp}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const notification = snapshot.val();

    console.log(`📨 Sending notification to ${userId}:`, notification);

    try {
      // جلب بيانات اللاعب
      const userSnap = await admin.database()
        .ref(`players/${userId}`)
        .once('value');
      
      const user = userSnap.val();
      if (!user || !user.pushSubscription) {
        console.log(`⏭️ لا توجد subscription للاعب ${userId}`);
        return;
      }

      // بناء الرسالة
      const message = {
        notification: {
          title: `${notification.medal} ${notification.label}`,
          body: notification.message,
          icon: 'https://batal.app/assets/icon-192.png',
          badge: 'https://batal.app/assets/badge-72.png'
        },
        data: {
          type: notification.type || 'award',
          timestamp: String(context.params.timestamp),
          userId: userId
        },
        webpush: {
          notification: {
            title: `${notification.medal} ${notification.label}`,
            body: notification.message,
            icon: 'https://batal.app/assets/icon-192.png',
            badge: 'https://batal.app/assets/badge-72.png',
            requireInteraction: notification.important ? true : false,
            vibrate: [200, 100, 200],
            sound: 'default',
            click_action: 'https://batal.app/profile.html?tab=medals'
          }
        }
      };

      // إرسال الإشعار
      const response = await admin.messaging().send(message);
      console.log(`✅ تم إرسال الإشعار:`, response);
    } catch (error) {
      console.error(`❌ خطأ في إرسال الإشعار:`, error);
      // حفظ الخطأ لكن لا نفشل الـ function
    }
  });

exports.subscribePushNotifications = functions.https
  .onRequest(async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      if (!userId || !subscription) {
        return res.status(400).json({ error: 'Missing userId or subscription' });
      }

      // حفظ في Firebase
      await admin.database()
        .ref(`players/${userId}/pushSubscription`)
        .set({
          endpoint: subscription.endpoint,
          p256dh: subscription.getKey('p256dh'),
          auth: subscription.getKey('auth'),
          at: admin.database.ServerValue.TIMESTAMP
        });

      res.json({ success: true, message: 'تم حفظ الاشتراك' });
    } catch (error) {
      console.error('❌ خطأ في الاشتراك:', error);
      res.status(500).json({ error: error.message });
    }
  });

exports.testNotification = functions.https
  .onRequest(async (req, res) => {
    try {
      const { userId, title, body } = req.body;

      const message = {
        notification: {
          title: title || '🎉 اختبار',
          body: body || 'هذا إشعار اختبار'
        },
        webpush: {
          notification: {
            title: title || '🎉 اختبار',
            body: body || 'هذا إشعار اختبار',
            icon: 'https://batal.app/assets/icon-192.png'
          }
        }
      };

      const response = await admin.messaging().sendMulticast({
        tokens: [userId],
        ...message
      });

      res.json({ success: true, response });
    } catch (error) {
      console.error('❌ خطأ:', error);
      res.status(500).json({ error: error.message });
    }
  });
