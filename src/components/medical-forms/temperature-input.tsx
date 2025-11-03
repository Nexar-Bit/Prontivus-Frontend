"use client";

import * as React from "react";
import { MedicalInput } from "./medical-input";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface TemperatureInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  unit?: "celsius" | "fahrenheit";
}

export function TemperatureInput({
  label = "Temperatura",
  value = "",
  onChange,
  error,
  required,
  className,
  unit = "celsius",
}: TemperatureInputProps) {
  const handleChange = (val: string) => {
    // Allow digits and one decimal point
    const cleaned = val.replace(/[^\d.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length <= 2 && parts[0].length <= 2) {
      onChange?.(parts.join("."));
    }
  };

  const tempNum = parseFloat(value) || 0;
  const normalMin = unit === "celsius" ? 36.1 : 97.0;
  const normalMax = unit === "celsius" ? 37.2 : 99.0;
  const isNormal = tempNum >= normalMin && tempNum <= normalMax;
  const isAbnormal = value && (tempNum < normalMin || tempNum > normalMax);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value && (
          <div className="flex items-center gap-1.5">
            {isNormal ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Normal</span>
              </div>
            ) : isAbnormal ? (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Fora da faixa</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={unit === "celsius" ? "36.5" : "98.6"}
          className={cn(
            "w-full h-11 rounded-lg border-2 px-4 pr-12 text-center text-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#0F4C75]/20",
            error
              ? "border-red-300 bg-red-50/50 focus-visible:border-red-400"
              : value && isNormal
              ? "border-green-300 bg-green-50/30 focus-visible:border-green-400"
              : value && isAbnormal
              ? "border-red-300 bg-red-50/30 focus-visible:border-red-400"
              : "border-gray-300 bg-white hover:border-gray-400 focus-visible:border-[#0F4C75]"
          )}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
          °{unit === "celsius" ? "C" : "F"}
        </span>
        {value && isNormal && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
        )}
      </div>

      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Faixa normal:</span>{" "}
          {unit === "celsius" ? "36.1°C - 37.2°C" : "97.0°F - 99.0°F"}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

