"use client";

import * as React from "react";
import { MedicalInput } from "./medical-input";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface BloodPressureInputProps {
  label?: string;
  value?: { systolic: string; diastolic: string };
  onChange?: (value: { systolic: string; diastolic: string }) => void;
  error?: { systolic?: string; diastolic?: string };
  required?: boolean;
  className?: string;
}

export function BloodPressureInput({
  label = "Pressão Arterial",
  value = { systolic: "", diastolic: "" },
  onChange,
  error,
  required,
  className,
}: BloodPressureInputProps) {
  const handleChange = (field: "systolic" | "diastolic", val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (numericVal.length <= 3) {
      onChange?.({
        ...value,
        [field]: numericVal,
      });
    }
  };

  const systolicNum = parseInt(value.systolic) || 0;
  const diastolicNum = parseInt(value.diastolic) || 0;

  // Normal range: 90-120 / 60-80
  const isNormal =
    systolicNum >= 90 &&
    systolicNum <= 120 &&
    diastolicNum >= 60 &&
    diastolicNum <= 80;
  const isElevated =
    (systolicNum > 120 || systolicNum < 90) ||
    (diastolicNum > 80 || diastolicNum < 60);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value.systolic && value.diastolic && (
          <div className="flex items-center gap-1.5">
            {isNormal ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Normal</span>
              </div>
            ) : isElevated ? (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Fora da faixa</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={value.systolic}
              onChange={(e) => handleChange("systolic", e.target.value)}
              placeholder="120"
              className={cn(
                "w-full h-11 rounded-lg border-2 px-4 text-center text-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#0F4C75]/20",
                error?.systolic
                  ? "border-red-300 bg-red-50/50"
                  : value.systolic && isNormal
                  ? "border-green-300 bg-green-50/30"
                  : value.systolic && isElevated
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-300 bg-white hover:border-gray-400 focus-visible:border-[#0F4C75]"
              )}
              maxLength={3}
            />
          </div>
          <p className="text-xs text-center text-gray-500">Sistólica</p>
          {error?.systolic && (
            <p className="text-xs text-red-600 text-center">{error.systolic}</p>
          )}
        </div>

        <div className="flex items-center justify-center text-2xl font-bold text-gray-400 pb-6">
          /
        </div>

        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              value={value.diastolic}
              onChange={(e) => handleChange("diastolic", e.target.value)}
              placeholder="80"
              className={cn(
                "w-full h-11 rounded-lg border-2 px-4 text-center text-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#0F4C75]/20",
                error?.diastolic
                  ? "border-red-300 bg-red-50/50"
                  : value.diastolic && isNormal
                  ? "border-green-300 bg-green-50/30"
                  : value.diastolic && isElevated
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-300 bg-white hover:border-gray-400 focus-visible:border-[#0F4C75]"
              )}
              maxLength={3}
            />
          </div>
          <p className="text-xs text-center text-gray-500">Diastólica</p>
          {error?.diastolic && (
            <p className="text-xs text-red-600 text-center">{error.diastolic}</p>
          )}
        </div>
      </div>

      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Faixa normal:</span> 90-120 / 60-80 mmHg
        </p>
      </div>
    </div>
  );
}

