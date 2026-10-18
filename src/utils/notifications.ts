/**
 * Mobile Push & Web Notifications Utility with Full Customization
 * Integrates Service Worker, Web Notification API, Sound and Mobile Haptic Vibration
 */
import { SoundEffects } from './sound';
import { dbService } from '../lib/supabase';

export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BBFHk0URTmA6TXo_ZQX6XgzTEbdRIvfpIlFaVfaWnYMHI3WpZMos4l--Dk5OmJePidfwQ6rEiP3k0gO1B6kjIzo';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  discreteMode: boolean; // Hide roleplay content on lockscreen
}

const STORAGE_KEY = 'rp_notification_preferences_v1';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  discreteMode: false,
};

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private currentUserId: string | null = null;

  constructor() {
    this.loadPreferences();
  }

  loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      this.preferences = DEFAULT_PREFERENCES;
    }
    return this.preferences;
  }

  savePreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = { ...this.preferences, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch {
      // ignore
    }
    return this.preferences;
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  async init(userId?: string): Promise<void> {
    this.loadPreferences();
    if (userId) {
      this.currentUserId = userId;
    }
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/rp-lorena/sw.js');
        this.swRegistration = reg;
        if (this.currentUserId && Notification.permission === 'granted') {
          await this.subscribeToPush(this.currentUserId);
        }
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

  async subscribeToPush(userId: string): Promise<boolean> {
    this.currentUserId = userId;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('PushManager not available on this browser/platform');
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      this.swRegistration = reg;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      if (sub) {
        const subJson = sub.toJSON();
        await dbService.savePushSubscription(userId, subJson);
        console.log('Web Push subscription successfully registered & stored in cloud for user:', userId);
        return true;
      }
    } catch (err) {
      console.error('Failed to subscribe to Web Push:', err);
    }
    return false;
  }

  async requestPermission(userId?: string): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Tu navegador no soporta notificaciones directas. En iPhone, añade la app a la Pantalla de Inicio (Compartir > Añadir a pantalla de inicio).');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        SoundEffects.playCriticalSuccess();
        this.savePreferences({ enabled: true });

        if (userId || this.currentUserId) {
          await this.subscribeToPush(userId || this.currentUserId!);
        }

        // Trigger welcome confirmation
        this.notify(
          '¡Avisos Activados! 🔔',
          'Tu móvil te avisará cada vez que tu pareja continúe la historia.',
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
    // 0. Check master enabled switch and browser permission
    if (!this.preferences.enabled) {
      return; // Silenced!
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    // 1. Play Sound (if enabled)
    if (this.preferences.sound) {
      try {
        SoundEffects.playSend();
      } catch {
        // ignore
      }
    }

    // 2. Trigger Mobile Vibration (if enabled)
    if (this.preferences.vibration && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // ignore
      }
    }

    // 3. Discrete Mode check: hides message text for lockscreen privacy
    const finalTitle = this.preferences.discreteMode ? 'Crónicas de Rol ✨' : title;
    const finalBody = this.preferences.discreteMode
      ? '💬 Tienes un nuevo mensaje secreto en la historia.'
      : body;

    // 4. Display System Notification — unique tag so every message stacks (not replaced)
    const options: NotificationOptions = {
      body: finalBody,
      icon: iconUrl || '/rp-lorena/genshin-icon.svg',
      badge: '/rp-lorena/genshin-icon.svg',
      tag: `rp-msg-${Date.now()}`,  // unique per message → never collapses previous ones
      silent: !this.preferences.sound,
    };

    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      this.swRegistration.showNotification(finalTitle, options);
    } else {
      try {
        const notif = new Notification(finalTitle, options);
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
