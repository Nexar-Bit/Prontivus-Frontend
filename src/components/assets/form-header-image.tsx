"use client";

import React from "react";
import { ProntivusLogo } from "./prontivus-logo";
import { MedicalPattern } from "./medical-pattern";
import { cn } from "@/lib/utils";

interface FormHeaderImageProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export function FormHeaderImage({
  title,
  subtitle,
  variant = "default",
  className,
}: FormHeaderImageProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-3 py-4", className)}>
        <ProntivusLogo variant="icon" size="md" />
        {title && (
          <div>
            <h1 className="text-xl font-bold text-[#0F4C75]">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("relative py-6 px-4 bg-gradient-to-r from-[#0F4C75] to-[#1B9AAA] rounded-lg", className)}>
        <MedicalPattern variant="dots" intensity="medium" color="#FFFFFF" />
        <div className="relative z-10 flex items-center gap-4">
          <ProntivusLogo variant="icon" size="lg" includeMedicalSymbol={false} />
          <div className="text-white">
            {title && <h1 className="text-lg font-bold">{title}</h1>}
            {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative py-8 px-6 bg-gradient-to-br from-[#0F4C75] via-[#1B9AAA] to-[#16C79A] rounded-xl shadow-lg", className)}>
      <MedicalPattern variant="circuit" intensity="subtle" color="#FFFFFF" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <ProntivusLogo variant="full" size="xl" />
        {title && (
          <h1 className="text-2xl font-bold text-white text-center">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-white/90 text-center max-w-md">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

