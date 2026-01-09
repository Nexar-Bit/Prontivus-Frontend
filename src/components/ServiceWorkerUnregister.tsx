"use client";

import { useEffect } from "react";

/**
 * Unregister all service workers to fix "script behind redirect" errors
 * This component should be used temporarily to clean up problematic service workers
 */
export default function ServiceWorkerUnregister() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		
		const unregisterAll = async () => {
			try {
				if ("serviceWorker" in navigator) {
					// Get all service worker registrations
					const registrations = await navigator.serviceWorker.getRegistrations();
					
					// Unregister all
					for (const registration of registrations) {
						await registration.unregister();
						console.log("✅ Service worker unregistered");
					}
					
					// Clear all caches
					if ("caches" in window) {
						const cacheNames = await caches.keys();
						await Promise.all(cacheNames.map((name) => caches.delete(name)));
						console.log("✅ All caches cleared");
					}
					
					console.log("✅ Service workers and caches cleaned successfully");
				}
			} catch (error) {
				console.error("Failed to unregister service workers:", error);
			}
		};
		
		unregisterAll();
	}, []);
	
	return null;
}
