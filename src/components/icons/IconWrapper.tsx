/**
 * Icon Wrapper Component
 * Provides consistent sizing and styling for medical icons
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface IconWrapperProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  variant?: "default" | "primary" | "secondary" | "muted" | "success" | "accent";
}

const sizeMap = {
  sm: "h-4 w-4",   // 16px
  md: "h-5 w-5",   // 20px
  lg: "h-6 w-6",   // 24px (default)
  xl: "h-8 w-8",   // 32px
};

const variantMap = {
  default: "text-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  muted: "text-muted-foreground",
  success: "text-success",
  accent: "text-primary-accent",
};

export const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  size = "lg",
  className,
  variant = "default",
}) => {
  const sizeClass = typeof size === "number" 
    ? undefined 
    : sizeMap[size];
  
  // For numeric sizes, we need to use inline styles
  // This is acceptable for dynamic sizing values
  // eslint-disable-next-line react/forbid-dom-props
  const sizeStyle = typeof size === "number" 
    ? { width: `${size}px`, height: `${size}px` } 
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        sizeClass,
        variantMap[variant],
        className
      )}
      style={sizeStyle}
    >
      {children}
    </span>
  );
};

