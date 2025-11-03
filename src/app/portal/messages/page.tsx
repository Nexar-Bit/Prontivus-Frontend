"use client";

import React from "react";
import FeatureGate from "@/components/flags/FeatureGate";
import MessagesV2 from "@/components/v2/MessagesV2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
	const legacy = (
		<Card>
			<CardHeader>
				<CardTitle>Messages</CardTitle>
				<CardDescription>Legacy messaging</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground text-sm">A new messaging experience is coming.</p>
			</CardContent>
		</Card>
	);

	return (
		<FeatureGate name="messagesV2" fallback={legacy}>
			<MessagesV2 />
		</FeatureGate>
	);
}


