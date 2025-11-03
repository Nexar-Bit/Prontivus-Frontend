"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ChartBackgroundProps {
  type?: "line" | "bar" | "pie" | "area";
  className?: string;
}

export function ChartBackground({
  type = "line",
  className,
}: ChartBackgroundProps) {
  if (type === "line" || type === "area") {
    return (
      <svg
        className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="chart-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              opacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chart-grid)" />
      </svg>
    );
  }

  return null;
}

interface DataVisualizationIconProps {
  type: "trend-up" | "trend-down" | "stable" | "peak" | "low";
  size?: number;
  className?: string;
}

export function DataVisualizationIcon({
  type,
  size = 24,
  className,
}: DataVisualizationIconProps) {
  const icons = {
    "trend-up": (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M3 18 L9 12 L13 16 L21 8"
          stroke="#16C79A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 8 L15 8 L21 14 L21 8"
          stroke="#16C79A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    "trend-down": (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M3 6 L9 12 L13 8 L21 16"
          stroke="#FF3B30"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 16 L15 16 L21 10 L21 16"
          stroke="#FF3B30"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    stable: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M3 12 L21 12"
          stroke="#5D737E"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    peak: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M6 18 L12 6 L18 18"
          stroke="#FF9500"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    low: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M6 6 L12 18 L18 6"
          stroke="#0F4C75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[type] || null;
}

