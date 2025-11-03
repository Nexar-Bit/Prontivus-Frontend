"use client";

import React from "react";
import { MedicalPattern } from "./medical-pattern";
import { cn } from "@/lib/utils";

interface DocumentBackgroundProps {
  variant?: "prescription" | "certificate" | "report" | "form";
  className?: string;
  children?: React.ReactNode;
}

export function DocumentBackground({
  variant = "prescription",
  className,
  children,
}: DocumentBackgroundProps) {
  const variantConfig = {
    prescription: {
      pattern: "dots" as const,
      intensity: "subtle" as const,
    },
    certificate: {
      pattern: "circuit" as const,
      intensity: "subtle" as const,
    },
    report: {
      pattern: "grid" as const,
      intensity: "medium" as const,
    },
    form: {
      pattern: "waves" as const,
      intensity: "subtle" as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "relative bg-white min-h-screen",
        className
      )}
    >
      <MedicalPattern
        variant={config.pattern}
        intensity={config.intensity}
        color="#0F4C75"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

