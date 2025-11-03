"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardHoverProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: "elevate" | "glow" | "scale";
}

export function CardHover({
  children,
  className,
  hoverEffect = "elevate",
}: CardHoverProps) {
  const effectClasses = {
    elevate: "hover:shadow-lg hover:-translate-y-1",
    glow: "hover:shadow-[0_0_20px_rgba(15,76,117,0.2)]",
    scale: "hover:scale-[1.02]",
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        effectClasses[hoverEffect],
        className
      )}
    >
      {children}
    </div>
  );
}

