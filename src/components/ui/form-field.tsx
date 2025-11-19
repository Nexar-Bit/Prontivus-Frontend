"use client";

import * as React from "react";
import { Label } from "./label";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ 
  label, 
  htmlFor, 
  required, 
  error, 
  className,
  children 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
          <span className="h-3.5 w-3.5">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

