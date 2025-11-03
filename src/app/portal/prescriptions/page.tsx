"use client";

import React from "react";
import FeatureGate from "@/components/flags/FeatureGate";
import PrescriptionsV2 from "@/components/v2/PrescriptionsV2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrescriptionsPage() {
	const legacy = (
		<Card>
			<CardHeader>
				<CardTitle>Prescriptions</CardTitle>
				<CardDescription>Legacy prescriptions</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground text-sm">The modern prescriptions experience will roll out soon.</p>
			</CardContent>
		</Card>
	);

	return (
		<FeatureGate name="prescriptionsV2" fallback={legacy}>
			<PrescriptionsV2 />
		</FeatureGate>
	);
}


