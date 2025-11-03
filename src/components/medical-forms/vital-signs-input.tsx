"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BloodPressureInput } from "./blood-pressure-input";
import { TemperatureInput } from "./temperature-input";
import { MedicalInput } from "./medical-input";
import { Heart, Activity, Droplet } from "lucide-react";

interface VitalSignsInputProps {
  values?: {
    bloodPressure?: { systolic: string; diastolic: string };
    temperature?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
  };
  onChange?: (field: string, value: any) => void;
  errors?: Record<string, string>;
  className?: string;
}

export function VitalSignsInput({
  values = {},
  onChange,
  errors = {},
  className,
}: VitalSignsInputProps) {
  return (
    <Card className="medical-card border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0F4C75]" />
          Sinais Vitais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BloodPressureInput
            value={values.bloodPressure || { systolic: "", diastolic: "" }}
            onChange={(value) => onChange?.("bloodPressure", value)}
            error={typeof errors.bloodPressure === 'object' ? errors.bloodPressure : undefined}
          />

          <TemperatureInput
            value={values.temperature || ""}
            onChange={(value) => onChange?.("temperature", value)}
            error={errors.temperature}
          />

          <MedicalInput
            label="Frequência Cardíaca"
            type="number"
            value={values.heartRate || ""}
            onChange={(e) => onChange?.("heartRate", e.target.value)}
            error={errors.heartRate}
            medicalContext={{
              normalRange: "60-100 bpm",
              unit: "bpm",
            }}
            placeholder="70"
          />

          <MedicalInput
            label="Frequência Respiratória"
            type="number"
            value={values.respiratoryRate || ""}
            onChange={(e) => onChange?.("respiratoryRate", e.target.value)}
            error={errors.respiratoryRate}
            medicalContext={{
              normalRange: "12-20 rpm",
              unit: "rpm",
            }}
            placeholder="16"
          />

          <MedicalInput
            label="Saturação de Oxigênio"
            type="number"
            value={values.oxygenSaturation || ""}
            onChange={(e) => onChange?.("oxygenSaturation", e.target.value)}
            error={errors.oxygenSaturation}
            medicalContext={{
              normalRange: "95-100%",
              unit: "%",
              critical: values.oxygenSaturation ? parseFloat(values.oxygenSaturation) < 95 : false,
            }}
            placeholder="98"
          />

          <div className="grid grid-cols-2 gap-3">
            <MedicalInput
              label="Peso"
              type="number"
              value={values.weight || ""}
              onChange={(e) => onChange?.("weight", e.target.value)}
              error={errors.weight}
              medicalContext={{
                unit: "kg",
              }}
              placeholder="70"
            />

            <MedicalInput
              label="Altura"
              type="number"
              value={values.height || ""}
              onChange={(e) => onChange?.("height", e.target.value)}
              error={errors.height}
              medicalContext={{
                unit: "cm",
              }}
              placeholder="170"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

