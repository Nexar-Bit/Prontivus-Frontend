"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PulseLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "blue" | "teal";
  className?: string;
}

export function PulseLoader({
  size = "md",
  color = "primary",
  className,
}: PulseLoaderProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorClasses = {
    primary: "bg-[#0F4C75]",
    blue: "bg-[#0F4C75]",
    teal: "bg-[#1B9AAA]",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full pulse-dot-1",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      <div
        className={cn(
          "rounded-full pulse-dot-2",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      <div
        className={cn(
          "rounded-full pulse-dot-3",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </div>
  );
}

