"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

type Props = { onTrigger?: () => void };

export default function EmergencyButton({ onTrigger }: Props) {
	useEffect(() => {
		let lastShake = 0;
		function onMotion(e: DeviceMotionEvent) {
			const acc = e.accelerationIncludingGravity;
			if (!acc) return;
			const magnitude = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
			const now = Date.now();
			if (magnitude > 40 && now - lastShake > 2000) {
				lastShake = now;
				onTrigger?.();
			}
		}
		window.addEventListener("devicemotion", onMotion);
		return () => window.removeEventListener("devicemotion", onMotion);
	}, [onTrigger]);

	return (
		<Button
			className="fixed bottom-20 right-4 md:hidden rounded-full h-14 w-14 shadow-lg"
			variant="destructive"
			onClick={() => onTrigger?.()}
			aria-label="Emergency"
		>
			<PhoneCall className="h-6 w-6" />
		</Button>
	);
}


