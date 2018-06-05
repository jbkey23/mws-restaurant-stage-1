const staticCacheName = 'restaurant-reviews-static-v1'

/**
 * Cache all site assets once service worker installs
 */
self.addEventListener('install', (event) => {
    const assets = [
        '/',
        'data/restaurants.json',
        'css/styles.css',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'js/sw_controller.js',
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
        'img/icon-256.png',
        'img/icon-512.png'
    ];
  
    event.waitUntil(
      caches.open(staticCacheName).then(function(cache) {
        return cache.addAll(assets);
      })
    );
  });

/**
 * Hijack requests and serve cached versions when possible
 */
self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.open(staticCacheName).then(function(cache) {
        return cache.match(event.request).then(function(response) {
          if (response) return response;
    
          return fetch(event.request).then(function(networkResponse) {
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