const CACHE_VERSION = '1.36.2';
const CACHE_NAME = 'gestao-saude-' + CACHE_VERSION;
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './taco.json',
    './apple-touch-icon.png',
    './logo-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // v1.36.1: resposta de erro (404, 5xx) não entra no cache. Arquivo do próprio app com cópia boa: a cópia vence.
                // Erro de outro site (cors) volta como veio. Resposta opaca (script de outro site) segue guardada, como antes.
                if (!response.ok && response.type !== 'opaque') {
                    if (response.type === 'basic') return caches.match(e.request).then(cached => cached || response);
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});
