"use client";

import React from "react";
import { AuthProvider } from "@/contexts";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlags";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<FeatureFlagsProvider>
			<AuthProvider>{children}</AuthProvider>
		</FeatureFlagsProvider>
	);
}


