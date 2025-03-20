// Service Worker for Push Notifications
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

// Handle push notification events
self.addEventListener('push', event => {
  console.log('Push notification received', event);
  
  if (!event.data) {
    console.log('No payload');
    return;
  }
  
  const data = event.data.json();
  console.log('Notification data:', data);
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: '/badge.png',
    data: {
      url: data.url || '/'
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    tag: data.tag || 'default'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification click');
  event.notification.close();
  
  // Focus on or open the relevant chat window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const url = event.notification.data.url;
      
      // Try to find an existing window and focus it
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching window, open new one
      return clients.openWindow(url);
    })
  );
}); 