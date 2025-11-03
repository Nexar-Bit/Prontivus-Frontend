"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MedicalSkeletonProps {
  type?: "patient-card" | "prescription" | "appointment" | "chart" | "table-row";
  className?: string;
}

export function MedicalSkeleton({
  type = "patient-card",
  className,
}: MedicalSkeletonProps) {
  if (type === "patient-card") {
    return (
      <div className={cn("bg-white rounded-lg p-4 shadow-sm space-y-4", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (type === "prescription") {
    return (
      <div className={cn("bg-white rounded-lg p-4 shadow-sm space-y-3", className)}>
        <Skeleton className="h-6 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (type === "appointment") {
    return (
      <div className={cn("bg-white rounded-lg p-4 shadow-sm", className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className={cn("bg-white rounded-lg p-6 shadow-sm", className)}>
        <Skeleton className="h-6 w-1/4 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (type === "table-row") {
    return (
      <tr className="border-b">
        <td className="p-4">
          <Skeleton className="h-4 w-32" />
        </td>
        <td className="p-4">
          <Skeleton className="h-4 w-24" />
        </td>
        <td className="p-4">
          <Skeleton className="h-4 w-20" />
        </td>
        <td className="p-4">
          <Skeleton className="h-4 w-16 rounded-full" />
        </td>
      </tr>
    );
  }

  return <Skeleton className={className} />;
}

