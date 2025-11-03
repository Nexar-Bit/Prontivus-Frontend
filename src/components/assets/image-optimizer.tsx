"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

/**
 * Optimized Image Component
 * Wraps Next.js Image with medical theme defaults and accessibility
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  sizes,
  objectFit = "contain",
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("medical-image", className)}
      priority={priority}
      quality={quality}
      sizes={sizes}
      style={{ objectFit }}
      loading={priority ? undefined : "lazy"}
    />
  );
}

