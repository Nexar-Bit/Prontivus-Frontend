"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn(
        "animate-page-enter",
        className
      )}
    >
      {children}
    </div>
  );
}

