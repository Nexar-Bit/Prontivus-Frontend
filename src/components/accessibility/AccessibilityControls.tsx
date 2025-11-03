"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function toggleClass(cls: string, on: boolean) {
	const el = document.documentElement;
	if (on) el.classList.add(cls); else el.classList.remove(cls);
	localStorage.setItem(cls, on ? "1" : "0");
}

function getPref(cls: string) {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(cls) === "1";
}

export default function AccessibilityControls() {
	const [highContrast, setHighContrast] = useState(false);
	const [largeText, setLargeText] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		setHighContrast(getPref("a11y-high-contrast"));
		setLargeText(getPref("a11y-large-text"));
		setReducedMotion(getPref("a11y-reduced-motion"));
	}, []);

	useEffect(() => toggleClass("a11y-high-contrast", highContrast), [highContrast]);
	useEffect(() => toggleClass("a11y-large-text", largeText), [largeText]);
	useEffect(() => toggleClass("a11y-reduced-motion", reducedMotion), [reducedMotion]);

	return (
		<div className="fixed bottom-20 left-4 z-50 md:left-auto md:right-4 md:bottom-4 grid gap-2">
			<Button variant={highContrast ? "default" : "outline"} onClick={() => setHighContrast(v => !v)} aria-pressed={highContrast}>
				High contrast
			</Button>
			<Button variant={largeText ? "default" : "outline"} onClick={() => setLargeText(v => !v)} aria-pressed={largeText}>
				Large text
			</Button>
			<Button variant={reducedMotion ? "default" : "outline"} onClick={() => setReducedMotion(v => !v)} aria-pressed={reducedMotion}>
				Reduced motion
			</Button>
		</div>
	);
}


