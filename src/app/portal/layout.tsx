"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isLoginPage = pathname === "/portal/login";
  const isRegisterPage = pathname === "/portal/register";
  const isAuthPage = isLoginPage || isRegisterPage;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {!isAuthPage && <PortalNavbar />}
      <FeatureGate name="newMobileNav" fallback={
        <main id="main" role="main" className={isAuthPage ? "" : "container mx-auto px-4 py-4 md:py-8"}>{children}</main>
      }>
        <PullToRefresh onRefresh={() => location.reload()}>
          <main id="main" role="main" className={isAuthPage ? "" : "container mx-auto px-4 py-4 md:py-8"}>
            {children}
          </main>
        </PullToRefresh>
        {!isAuthPage && <EmergencyButton onTrigger={() => alert("Emergency contact triggered")}/>}
        {!isAuthPage && <MobileTabBar />}
      </FeatureGate>
    </div>
  );
}
