"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProntivusLogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  includeMedicalSymbol?: boolean;
}

export function ProntivusLogo({
  variant = "full",
  size = "md",
  includeMedicalSymbol = true,
  className,
}: ProntivusLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const currentSize = iconSizes[size];
  const currentSizeClass = sizeClasses[size];

  if (variant === "icon") {
    return (
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("prontivus-logo-icon", className)}
        aria-label="Prontivus Logo"
        role="img"
      >
        {/* Medical Cross Symbol */}
        <circle cx="32" cy="32" r="30" fill="#0F4C75" />
        <path
          d="M32 16 L32 48 M16 32 L48 32"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Stethoscope outline - subtle */}
        {includeMedicalSymbol && (
          <path
            d="M20 28 Q20 24 24 24 Q28 24 28 28 L28 36 Q28 40 32 40 Q36 40 36 36 L36 28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
          />
        )}
      </svg>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("flex items-center", currentSizeClass, className)}>
        <svg
          width={currentSize * 4}
          height={currentSize}
          viewBox="0 0 200 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="prontivus-logo-text"
          aria-label="Prontivus"
          role="img"
        >
          <text
            x="10"
            y="28"
            fontSize="28"
            fontWeight="700"
            fill="#0F4C75"
            fontFamily="var(--font-geist-sans), sans-serif"
          >
            Prontivus
          </text>
          {includeMedicalSymbol && (
            <circle cx="185" cy="20" r="8" fill="#0F4C75" opacity="0.2" />
          )}
        </svg>
      </div>
    );
  }

  // Full logo (icon + text)
  return (
    <div className={cn("flex items-center gap-3", currentSizeClass, className)}>
      <svg
        width={currentSize}
        height={currentSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="prontivus-logo-icon"
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="30" fill="#0F4C75" />
        <path
          d="M32 16 L32 48 M16 32 L48 32"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {includeMedicalSymbol && (
          <path
            d="M20 28 Q20 24 24 24 Q28 24 28 28 L28 36 Q28 40 32 40 Q36 40 36 36 L36 28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
          />
        )}
      </svg>
      <svg
        width={currentSize * 3}
        height={currentSize}
        viewBox="0 0 150 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="prontivus-logo-text"
        aria-label="Prontivus"
        role="img"
      >
        <text
          x="0"
          y="28"
          fontSize="28"
          fontWeight="700"
          fill="#0F4C75"
          fontFamily="var(--font-geist-sans), sans-serif"
        >
          Prontivus
        </text>
      </svg>
    </div>
  );
}

