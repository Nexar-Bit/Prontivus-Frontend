"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { appointmentsApi } from "@/lib/appointments-api";
import { Loader2 } from "lucide-react";

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const hours = ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];

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
  const [heatmapData, setHeatmapData] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get appointments for the last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        
        const appointments = await appointmentsApi.getAll({
          start_date: startDate,
          end_date: endDate,
        });
        
        // Initialize heatmap data
        const data: Record<string, number> = {};
        days.forEach(day => {
          hours.forEach(hour => {
            data[`${day}-${hour}`] = 0;
          });
        });
        
        // Count appointments by day and hour
        appointments.forEach((apt: any) => {
          if (apt.scheduled_datetime) {
            const aptDate = new Date(apt.scheduled_datetime);
            const dayOfWeek = aptDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const hour = aptDate.getHours();
            
            // Map day of week to our days array (Monday = 1, Tuesday = 2, etc.)
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6, then shift
            if (dayIndex >= 0 && dayIndex < 5) { // Only weekdays (Mon-Fri)
              const dayName = days[dayIndex];
              const hourStr = `${hour.toString().padStart(2, '0')}h`;
              
              if (hours.includes(hourStr)) {
                const key = `${dayName}-${hourStr}`;
                data[key] = (data[key] || 0) + 1;
              }
            }
          }
        });
        
        setHeatmapData(data);
      } catch (err) {
        console.error("Failed to fetch heatmap data:", err);
        // Fallback to empty data
        const emptyData: Record<string, number> = {};
        days.forEach(day => {
          hours.forEach(hour => {
            emptyData[`${day}-${hour}`] = 0;
          });
        });
        setHeatmapData(emptyData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxValue = Math.max(...Object.values(heatmapData), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-600">
        <span className="text-xs sm:text-sm">Horários mais utilizados</span>
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

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full px-4 sm:px-0">
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
                            "w-8 h-7 sm:w-10 sm:h-8 rounded flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all hover:scale-110 cursor-pointer",
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

