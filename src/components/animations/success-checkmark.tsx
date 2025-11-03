"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCheckmarkProps {
  size?: "sm" | "md" | "lg";
  show?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

export function SuccessCheckmark({
  size = "md",
  show = true,
  className,
  onAnimationComplete,
}: SuccessCheckmarkProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (!show) return null;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <CheckCircle2
        className={cn(
          "text-green-600 success-checkmark",
          sizeClasses[size],
          isVisible && "animate-success-check"
        )}
        strokeWidth={2}
      />
    </div>
  );
}

