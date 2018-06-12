const staticCacheName = 'restaurant-reviews-static-v2';

/**
 * Cache all site assets once service worker installs
 */
self.addEventListener('install', (event) => {
    const assets = [
        '/',
        'dist/css/main.css',
        'dist/css/restaurant.css',
        'dist/js/dbhelper.js',
        'dist/js/main.js',
        'dist/js/restaurant_info.js',
        'dist/js/sw_controller.js',
        'index.html',
        'restaurant.html',
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg',
        'img/1_400.jpg',
        'img/2_400.jpg',
        'img/3_400.jpg',
        'img/4_400.jpg',
        'img/5_400.jpg',
        'img/6_400.jpg',
        'img/7_400.jpg',
        'img/8_400.jpg',
        'img/9_400.jpg',
        'img/10_400.jpg',
        'img/icon-256.png',
        'img/icon-512.png'
    ];
  
    event.waitUntil(
      caches.open(staticCacheName).then((cache) => {
        caches.keys().then(keys => {
          keys.forEach(key => {
            if (key !== staticCacheName) {
              caches.delete(key);
            }
          });
        })

        return cache.addAll(assets);
      })
    );
  });

/**
 * Hijack requests and serve cached versions when possible
 */
self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.open(staticCacheName).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response;
    
          return fetch(event.request).then((networkResponse) => {
            const urlFromOrigin = event.request.url.startsWith(`${location.origin}`);

            if(urlFromOrigin) {
              cache.put(event.request, networkResponse.clone());
            }
          
            return networkResponse;
          });
        });
      })
    );
});