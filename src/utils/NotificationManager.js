// Notification Manager Utility
class NotificationManager {
  constructor() {
    this.sounds = {
      message: new Audio('/assets/message-notification.mp3'),
      call: new Audio('/assets/call-notification.mp3')
    };
  }

  // Play notification sound
  playSound(type = 'message') {
    try {
      if (this.sounds[type]) {
        this.sounds[type].currentTime = 0;
        return this.sounds[type].play().catch(err => {
          console.warn('Could not play notification sound:', err);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // Check if browser supports notifications
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
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
  }

  // Check if notification permission is granted
  hasPermission() {
    return Notification.permission === 'granted';
  }

  // Register service worker
  async registerServiceWorker() {
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
  }

  // Show a local notification (when app is open but not focused)
  showLocalNotification(title, options = {}) {
    if (!this.hasPermission()) {
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
      this.playSound(options.sound);
    }

    try {
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
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Show notification for new message
  showMessageNotification(message, sender, chatId) {
    const title = sender?.username || 'New Message';
    const options = {
      body: message?.text || 'You received a new message',
      icon: sender?.avatar || '/avatar.png',
      data: { chatId },
      tag: `chat-${chatId}`, // Group notifications by chat
      sound: 'message',
      onClick: () => {
        // Add any additional click handling logic here
        console.log('Clicked on message notification for chat:', chatId);
      }
    };

    return this.showLocalNotification(title, options);
  }

  // Show notification for incoming call
  showCallNotification(caller, callId, isVideoCall = true) {
    const title = caller?.username || 'Incoming Call';
    const options = {
      body: `Incoming ${isVideoCall ? 'video' : 'audio'} call`,
      icon: caller?.avatar || '/avatar.png',
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

    return this.showLocalNotification(title, options);
  }
}

// Create a singleton instance
const notificationManager = new NotificationManager();

export default notificationManager; 