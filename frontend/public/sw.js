/* Praxis KE service worker: lets the dashboard install as an app and open instantly.
   It never caches API calls, the Django admin or uploaded files, so data is always live. */
const VERSION = "praxis-ke-v1";
const SHELL = "/__shell";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (/^\/(api|admin|media|static)\//.test(url.pathname)) return;

  if (req.mode === "navigate") {
    // Network first so updates appear immediately; fall back to the saved app shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r || new Response("You're offline.", { status: 503 })))
    );
    return;
  }

  if (/^\/(assets|brand|favicons)\//.test(url.pathname) || url.pathname === "/manage.webmanifest") {
    event.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          });
          return hit || net;
        })
      )
    );
  }
});
