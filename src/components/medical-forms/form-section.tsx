"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
  required = false,
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "flex items-center justify-between",
          collapsible && "cursor-pointer",
          !collapsible && "pb-2"
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-[#0F4C75]/10">
              <Icon className="h-4 w-4 text-[#0F4C75]" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              {title}
              {required && <span className="text-red-500 text-sm">*</span>}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {(!collapsible || isExpanded) && (
        <div className="pt-2 space-y-4">{children}</div>
      )}
    </div>
  );
}

