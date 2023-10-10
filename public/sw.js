const CACHE_NAME = 'my-cache';
self.addEventListener('install', e => {
    e.wait(
        caches.open(CACHE_NAME).then(cache => {
            console.log("SW -I");
            return cache.addAll([
                '/',
                '/index.html',
                'static/js/bundle.js'
            ]).then(() => self.skipWaiting());
        })
    );
});

self.addEventListener('activate', e => {
    console.log("SW -A");
    e.waitUntil(self.clients.claim());
})