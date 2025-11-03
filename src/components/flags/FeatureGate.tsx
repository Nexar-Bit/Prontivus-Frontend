"use client";

import React from "react";
import { useFeatureFlag } from "@/contexts/FeatureFlags";

export default function FeatureGate({ name, children, fallback = null }: { name: Parameters<typeof useFeatureFlag>[0]; children: React.ReactNode; fallback?: React.ReactNode }) {
	const enabled = useFeatureFlag(name);
	return <>{enabled ? children : fallback}</>;
}


