const cacheName = 'skill-sync-v1';
// Këtu listojmë skedarët që duam të ruajmë. 
// Kujdes: rrugët (paths) duhet të jenë të sakta.
const assets = [
  '../index.html',
  './skill.css',
  './skill.js',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/906/906334.png'
];

// 1. Instalimi i Service Worker dhe ruajtja e skedarëve në Cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('SkillSync: Duke ruajtur skedarët në cache...');
      return cache.addAll(assets);
    })
  );
});

// 2. Aktivizimi (pastrimi i cache-ve të vjetra nëse bën ndryshime)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== cacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Shërbimi i skedarëve (Fetch)
// Kur hapet app-i, SW kontrollon nëse i ka në cache, nëse jo i merr nga neti.
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
