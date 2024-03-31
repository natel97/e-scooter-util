/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**@type {ServiceWorkerGlobalScope} sw */
const sw = self;
const cacheName = "v1";

// Installing the Service Worker
sw.addEventListener("install", async () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", async (event) => {
  event.waitUntil(Promise.resolve());
});

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
  new Promise((fulfill, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    fetch(request).then((response) => {
      clearTimeout(timeoutId);
      fulfill(response);
      update(request);
    }, reject);
  });

// fetch the resource from the browser cache
const fromCache = (request) =>
  caches
    .open(cacheName)
    .then((cache) =>
      cache
        .match(request)
        .then((matching) => matching || cache.match("/offline/"))
    );

// cache the current page to make it available for offline
const update = (request) =>
  caches
    .open(cacheName)
    .then((cache) =>
      fetch(request).then((response) => cache.put(request, response))
    );

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
  );
  evt.waitUntil(update(evt.request));
});
