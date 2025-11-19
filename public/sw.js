// Version number - change this to force cache clear on next load
// Using timestamp ensures cache is cleared on every service worker update
const CACHE_VERSION = "v" + Date.now();
const CACHE_NAME = `prontivus-cache-${CACHE_VERSION}`;
const CRITICAL = ["/", "/portal", "/patient/profile", "/manifest.json"];

self.addEventListener("install", (event) => {
	// Force activation of new service worker immediately
	self.skipWaiting();
	event.waitUntil(
		caches.keys().then((keys) => {
			// Delete all old caches first
			return Promise.all(keys.map((k) => caches.delete(k)));
		}).then(() => {
			// Don't pre-cache HTML pages - always fetch fresh
			// Only cache static assets if needed
			return Promise.resolve();
		})
	);
});

// Listen for skip waiting message
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			// Delete all old caches
			caches.keys().then((keys) => {
				return Promise.all(keys.map((k) => caches.delete(k)));
			}),
			// Take control of all clients immediately (but don't force reload)
			clients.claim()
		])
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	
	const url = new URL(request.url);
	
	// For navigation requests (HTML pages), always fetch fresh (no cache)
	if (request.mode === "navigate" || request.destination === "document") {
		event.respondWith(
			fetch(request, {
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache',
				}
			}).catch(() => {
				// Fallback to cache only if network completely fails
				return caches.match(request);
			})
		);
		return;
	}
	
	// For HTML files, never cache
	if (url.pathname.endsWith('.html') || request.headers.get('accept')?.includes('text/html')) {
		event.respondWith(
			fetch(request, {
				cache: 'no-store',
				headers: {
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache',
				}
			})
		);
		return;
	}
	
	// For API requests, use network-first with no cache
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(request, {
				cache: 'no-store',
			}).catch(() => {
				// Fallback to cache only if network fails
				return caches.match(request);
			})
		);
		return;
	}
	
	// For other requests (static assets), use network-first strategy with cache fallback
	event.respondWith(
		fetch(request, {
			cache: 'no-cache',
		})
			.then((res) => {
				// Only cache static assets (images, fonts, etc.)
				if (res.ok && (request.destination === 'image' || request.destination === 'font' || request.destination === 'style')) {
					const copy = res.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
				}
				return res;
			})
			.catch(() => {
				// Fallback to cache if network fails
				return caches.match(request);
			})
	);
});

// Push notification event listener
self.addEventListener("push", (event) => {
	let notificationData = {
		title: "Prontivus",
		body: "Você tem uma nova notificação",
		icon: "/favicon.png",
		badge: "/favicon.png",
		tag: "default",
		data: {},
	};

	if (event.data) {
		try {
			const data = event.data.json();
			notificationData = {
				title: data.title || notificationData.title,
				body: data.body || notificationData.body,
				icon: data.icon || notificationData.icon,
				badge: data.badge || notificationData.badge,
				tag: data.tag || notificationData.tag,
				data: data.data || notificationData.data,
				requireInteraction: data.requireInteraction || false,
			};
		} catch (e) {
			console.error("Error parsing push notification data:", e);
		}
	}

	const promiseChain = self.registration.showNotification(notificationData.title, {
		body: notificationData.body,
		icon: notificationData.icon,
		badge: notificationData.badge,
		tag: notificationData.tag,
		data: notificationData.data,
		requireInteraction: notificationData.requireInteraction,
		vibrate: [200, 100, 200],
		timestamp: Date.now(),
	});

	event.waitUntil(promiseChain);
});

// Notification click event listener
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const data = event.notification.data || {};
	const urlToOpen = data.url || "/";

	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			// Check if there's already a window/tab open with the target URL
			for (let i = 0; i < clientList.length; i++) {
				const client = clientList[i];
				if (client.url === urlToOpen && "focus" in client) {
					return client.focus();
				}
			}
			// If not, open a new window/tab
			if (clients.openWindow) {
				return clients.openWindow(urlToOpen);
			}
		})
	);
});


