"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ModalAnimationProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function ModalAnimation({
  children,
  isOpen,
  className,
}: ModalAnimationProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "animate-modal-backdrop",
        isAnimating && "animate-modal-backdrop-visible",
        className
      )}
    >
      <div
        className={cn(
          "animate-modal-content",
          isAnimating && "animate-modal-content-visible"
        )}
      >
        {children}
      </div>
    </div>
  );
}

