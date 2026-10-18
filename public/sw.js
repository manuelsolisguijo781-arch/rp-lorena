// ============================================================
// Service Worker — Roleplay App (rp-lorena)
// Fixes iOS PWA issue: Safari tab + home-screen PWA competing
// for SW control. Forces immediate claim and handles push events.
// ============================================================

const CACHE_NAME = 'rp-lorena-v3';
const STATIC_ASSETS = [
  '/rp-lorena/',
  '/rp-lorena/index.html',
  '/rp-lorena/genshin-icon.svg',
  '/rp-lorena/manifest.json',
];

// ─── Install: skip waiting immediately so new SW activates ASAP ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: claim ALL clients (PWA + browser tabs) immediately ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of every open tab/PWA window right now
      self.clients.claim(),
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
    ])
  );
});

// ─── Fetch: Network-first, fallback to cache (keeps realtime working) ──
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Let Supabase / API requests always go to network — no caching
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis')) {
    return; // pass-through
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of the static asset response
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Push: Receive a server-side push notification ────────────────
// Handles Apple APNs and Google FCM web push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Crónicas de Rol ✨', body: '💬 Nuevo mensaje en la historia.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      try {
        const text = event.data.text();
        if (text) data.body = text;
      } catch {}
    }
  }

  const title = data.title || 'Crónicas de Rol ✨';
  const options = {
    body: data.body || '💬 Tienes un nuevo mensaje en la historia.',
    icon: data.icon || '/rp-lorena/genshin-icon.svg',
    badge: '/rp-lorena/genshin-icon.svg',
    tag: data.tag || `rp-push-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/rp-lorena/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click: open or focus the PWA window ────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/rp-lorena/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prefer standalone (PWA home screen) window over browser tab
        const pwaClient = clientList.find(
          (c) => c.url.includes('/rp-lorena') && 'standalone' in c
        );
        const anyClient = clientList.find((c) => c.url.includes('/rp-lorena'));

        const target = pwaClient || anyClient;
        if (target && 'focus' in target) {
          return target.focus();
        }
        // No existing window — open a fresh one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Message: allow app to send commands to the SW ────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
