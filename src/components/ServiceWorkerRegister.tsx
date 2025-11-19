"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ServiceWorkerRegister() {
	const pathname = usePathname();
	
	useEffect(() => {
		if (typeof window === "undefined") return;
		
		// Clear cache on page navigation (without reload)
		const clearCacheOnNavigation = async () => {
			try {
				// Clear service worker caches silently when navigating to a new page
				if ("caches" in window) {
					const cacheNames = await caches.keys();
					// Delete all caches except very recent ones (within last minute)
					const now = Date.now();
					const oldCaches = cacheNames.filter(name => {
						// Extract timestamp from cache name if possible
						const match = name.match(/v(\d+)/);
						if (match) {
							const cacheTime = parseInt(match[1]);
							return (now - cacheTime) > 60000; // Older than 1 minute
						}
						return true; // Delete if we can't determine age
					});
					await Promise.all(oldCaches.map((name) => caches.delete(name)));
				}
			} catch (error) {
				// Silently fail - don't interrupt user experience
				console.debug("Cache clear on navigation:", error);
			}
		};

		// Clear cache when pathname changes (new page)
		clearCacheOnNavigation();
	}, [pathname]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		
		// Register service worker on initial load only
		let updateInterval: NodeJS.Timeout | null = null;
		
		const registerServiceWorker = async () => {
			try {
				if ("serviceWorker" in navigator) {
					const swUrl = `/sw.js?t=${Date.now()}`;
					const registration = await navigator.serviceWorker.register(swUrl, {
						updateViaCache: 'none',
					});
					
					// Check for updates periodically (every 5 minutes), but don't force reload
					updateInterval = setInterval(() => {
						registration.update();
					}, 5 * 60 * 1000);
				}
			} catch (error) {
				console.debug("Service worker registration:", error);
			}
		};

		registerServiceWorker();
		
		// Cleanup interval on unmount
		return () => {
			if (updateInterval) {
				clearInterval(updateInterval);
			}
		};
	}, []);

	return null;
}


