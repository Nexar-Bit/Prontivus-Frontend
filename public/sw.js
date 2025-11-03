const CACHE_NAME = "prontivus-cache-v1";
const CRITICAL = ["/", "/portal", "/patient/profile", "/manifest.json"];

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CRITICAL)));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	event.respondWith(
		caches.match(request).then((cached) =>
			cached ||
			fetch(request)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
					return res;
				})
				.catch(() => cached)
		)
	);
});


