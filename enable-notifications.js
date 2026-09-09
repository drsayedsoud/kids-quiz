// تفعيل الإشعارات من أي صفحة

export async function enableNotifications() {
  if (!('Notification' in window)) {
    alert('❌ المتصفح لا يدعم الإشعارات');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ الإشعارات مفعّلة بالفعل');
    return true;
  }

  if (Notification.permission === 'denied') {
    alert('❌ تم رفض الإشعارات. اذهب للإعدادات وفعّلها يدويّاً');
    return false;
  }

  // الحالة: 'default' - اطلب التصريح
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ تم تفعيل الإشعارات!');
    
    // عرض إشعار تأكيد
    new Notification('✅ تم تفعيل الإشعارات', {
      body: 'ستتلقى إشعارات عن أوسمتك والفوزات!',
      icon: '/assets/icon-192.png',
      badge: '/assets/badge-72.png'
    });

    return true;
  } else if (permission === 'denied') {
    alert('❌ تم رفض الإشعارات');
    return false;
  }

  return false;
}

export function getNotificationStatus() {
  if (!('Notification' in window)) {
    return { supported: false, status: 'unsupported' };
  }

  return {
    supported: true,
    status: Notification.permission, // 'granted', 'denied', 'default'
    enabled: Notification.permission === 'granted'
  };
}

// زر سريع يمكن إضافته في الصفحات
export function createNotificationButton() {
  const btn = document.createElement('button');
  btn.id = 'enable-notif-btn';
  btn.className = 'btn green';
  btn.textContent = '🔔 فعّل الإشعارات';
  btn.style.marginTop = '10px';

  const status = getNotificationStatus();
  
  if (!status.supported) {
    btn.disabled = true;
    btn.textContent = '🔕 المتصفح لا يدعم الإشعارات';
    return btn;
  }

  if (status.enabled) {
    btn.disabled = true;
    btn.textContent = '✅ الإشعارات مفعّلة';
    btn.style.background = '#10b981';
    return btn;
  }

  btn.onclick = enableNotifications;
  return btn;
}
