"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		
		// Clear browser cache on startup
		const clearCache = async () => {
			try {
				// Clear all service worker caches (they will be recreated)
				if ("caches" in window) {
					const cacheNames = await caches.keys();
					await Promise.all(cacheNames.map((name) => caches.delete(name)));
				}

				// Unregister all old service workers
				if ("serviceWorker" in navigator) {
					const registrations = await navigator.serviceWorker.getRegistrations();
					await Promise.all(registrations.map((registration) => registration.unregister()));
				}

				// Clear HTTP cache by adding cache-busting parameter to critical resources
				// This forces browser to fetch fresh versions
				if ("serviceWorker" in navigator) {
					// Register new service worker with cache-busting
					const swUrl = `/sw.js?t=${Date.now()}`;
					const registration = await navigator.serviceWorker.register(swUrl);
					
					// Check for updates immediately
					registration.update();
					
					// Listen for updates
					registration.addEventListener("updatefound", () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener("statechange", () => {
								if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
									// New service worker available, reload page
									window.location.reload();
								}
							});
						}
					});
				}
			} catch (error) {
				console.error("Error clearing cache:", error);
			}
		};

		clearCache();
	}, []);
	return null;
}


