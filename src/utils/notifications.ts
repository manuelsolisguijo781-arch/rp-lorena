/**
 * Mobile Push & Web Notifications Utility
 * Integrates Service Worker, Web Notification API, and Mobile Haptic Vibration
 */
import { SoundEffects } from './sound';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/rp-lorena/sw.js');
        this.swRegistration = reg;
      } catch (err) {
        console.warn('Service worker registration failed:', err);
      }
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Tu navegador no soporta notificaciones web.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        SoundEffects.playCriticalSuccess();
        // Trigger test notification
        this.notify(
          '¡Notificaciones Activadas! 🔔',
          'Recibirás un aviso en tu móvil cada vez que tu pareja te escriba.',
          '/rp-lorena/genshin-icon.svg'
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  }

  notify(title: string, body: string, iconUrl?: string): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    // 1. Play Sound
    SoundEffects.playSend();

    // 2. Trigger Mobile Vibration (2 short pulses)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignore vibration errors
      }
    }

    // 3. Display System Notification
    const options: NotificationOptions = {
      body: body,
      icon: iconUrl || '/rp-lorena/genshin-icon.svg',
      badge: '/rp-lorena/genshin-icon.svg',
      tag: 'rp-chat-msg',
      silent: false,
    };

    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      this.swRegistration.showNotification(title, options);
    } else {
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Notification instantiation fallback failed:', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
