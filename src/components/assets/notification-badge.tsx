"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  variant?: "default" | "urgent" | "critical";
  className?: string;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  variant = "default",
  className,
}: NotificationBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const variantClasses = {
    default: "bg-blue-500 text-white",
    urgent: "bg-orange-500 text-white",
    critical: "bg-red-600 text-white animate-pulse",
  };

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center rounded-full text-xs font-bold min-w-[18px] h-[18px] px-1.5",
        variantClasses[variant],
        className
      )}
      aria-label={`${count} notificações`}
      role="status"
    >
      {displayCount}
    </div>
  );
}

