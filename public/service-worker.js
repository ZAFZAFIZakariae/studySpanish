const STATIC_CACHE = 'static-v2';
const DATA_CACHE = 'data-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(['/manifest.webmanifest', '/icon.svg']);
      try {
        const indexRequest = new Request('/index.html', { cache: 'reload' });
        const response = await fetch(indexRequest);
        if (response.ok) {
          await cache.put('/index.html', response.clone());
        }
      } catch (error) {
        console.warn('Skipping index.html prefetch', error);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

const serveNavigation = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match('/index.html');
    return (
      cached ??
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      })
    );
  }
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
};

const serveNavigation = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match('/index.html');
    return (
      cached ??
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      })
    );
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (
    request.url.endsWith('/offline-lessons') ||
    request.url.endsWith('/offline-exercises') ||
    request.url.endsWith('/offline-flashcards')
  ) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(request).then((response) =>
          response ?? new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
        )
      )
    );
    return;
  }

  if (request.mode === 'navigate' || (request.destination === 'document' && request.url.startsWith(self.location.origin))) {
    event.respondWith(serveNavigation(request));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/icon.svg') {
      event.respondWith(cacheFirst(request));
      return;
    }
  }

  event.respondWith(fetch(request));
});

const cacheDataBundle = async ({ lessons = [], exercises = [], flashcards = [] }) => {
  const cache = await caches.open(DATA_CACHE);
  await cache.put(
    new Request('/offline-lessons'),
    new Response(JSON.stringify(lessons), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
  await cache.put(
    new Request('/offline-exercises'),
    new Response(JSON.stringify(exercises), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
  await cache.put(
    new Request('/offline-flashcards'),
    new Response(JSON.stringify(flashcards), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('spanishAppDB');
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('grades')) {
        db.createObjectStore('grades', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const markGradesSynced = async () => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction('grades', 'readwrite');
    const store = transaction.objectStore('grades');
    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const value = cursor.value;
      if (!value.syncedAt) {
        value.syncedAt = new Date().toISOString();
        cursor.update(value);
      }
      cursor.continue();
    };
  } catch (error) {
    console.error('Failed to sync grades', error);
  }
};

self.addEventListener('message', (event) => {
  const { type, lessons, exercises, flashcards } = event.data || {};
  if (type === 'CACHE_DATA') {
    event.waitUntil(cacheDataBundle({ lessons, exercises, flashcards }));
  }
  if (type === 'SYNC_GRADES') {
    event.waitUntil(markGradesSynced());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-grades') {
    event.waitUntil(markGradesSynced());
  }
});
