"use client";

import React, { ReactNode, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimelineScrollProps {
  children: ReactNode;
  className?: string;
  smoothScroll?: boolean;
}

export function TimelineScroll({
  children,
  className,
  smoothScroll = true,
}: TimelineScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (smoothScroll && containerRef.current) {
      containerRef.current.style.scrollBehavior = "smooth";
    }
  }, [smoothScroll]);

  return (
    <div
      ref={containerRef}
      className={cn("medical-timeline overflow-y-auto", className)}
    >
      {children}
    </div>
  );
}

