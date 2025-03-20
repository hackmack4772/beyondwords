// Notification Manager Utility
const NotificationManager = {
  // Notification sounds
  sounds: {
    message: new Audio('/assets/message-notification.mp3'),
    call: new Audio('/assets/call-notification.mp3')
  },

  // Play notification sound
  playSound: (type = 'message') => {
    try {
      // Reset sound to beginning
      NotificationManager.sounds[type].currentTime = 0;
      // Play the sound
      NotificationManager.sounds[type].play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  },

  // Check if browser supports notifications
  isSupported: () => {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // Request notification permission
  requestPermission: async () => {
    if (!NotificationManager.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  // Check if notification permission is granted
  hasPermission: () => {
    return Notification.permission === 'granted';
  },

  // Register service worker
  registerServiceWorker: async () => {
    if (!navigator.serviceWorker) {
      console.warn('Service Worker is not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  // Show a local notification (when app is open but not focused)
  showLocalNotification: (title, options = {}) => {
    if (!NotificationManager.hasPermission()) {
      console.warn('Notification permission not granted');
      return;
    }

    // Don't show notification if document is focused
    if (document.hasFocus()) {
      console.log('Document is focused, not showing notification');
      return;
    }

    // Play sound if specified
    if (options.sound) {
      NotificationManager.playSound(options.sound);
    }

    const notification = new Notification(title, {
      icon: options.icon || '/logo192.png',
      body: options.body || '',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    return notification;
  },

  // Show notification for new message
  showMessageNotification: (message, sender, chatId) => {
    const title = sender.username || 'New Message';
    const options = {
      body: message.text || 'You received a new message',
      icon: sender.avatar || '/avatar.png',
      data: { chatId },
      tag: `chat-${chatId}`, // Group notifications by chat
      sound: 'message',
      onClick: () => {
        // Add any additional click handling logic here
        console.log('Clicked on message notification for chat:', chatId);
      }
    };

    return NotificationManager.showLocalNotification(title, options);
  },

  // Show notification for incoming call
  showCallNotification: (caller, callId, isVideoCall = true) => {
    const title = caller.username || 'Incoming Call';
    const options = {
      body: `Incoming ${isVideoCall ? 'video' : 'audio'} call`,
      icon: caller.avatar || '/avatar.png',
      data: { callId },
      tag: `call-${callId}`,
      sound: 'call',
      requireInteraction: true, // Keep notification until user interacts with it
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'reject', title: 'Reject' }
      ],
      onClick: () => {
        console.log('Clicked on call notification for call:', callId);
      }
    };

    return NotificationManager.showLocalNotification(title, options);
  }
};

export default NotificationManager; 