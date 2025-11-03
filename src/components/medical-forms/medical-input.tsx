"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MedicalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  medicalContext?: {
    normalRange?: string;
    unit?: string;
    critical?: boolean;
  };
  showValidation?: boolean;
}

export function MedicalInput({
  label,
  required,
  error,
  hint,
  medicalContext,
  showValidation = true,
  className,
  id,
  ...props
}: MedicalInputProps) {
  const inputId = id || `medical-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;
  const hasValue = props.value !== undefined && props.value !== "";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium",
            required && "after:content-['*'] after:ml-1 after:text-red-500"
          )}
        >
          {label}
        </Label>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{hint}</p>
                {medicalContext?.normalRange && (
                  <p className="text-xs mt-1 text-blue-600">
                    Normal: {medicalContext.normalRange}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {medicalContext?.critical && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            Crítico
          </span>
        )}
      </div>

      <div className="relative">
        <Input
          id={inputId}
          className={cn(
            "h-11 rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:ring-[#0F4C75]/20",
            hasError
              ? "border-red-300 bg-red-50/50 focus-visible:border-red-400 focus-visible:ring-red-400/20"
              : hasValue && showValidation
              ? "border-green-300 bg-green-50/30 focus-visible:border-green-400"
              : "border-gray-300 bg-white hover:border-gray-400 focus-visible:border-[#0F4C75]",
            medicalContext?.unit && "pr-12",
            className
          )}
          {...props}
        />
        {medicalContext?.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
            {medicalContext.unit}
          </span>
        )}
        {showValidation && hasValue && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      {medicalContext?.normalRange && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Faixa normal: {medicalContext.normalRange}
        </p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

