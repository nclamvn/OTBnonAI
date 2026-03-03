// Self-unregistering service worker
// This replaces any stale cached SW and immediately deactivates itself
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister().then(() => {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.navigate(client.url));
    });
  });
});
