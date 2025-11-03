"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface MedicalAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  role?: "doctor" | "patient" | "nurse" | "admin";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBadge?: boolean;
}

export function MedicalAvatar({
  src,
  alt,
  name,
  role = "patient",
  size = "md",
  className,
  showBadge = false,
}: MedicalAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const badgeSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };

  const roleColors = {
    doctor: "bg-[#0F4C75]",
    patient: "bg-[#1B9AAA]",
    nurse: "bg-[#16C79A]",
    admin: "bg-[#5D737E]",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const roleSymbols = {
    doctor: "🩺",
    patient: "👤",
    nurse: "💚",
    admin: "⚙️",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={cn(
            "rounded-full object-cover border-2 border-white shadow-md",
            sizeClasses[size],
            roleColors[role]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-md",
            sizeClasses[size],
            roleColors[role]
          )}
          role="img"
          aria-label={alt || name || `${role} avatar`}
        >
          {name ? (
            <span className="text-xs font-medium">{initials}</span>
          ) : (
            <User className="h-1/2 w-1/2" />
          )}
        </div>
      )}
      {showBadge && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-white border-2 border-white flex items-center justify-center",
            badgeSizes[size]
          )}
          aria-label={`${role} badge`}
        >
          <span className="text-[8px]">{roleSymbols[role]}</span>
        </div>
      )}
    </div>
  );
}

