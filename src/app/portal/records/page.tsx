"use client";

import React from "react";
import FeatureGate from "@/components/flags/FeatureGate";
import RecordsV2 from "@/components/v2/RecordsV2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordsPage() {
	const legacy = (
		<Card>
			<CardHeader>
				<CardTitle>Medical Records</CardTitle>
				<CardDescription>Legacy records view</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground text-sm">The modern records experience will roll out soon.</p>
			</CardContent>
		</Card>
	);

	return (
		<FeatureGate name="recordsV2" fallback={legacy}>
			<RecordsV2 />
		</FeatureGate>
	);
}


