"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MedicalPatternProps {
  variant?: "dots" | "grid" | "waves" | "circuit" | "cells";
  intensity?: "subtle" | "medium" | "strong";
  color?: string;
  className?: string;
}

export function MedicalPattern({
  variant = "dots",
  intensity = "subtle",
  color = "#0F4C75",
  className,
}: MedicalPatternProps) {
  const opacityMap = {
    subtle: 0.03,
    medium: 0.08,
    strong: 0.15,
  };

  const opacity = opacityMap[intensity];

  if (variant === "dots") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern
          id="dots-pattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1.5" fill={color} opacity={opacity} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#dots-pattern)" />
      </svg>
    );
  }

  if (variant === "grid") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern
          id="grid-pattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={opacity}
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    );
  }

  if (variant === "waves") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern
          id="waves-pattern"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0,50 Q25,30 50,50 T100,50"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity={opacity}
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#waves-pattern)" />
      </svg>
    );
  }

  if (variant === "circuit") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern
          id="circuit-pattern"
          x="0"
          y="0"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="30" cy="30" r="2" fill={color} opacity={opacity} />
          <path
            d="M30 0 L30 25 M30 35 L30 60 M0 30 L25 30 M35 30 L60 30"
            stroke={color}
            strokeWidth="1"
            opacity={opacity * 0.5}
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    );
  }

  if (variant === "cells") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <pattern
          id="cells-pattern"
          x="0"
          y="0"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="25" cy="25" r="15" fill="none" stroke={color} strokeWidth="1" opacity={opacity} />
          <circle cx="25" cy="25" r="8" fill={color} opacity={opacity * 0.5} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#cells-pattern)" />
      </svg>
    );
  }

  return null;
}

