"use client";

import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeartbeatAlertProps {
  children: ReactNode;
  severity?: "critical" | "urgent" | "warning";
  className?: string;
}

export function HeartbeatAlert({
  children,
  severity = "critical",
  className,
}: HeartbeatAlertProps) {
  const severityClasses = {
    critical: "border-red-500 bg-red-50 text-red-900",
    urgent: "border-orange-500 bg-orange-50 text-orange-900",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4 heartbeat-alert",
        severityClasses[severity],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 heartbeat-icon" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

