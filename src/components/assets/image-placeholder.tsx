"use client";

/* eslint-disable react/forbid-dom-props */
import React from "react";
import { cn } from "@/lib/utils";
import { MedicalPattern } from "./medical-pattern";

interface ImagePlaceholderProps {
  width: number;
  height: number;
  alt: string;
  variant?: "patient" | "doctor" | "document" | "chart" | "generic";
  className?: string;
}

export function ImagePlaceholder({
  width,
  height,
  alt,
  variant = "generic",
  className,
}: ImagePlaceholderProps) {
  const variantStyles = {
    patient: "bg-[#1B9AAA]/10",
    doctor: "bg-[#0F4C75]/10",
    document: "bg-gray-100",
    chart: "bg-blue-50",
    generic: "bg-gray-100",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300",
        variantStyles[variant],
        className
      )}
      style={
        {
          "--placeholder-width": `${width}px`,
          "--placeholder-height": `${height}px`,
          width: `${width}px`,
          height: `${height}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={alt}
    >
      <MedicalPattern
        variant="dots"
        intensity="subtle"
        color="#0F4C75"
      />
      <div className="relative z-10 text-center px-4">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xs text-gray-500">{alt}</p>
      </div>
    </div>
  );
}

