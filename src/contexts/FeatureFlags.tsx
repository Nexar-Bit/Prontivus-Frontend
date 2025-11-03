"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

type FeatureFlags = {
	newMobileNav: boolean;
	newPortalDashboard: boolean;
	appointmentsV2: boolean;
	recordsV2: boolean;
	messagesV2: boolean;
	prescriptionsV2: boolean;
};

const defaults: FeatureFlags = {
	newMobileNav: process.env.NEXT_PUBLIC_FEATURE_NEW_MOBILE_NAV === "1",
	newPortalDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_PORTAL_DASHBOARD === "1",
	appointmentsV2: process.env.NEXT_PUBLIC_FEATURE_APPOINTMENTS_V2 === "1",
	recordsV2: process.env.NEXT_PUBLIC_FEATURE_RECORDS_V2 === "1",
	messagesV2: process.env.NEXT_PUBLIC_FEATURE_MESSAGES_V2 === "1",
	prescriptionsV2: process.env.NEXT_PUBLIC_FEATURE_PRESCRIPTIONS_V2 === "1",
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaults);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
	const [overrides, setOverrides] = useState<Partial<FeatureFlags>>({});

	useEffect(() => {
		try {
			const raw = localStorage.getItem("featureFlagsOverrides");
			if (raw) setOverrides(JSON.parse(raw));
		} catch {}
	}, []);

	const value = useMemo(
		() => ({
			newMobileNav: overrides.newMobileNav ?? defaults.newMobileNav,
			newPortalDashboard: overrides.newPortalDashboard ?? defaults.newPortalDashboard,
			appointmentsV2: overrides.appointmentsV2 ?? defaults.appointmentsV2,
			recordsV2: overrides.recordsV2 ?? defaults.recordsV2,
			messagesV2: overrides.messagesV2 ?? defaults.messagesV2,
			prescriptionsV2: overrides.prescriptionsV2 ?? defaults.prescriptionsV2,
		}),
		[overrides]
	);

	return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
	return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(name: keyof FeatureFlags) {
	const flags = useFeatureFlags();
	return flags[name];
}


