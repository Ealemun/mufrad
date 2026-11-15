// Service worker de Mufrad : permet d'ouvrir l'application sans réseau et de l'installer sur l'écran d'accueil.
// Stratégie « réseau d'abord » : en ligne, on sert toujours la dernière version et on en garde une copie ;
// hors ligne, on sert la copie. Ainsi une mise à jour n'est jamais bloquée par un vieux cache.
const CACHE = "mufrad-v9";
// Les fichiers d'unité ne sont pas listés ici : ils sont mis en copie à leur première lecture en ligne.
const BASE = ["./", "index.html", "css/app.css", "js/contenu.js", "js/assemblage.js", "js/app.js", "manifest.webmanifest", "icons/icone-192.png"];

self.addEventListener("install", e => {
  // Copie initiale des fichiers de l'application ; un échec n'empêche pas l'installation
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // On supprime les copies des versions précédentes
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // On ne s'occupe que des lectures de nos propres fichiers ; le reste (polices, base de données) passe sans nous
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    // « no-cache » : le navigateur redemande toujours au serveur si le fichier a changé, pour que les mises à jour arrivent tout de suite
    fetch(req.url, { cache: "no-cache" }).then(res => {
      if (res.ok) { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
