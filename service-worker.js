// Service Worker - يعمل في الخلفية ويستقبل الإشعارات
console.log('🔧 Service Worker: جاري التحميل...');

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: تم التثبيت');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: تم التفعيل');
  event.waitUntil(clients.claim());
});

// استقبال الإشعارات من الخادم
self.addEventListener('push', (event) => {
  console.log('📨 Service Worker: استقبال إشعار:', event.data?.text());

  const data = event.data ? event.data.json() : {};
  const title = data.title || '🎉 بطل المستقبل';
  const options = {
    body: data.body || 'لديك خبر جديد!',
    icon: data.icon || '/assets/icon-192.png',
    badge: data.badge || '/assets/badge-72.png',
    tag: data.tag || 'award-notification',
    requireInteraction: data.requireInteraction !== false,
    data: data.data || {},
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('👆 عند الضغط على الإشعار');
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen) return client.focus();
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
