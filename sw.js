// Service worker de Mufrad : permet d'ouvrir l'application sans réseau et de l'installer sur l'écran d'accueil.
// Stratégie « réseau d'abord » : en ligne, on sert toujours la dernière version et on en garde une copie ;
// hors ligne, on sert la copie. Ainsi une mise à jour n'est jamais bloquée par un vieux cache.
// Une version d'essai (…/essai/<branche>/) a son propre service worker et sa propre copie hors ligne :
// le nom de la copie porte celui de la branche, pour que les versions ne s'effacent pas l'une l'autre.
const ESSAI = (self.location.pathname.match(/\/essai\/([^/]+)\//) || [])[1] || "";
const PREFIXE = "mufrad-" + (ESSAI ? "essai-" + ESSAI + "-" : "") + "v";
const CACHE = PREFIXE + "32";
// Les fichiers d'unité ne sont pas listés ici : ils sont mis en copie à leur première lecture en ligne.
const BASE = ["./", "index.html", "css/app.css", "js/contenu.js", "js/assemblage.js", "js/app.js", "js/grammaire.js", "css/grammaire.css", "manifest.webmanifest", "icons/icone-192.png"];

self.addEventListener("install", e => {
  // Copie initiale des fichiers de l'application ; un échec n'empêche pas l'installation
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // On supprime les copies précédentes de cette version-ci seulement (principale, ou cette branche d'essai)
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith(PREFIXE) && /^\d+$/.test(k.slice(PREFIXE.length))).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // On ne s'occupe que des lectures de nos propres fichiers ; le reste (polices, base de données) passe sans nous
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    // « no-cache » : le navigateur redemande toujours au serveur si le fichier a changé, pour que les mises à jour arrivent tout de suite
    fetch(req.url, { cache: "no-cache" }).then(res => {
      // Adresse d'une page écrite sans sa barre finale (…/essai/ma-branche) : le serveur redirige, et le navigateur
      // refuse qu'on lui rende une réponse déjà redirigée pour une page. On lui demande donc d'aller à la bonne adresse.
      if (res.redirected && req.mode === "navigate") return Response.redirect(res.url, 302);
      if (res.ok) { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(req).then(hit => hit || c.match("index.html"))))
  );
});
