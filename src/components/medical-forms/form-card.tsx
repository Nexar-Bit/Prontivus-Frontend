"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FormCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "highlighted" | "medical";
}

export function FormCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  variant = "default",
}: FormCardProps) {
  return (
    <Card
      className={cn(
        "medical-card border-2 transition-all",
        variant === "highlighted" && "border-[#0F4C75] shadow-lg",
        variant === "medical" && "border-blue-200 bg-gradient-to-br from-white to-blue-50/30",
        className
      )}
    >
      {(title || Icon) && (
        <CardHeader className="pb-4">
          {Icon && (
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#0F4C75]/10">
                <Icon className="h-5 w-5 text-[#0F4C75]" />
              </div>
              {title && (
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {title}
                </CardTitle>
              )}
            </div>
          )}
          {!Icon && title && <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm text-gray-600 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !Icon && "pt-6")}>
        {children}
      </CardContent>
    </Card>
  );
}

