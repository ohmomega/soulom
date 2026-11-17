// v2 also clears the old v1 cache, which kept every past build's JS/CSS forever.
const CACHE_NAME = "soulom-shell-v2";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put("/", response.clone());
    return response;
  } catch {
    return (await cache.match("/")) ?? Response.error();
  }
}

// Build files are named like /assets/index-<hash>.js. Keep one version per name so the cache never grows.
function assetFamily(pathname) {
  const match = pathname.match(/^\/assets\/(.+?)-[A-Za-z0-9_-]{6,}(\.[a-z0-9]+)$/);
  return match ? `${match[1]}${match[2]}` : null;
}

async function dropOlderVersions(cache, pathname) {
  const family = assetFamily(pathname);
  if (!family) return;
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((key) => {
        const keyPath = new URL(key.url).pathname;
        return keyPath !== pathname && assetFamily(keyPath) === family;
      })
      .map((key) => cache.delete(key)),
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await dropOlderVersions(cache, new URL(request.url).pathname);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  }
});
