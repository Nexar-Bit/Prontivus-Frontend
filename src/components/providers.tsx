"use client";

import React from "react";
import { AuthProvider, ThemeProvider } from "@/contexts";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlags";
import { OperationProgressProvider } from "@/contexts/OperationProgressContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<FeatureFlagsProvider>
				<AuthProvider>
					<OperationProgressProvider>
						{children}
						<Toaster position="top-right" richColors />
					</OperationProgressProvider>
				</AuthProvider>
			</FeatureFlagsProvider>
		</ThemeProvider>
	);
}


