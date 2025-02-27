const CACHE_VERSION = 'v3';
const CACHE_NAME = `MySLM-Cache-${CACHE_VERSION}`;

const EXPECTED_CACHES = [CACHE_NAME];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[Service Worker] Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        '/',
        '/index.html',
        '/readme.html',
        '/terms.html',
        '/style.css',
        '/app.js',
        '/icons/Cogon.png',
        '/icons/MYSLMHEADER.png'
        
      ]))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (!EXPECTED_CACHES.includes(key)) {
          console.log('[Service Worker] Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    ).then(() => {
     
      return self.clients.claim();
    }))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
     
      const fetchPromise = fetch(event.request).then(networkResponse => {
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => cachedResponse); 
      
      
      return cachedResponse || fetchPromise;
    })
  );
});


self.addEventListener('message', event => {
  if (event.data === 'forceUpdate') {
    console.log('[Service Worker] Forcing immediate update');
    self.skipWaiting();
    self.clients.claim().then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('reloadPage'));
      });
    });
  }
});


if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(persisted => {
    console.log(persisted ? 
      "Storage will persist across sessions" :
      "Storage might be cleared under pressure");
  });
}
