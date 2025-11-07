"use client";

import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VitalSignsData {
  date: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  temperature: number | null;
  respiratory_rate: number | null;
}

export function PatientVitalsChart() {
  const [chartData, setChartData] = React.useState<{
    labels: string[];
    systolicBp: number[];
    heartRate: number[];
    temperature: number[];
    tempScale?: number;
    tempMin?: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const tempScaleRef = React.useRef<{ scale: number; min: number } | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<{
          daily_vitals: VitalSignsData[];
          period: string;
        }>("/api/analytics/vital-signs?period=last_7_days");
        
        const dailyVitals = response.daily_vitals || [];
        
        if (dailyVitals.length === 0) {
          // No data available
          setChartData({
            labels: [],
            systolicBp: [],
            heartRate: [],
            temperature: [],
          });
          return;
        }
        
        // Format labels (day names)
        const labels = dailyVitals.map(v => {
          try {
            return format(parseISO(v.date), 'EEE', { locale: ptBR });
          } catch {
            return v.date;
          }
        });
        
        // Extract data arrays
        const systolicBp = dailyVitals.map(v => v.systolic_bp ?? null).filter(v => v !== null) as number[];
        const heartRate = dailyVitals.map(v => v.heart_rate ?? null).filter(v => v !== null) as number[];
        const temperature = dailyVitals.map(v => v.temperature ?? null).filter(v => v !== null) as number[];
        
        // Calculate min/max for proper scaling
        const allSystolicBp = dailyVitals.map(v => v.systolic_bp).filter(v => v !== null) as number[];
        const allHeartRate = dailyVitals.map(v => v.heart_rate).filter(v => v !== null) as number[];
        const allTemperature = dailyVitals.map(v => v.temperature).filter(v => v !== null) as number[];
        
        // Scale temperature to be visible on the same chart (multiply by 10 to bring it to similar range)
        const tempMin = allTemperature.length > 0 ? Math.min(...allTemperature) : 36;
        const tempMax = allTemperature.length > 0 ? Math.max(...allTemperature) : 37;
        const tempScale = tempMax > tempMin ? (120 - 70) / (tempMax - tempMin) : 10; // Scale to fit in 70-120 range
        
        // Store scale for tooltip callback
        tempScaleRef.current = { scale: tempScale, min: tempMin };
        
        setChartData({
          labels,
          systolicBp: dailyVitals.map(v => v.systolic_bp ?? 0),
          heartRate: dailyVitals.map(v => v.heart_rate ?? 0),
          temperature: dailyVitals.map(v => v.temperature ? (v.temperature - tempMin) * tempScale + 70 : 0),
          tempScale: tempScale,
          tempMin: tempMin,
        });
      } catch (err) {
        console.error("Failed to fetch vital signs data:", err);
        // Fallback to empty data
        setChartData({
          labels: [],
          systolicBp: [],
          heartRate: [],
          temperature: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-sm text-muted-foreground">
        Nenhum dado de sinais vitais disponível
      </div>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Pressão Sistólica',
        data: chartData.systolicBp,
        borderColor: 'rgb(239, 68, 68)', // Red for blood pressure
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Frequência Cardíaca',
        data: chartData.heartRate,
        borderColor: 'rgb(15, 76, 117)', // Blue for heart rate
        backgroundColor: 'rgba(15, 76, 117, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(15, 76, 117)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Temperatura',
        data: chartData.temperature,
        borderColor: 'rgb(27, 154, 170)', // Teal for temperature
        backgroundColor: 'rgba(27, 154, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(27, 154, 170)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            family: 'Inter',
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 76, 117, 0.95)',
        padding: 12,
        titleFont: {
          family: 'Inter',
          size: 14,
          weight: '600',
        },
        bodyFont: {
          family: 'Inter',
          size: 12,
        },
        borderColor: 'rgba(15, 76, 117, 0.2)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y: number } }) {
            const label = context.dataset.label || '';
            let value = context.parsed.y;
            if (label.includes('Temperatura') && tempScaleRef.current) {
              // Unscale temperature
              const { scale, min } = tempScaleRef.current;
              value = (value - 70) / scale + min;
              return `${label}: ${value.toFixed(1)}°C`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          callback: function(value: any) {
            return value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Line data={data} options={options as any} />
    </div>
  );
}

