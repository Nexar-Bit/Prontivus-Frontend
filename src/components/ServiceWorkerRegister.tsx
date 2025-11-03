"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {});
		}
	}, []);
	return null;
}


