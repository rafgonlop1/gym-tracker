// Basic Service Worker for Gym Tracker
// This prevents the 404 error when the browser looks for a service worker

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // For now, just let the browser handle all requests normally
  // In the future, we could add caching strategies here
  return;
}); 