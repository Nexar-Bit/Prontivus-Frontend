"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const hours = ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

// Mock heatmap data - replace with API
const heatmapData: Record<string, number> = {
  'Seg-08h': 2, 'Seg-09h': 4, 'Seg-10h': 5, 'Seg-11h': 3, 'Seg-12h': 1,
  'Seg-13h': 2, 'Seg-14h': 5, 'Seg-15h': 6, 'Seg-16h': 4, 'Seg-17h': 3, 'Seg-18h': 2,
  'Ter-08h': 3, 'Ter-09h': 5, 'Ter-10h': 6, 'Ter-11h': 4, 'Ter-12h': 2,
  'Ter-13h': 3, 'Ter-14h': 6, 'Ter-15h': 7, 'Ter-16h': 5, 'Ter-17h': 4, 'Ter-18h': 2,
  'Qua-08h': 2, 'Qua-09h': 4, 'Qua-10h': 5, 'Qua-11h': 3, 'Qua-12h': 1,
  'Qua-13h': 2, 'Qua-14h': 5, 'Qua-15h': 6, 'Qua-16h': 4, 'Qua-17h': 3, 'Qua-18h': 1,
  'Qui-08h': 3, 'Qui-09h': 6, 'Qui-10h': 7, 'Qui-11h': 5, 'Qui-12h': 3,
  'Qui-13h': 4, 'Qui-14h': 7, 'Qui-15h': 8, 'Qui-16h': 6, 'Qui-17h': 5, 'Qui-18h': 3,
  'Sex-08h': 2, 'Sex-09h': 4, 'Sex-10h': 5, 'Sex-11h': 3, 'Sex-12h': 1,
  'Sex-13h': 2, 'Sex-14h': 4, 'Sex-15h': 5, 'Sex-16h': 3, 'Sex-17h': 2, 'Sex-18h': 1,
};

const getIntensity = (value: number) => {
  if (value === 0) return 'bg-gray-100';
  if (value <= 2) return 'bg-blue-200';
  if (value <= 4) return 'bg-blue-400';
  if (value <= 6) return 'bg-blue-600';
  return 'bg-[#0F4C75]';
};

const getIntensityText = (value: number) => {
  if (value === 0) return 'text-gray-400';
  if (value <= 2) return 'text-blue-700';
  if (value <= 4) return 'text-blue-800';
  return 'text-white';
};

export function AppointmentHeatmap() {
  const maxValue = Math.max(...Object.values(heatmapData));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Horários mais utilizados</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded" />
            <div className="w-3 h-3 bg-blue-200 rounded" />
            <div className="w-3 h-3 bg-blue-400 rounded" />
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <div className="w-3 h-3 bg-[#0F4C75] rounded" />
          </div>
          <span className="text-xs">Mais</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 text-left text-xs font-medium text-gray-500 pb-2"></th>
                {hours.map((hour) => (
                  <th
                    key={hour}
                    className="w-12 text-center text-xs font-medium text-gray-500 pb-2"
                  >
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td className="text-xs font-medium text-gray-600 pr-3 py-1">
                    {day}
                  </td>
                  {hours.map((hour) => {
                    const key = `${day}-${hour}`;
                    const value = heatmapData[key] || 0;
                    return (
                      <td key={hour} className="py-1 px-0.5">
                        <div
                          className={cn(
                            "w-10 h-8 rounded flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 cursor-pointer",
                            getIntensity(value),
                            getIntensityText(value)
                          )}
                          title={`${day} ${hour}: ${value} agendamentos`}
                        >
                          {value > 0 && value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

