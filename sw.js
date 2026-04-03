const CACHE_NAME = 'runestones-cache-v1';

// Add the names of your specific files here
const urlsToCache = [
  './',
  './index.html',
  // Add your CSS, JS, and image files below:
  // './style.css',
  // './game.js',
  // './icon-192.png'
];

// Install the worker and cache the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept network requests and serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached version if found, otherwise fetch from the internet
        return response || fetch(event.request);
      })
  );
});
