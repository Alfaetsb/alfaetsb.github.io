/* ALFA ETS~B — Service Worker (PWA, fonctionnement hors connexion)
   - Pages (navigation) : réseau d'abord, cache en secours hors connexion
   - Fichiers statiques du même site : cache d'abord, mise à jour en arrière-plan
   - Requêtes d'autres sites (synchronisation cloud, API) : jamais interceptées
   Pour publier une nouvelle version : changer VERSION ci-dessous. */
var VERSION = 'alfa-ets-b-v2';
var CACHE = VERSION;
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* un fichier absent ne doit pas bloquer l'installation */
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  /* version.json : toujours depuis le réseau (détection des mises à jour) */
  if (url.pathname.slice(-12) === 'version.json') return;

  /* Pages : réseau d'abord */
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('index.html') || caches.match('./'); });
      })
    );
    return;
  }

  /* Autres fichiers : cache d'abord + mise à jour en arrière-plan */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

/* Clic sur une notification du téléphone : ouvre ou ramène l'application */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
      return self.clients.openWindow('./');
    })
  );
});
