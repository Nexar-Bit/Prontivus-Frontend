"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SymptomLocation {
  id: string;
  region: string;
  x: number;
  y: number;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  date: string;
  notes?: string;
}

interface BodyChartProps {
  symptoms?: SymptomLocation[];
  onSymptomClick?: (symptom: SymptomLocation) => void;
  interactive?: boolean;
  className?: string;
}

const bodyRegions = [
  { id: 'head', label: 'Cabeça', path: 'M 50 10 L 90 15 L 85 50 L 70 55 L 50 55 L 30 55 L 15 50 L 10 15 Z' },
  { id: 'neck', label: 'Pescoço', path: 'M 30 55 L 70 55 L 68 80 L 32 80 Z' },
  { id: 'chest', label: 'Tórax', path: 'M 32 80 L 68 80 L 66 150 L 50 155 L 34 150 Z' },
  { id: 'abdomen', label: 'Abdômen', path: 'M 34 155 L 66 155 L 64 200 L 36 200 Z' },
  { id: 'left-arm', label: 'Braço Esquerdo', path: 'M 10 80 L 32 85 L 20 160 L 5 155 Z' },
  { id: 'right-arm', label: 'Braço Direito', path: 'M 68 85 L 90 80 L 95 155 L 80 160 Z' },
  { id: 'left-hand', label: 'Mão Esquerda', path: 'M 5 155 L 20 160 L 18 175 L 3 170 Z' },
  { id: 'right-hand', label: 'Mão Direita', path: 'M 80 160 L 95 155 L 97 170 L 82 175 Z' },
  { id: 'left-leg', label: 'Perna Esquerda', path: 'M 36 200 L 48 200 L 48 320 L 38 325 L 30 320 Z' },
  { id: 'right-leg', label: 'Perna Direita', path: 'M 52 200 L 64 200 L 70 320 L 62 325 L 52 320 Z' },
  { id: 'left-foot', label: 'Pé Esquerdo', path: 'M 30 320 L 48 320 L 46 340 L 28 340 Z' },
  { id: 'right-foot', label: 'Pé Direito', path: 'M 52 320 L 70 320 L 72 340 L 54 340 Z' },
];

const severityColors = {
  mild: { fill: '#FEF3C7', stroke: '#F59E0B', label: 'Leve' },
  moderate: { fill: '#FEE2E2', stroke: '#EF4444', label: 'Moderado' },
  severe: { fill: '#DC2626', stroke: '#991B1B', label: 'Severo' },
};

export function BodyChart({ symptoms = [], onSymptomClick, interactive = false, className }: BodyChartProps) {
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomLocation | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Mock symptoms data if none provided
  const defaultSymptoms: SymptomLocation[] = [
    {
      id: '1',
      region: 'chest',
      x: 50,
      y: 120,
      symptom: 'Dor no peito',
      severity: 'moderate',
      date: '2024-01-15',
      notes: 'Dor intermitente, piora com movimento',
    },
    {
      id: '2',
      region: 'head',
      x: 50,
      y: 35,
      symptom: 'Dor de cabeça',
      severity: 'mild',
      date: '2024-01-14',
      notes: 'Cefaleia tensional',
    },
    {
      id: '3',
      region: 'right-arm',
      x: 75,
      y: 120,
      symptom: 'Formigamento',
      severity: 'mild',
      date: '2024-01-13',
    },
  ];

  const displaySymptoms = symptoms.length > 0 ? symptoms : defaultSymptoms;

  const handleSymptomClick = (symptom: SymptomLocation) => {
    setSelectedSymptom(symptom);
    onSymptomClick?.(symptom);
  };

  const getRegionSymptoms = (regionId: string) => {
    return displaySymptoms.filter(s => s.region === regionId);
  };

  return (
    <Card className={cn("medical-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0F4C75]">
          <AlertCircle className="h-5 w-5" />
          Mapa Corporal de Sintomas
        </CardTitle>
        <CardDescription>
          Visualize sintomas relatados por região do corpo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Body SVG */}
          <svg
            viewBox="0 0 100 350"
            className="w-full h-auto max-w-md mx-auto"
            style={{ height: '500px' }}
          >
            {/* Body regions */}
            {bodyRegions.map((region) => {
              const regionSymptoms = getRegionSymptoms(region.id);
              const isHovered = hoveredRegion === region.id;
              const hasSymptoms = regionSymptoms.length > 0;

              return (
                <g key={region.id}>
                  <path
                    d={region.path}
                    fill={
                      hasSymptoms
                        ? severityColors[regionSymptoms[0].severity].fill
                        : isHovered
                        ? '#F3F4F6'
                        : '#FFFFFF'
                    }
                    stroke={
                      hasSymptoms
                        ? severityColors[regionSymptoms[0].severity].stroke
                        : '#E5E7EB'
                    }
                    strokeWidth={hasSymptoms || isHovered ? 2 : 1}
                    className={cn(
                      interactive && "cursor-pointer",
                      (hasSymptoms || isHovered) && "transition-all duration-200"
                    )}
                    onMouseEnter={() => interactive && setHoveredRegion(region.id)}
                    onMouseLeave={() => interactive && setHoveredRegion(null)}
                    onClick={() => {
                      if (interactive && regionSymptoms.length > 0) {
                        handleSymptomClick(regionSymptoms[0]);
                      }
                    }}
                  />
                  {hasSymptoms && (
                    <text
                      x={region.id.includes('left') ? 25 : region.id.includes('right') ? 75 : 50}
                      y={region.id.includes('head') ? 30 : region.id.includes('neck') ? 70 : region.id.includes('chest') ? 120 : region.id.includes('abdomen') ? 180 : region.id.includes('leg') ? 260 : 340}
                      textAnchor="middle"
                      fontSize="8"
                      fill={severityColors[regionSymptoms[0].severity].stroke}
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {regionSymptoms.length > 1 ? `${regionSymptoms.length}` : '•'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Symptom markers */}
            {displaySymptoms.map((symptom) => {
              const color = severityColors[symptom.severity];
              return (
                <g key={symptom.id}>
                  <circle
                    cx={symptom.x}
                    cy={symptom.y}
                    r={symptom.severity === 'severe' ? 6 : symptom.severity === 'moderate' ? 5 : 4}
                    fill={color.stroke}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    className={cn(
                      interactive && "cursor-pointer",
                      "transition-all duration-200 hover:scale-125"
                    )}
                    onClick={() => interactive && handleSymptomClick(symptom)}
                    onMouseEnter={() => {
                      if (interactive) {
                        setHoveredRegion(symptom.region);
                      }
                    }}
                  />
                  {/* Pulse animation for severe symptoms */}
                  {symptom.severity === 'severe' && (
                    <circle
                      cx={symptom.x}
                      cy={symptom.y}
                      r={6}
                      fill={color.stroke}
                      opacity={0.3}
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}

            {/* Region labels (optional, can be shown on hover) */}
            {hoveredRegion && interactive && (
              <text
                x={50}
                y={20}
                textAnchor="middle"
                fontSize="10"
                fill="#0F4C75"
                fontWeight="semibold"
              >
                {bodyRegions.find(r => r.id === hoveredRegion)?.label}
              </text>
            )}
          </svg>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {Object.entries(severityColors).map(([severity, config]) => (
              <div key={severity} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: config.fill,
                    borderColor: config.stroke,
                  }}
                />
                <span className="text-xs text-gray-700">{config.label}</span>
              </div>
            ))}
          </div>

          {/* Symptoms list */}
          {displaySymptoms.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Sintomas Registrados
              </h4>
              {displaySymptoms.map((symptom) => {
                const color = severityColors[symptom.severity];
                return (
                  <div
                    key={symptom.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors",
                      selectedSymptom?.id === symptom.id
                        ? "bg-blue-50 border-blue-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )}
                    onClick={() => handleSymptomClick(symptom)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color.stroke }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {symptom.symptom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bodyRegions.find(r => r.id === symptom.region)?.label}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs",
                        symptom.severity === 'mild' && "bg-yellow-100 text-yellow-700",
                        symptom.severity === 'moderate' && "bg-red-100 text-red-700",
                        symptom.severity === 'severe' && "bg-red-200 text-red-800"
                      )}
                    >
                      {color.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Symptom details modal */}
          {selectedSymptom && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="medical-card max-w-md w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#0F4C75]">
                      Detalhes do Sintoma
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedSymptom(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Sintoma</div>
                    <div className="text-base font-semibold text-gray-900">
                      {selectedSymptom.symptom}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Região</div>
                      <div className="text-base text-gray-900">
                        {bodyRegions.find(r => r.id === selectedSymptom.region)?.label}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Gravidade</div>
                      <Badge
                        className={cn(
                          "mt-1",
                          selectedSymptom.severity === 'mild' && "bg-yellow-100 text-yellow-700",
                          selectedSymptom.severity === 'moderate' && "bg-red-100 text-red-700",
                          selectedSymptom.severity === 'severe' && "bg-red-200 text-red-800"
                        )}
                      >
                        {severityColors[selectedSymptom.severity].label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Data</div>
                    <div className="text-base text-gray-900">
                      {new Date(selectedSymptom.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {selectedSymptom.notes && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Observações
                      </div>
                      <div className="text-base text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                        {selectedSymptom.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

