"use client";

/* eslint-disable react/forbid-dom-props */
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ListItemAnimationProps {
  children: ReactNode;
  index: number;
  className?: string;
  delay?: number;
}

export function ListItemAnimation({
  children,
  index,
  className,
  delay = 0,
}: ListItemAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  const animationDelay = `${index * 50 + delay}ms`;

  return (
    <div
      ref={itemRef}
      className={cn(
        "animate-list-item-enter",
        isVisible && "animate-list-item-visible",
        className
      )}
      style={
        {
          "--animation-delay": animationDelay,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

