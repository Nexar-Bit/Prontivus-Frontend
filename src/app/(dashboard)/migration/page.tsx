"use client";

import React from "react";
import { MigrationStatusDashboard } from "@/components/migration/migration-status";

export default function MigrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F4C75]">
          Design System Migration
        </h1>
        <p className="text-gray-600 mt-2">
          Track the progress of migrating to the modern medical design system
        </p>
      </div>
      
      <MigrationStatusDashboard />
    </div>
  );
}

