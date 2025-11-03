"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HeartbeatLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "red" | "green";
  className?: string;
}

export function HeartbeatLoader({
  size = "md",
  color = "primary",
  className,
}: HeartbeatLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const colorClasses = {
    primary: "text-[#0F4C75]",
    red: "text-[#FF3B30]",
    green: "text-[#34C759]",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className={cn(
          "heartbeat-loader",
          sizeClasses[size],
          colorClasses[color]
        )}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}

