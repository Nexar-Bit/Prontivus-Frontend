"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PulseResultProps {
  children: ReactNode;
  isNew?: boolean;
  isAbnormal?: boolean;
  className?: string;
}

export function PulseResult({
  children,
  isNew = false,
  isAbnormal = false,
  className,
}: PulseResultProps) {
  const [shouldPulse, setShouldPulse] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setShouldPulse(true);
      const timer = setTimeout(() => {
        setShouldPulse(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={cn(
        "relative",
        shouldPulse && "pulse-result-new",
        isAbnormal && "border-l-4 border-yellow-500 pl-3",
        className
      )}
    >
      {children}
      {shouldPulse && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full pulse-dot" />
      )}
    </div>
  );
}

