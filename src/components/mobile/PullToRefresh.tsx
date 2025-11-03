"use client";

import React from "react";

type Props = { onRefresh?: () => Promise<void> | void; children: React.ReactNode };

export default function PullToRefresh({ onRefresh, children }: Props) {
	const startY = React.useRef<number | null>(null);
	const pulling = React.useRef(false);

	function onTouchStart(e: React.TouchEvent) {
		if (window.scrollY === 0) {
			startY.current = e.touches[0].clientY;
			pulling.current = true;
		}
	}

	async function onTouchEnd(e: React.TouchEvent) {
		if (!pulling.current || startY.current == null) return;
		const dy = (e.changedTouches[0].clientY ?? 0) - startY.current;
		startY.current = null;
		pulling.current = false;
		if (dy > 60) {
			await onRefresh?.();
		}
	}

	return (
		<div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
			{children}
		</div>
	);
}


