"use client";

import React from "react";
import PortalNavbar from "@/components/portal/portal-navbar";
import MobileTabBar from "@/components/mobile/MobileTabBar";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import EmergencyButton from "@/components/mobile/EmergencyButton";
import FeatureGate from "@/components/flags/FeatureGate";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <PortalNavbar />
      <FeatureGate name="newMobileNav" fallback={
        <main id="main" role="main" className="container mx-auto px-4 py-4 md:py-8">{children}</main>
      }>
        <PullToRefresh onRefresh={() => location.reload()}>
          <main id="main" role="main" className="container mx-auto px-4 py-4 md:py-8">
            {children}
          </main>
        </PullToRefresh>
        <EmergencyButton onTrigger={() => alert("Emergency contact triggered")}/>
        <MobileTabBar />
      </FeatureGate>
    </div>
  );
}
