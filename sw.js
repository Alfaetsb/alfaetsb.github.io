/* Alfa ETS~B — cache hors connexion (réseau d'abord) pour le site et l'application */
const C='alfa-etsb-v80';
const A=['./','index.html','img-hero.webp','app','app.html','manifest.webmanifest','icon-192.png','icon-512.png','img-logo.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'&&/\/app(\.html)?$/.test(new URL(r.url).pathname)?caches.match('app.html'):caches.match('index.html')))))});
