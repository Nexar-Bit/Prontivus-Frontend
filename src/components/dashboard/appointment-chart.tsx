"use client";

import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { appointmentsApi } from "@/lib/appointments-api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AppointmentChartData {
  appointments_by_status: Array<{ status: string; count: number }>;
}

export function AppointmentChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = React.useState<{ labels: string[]; scheduled: number[]; completed: number[] } | null>(null);
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
        
        let appointments: any[] = [];
        
        // Check user role to use appropriate endpoint
        const isPatient = user?.role === 'patient' || user?.role_name?.toLowerCase() === 'patient';
        const isStaff = user?.role === 'admin' || user?.role === 'secretary' || user?.role === 'doctor' ||
                       user?.role_name?.toLowerCase() === 'admin' || 
                       user?.role_name?.toLowerCase() === 'secretary' || 
                       user?.role_name?.toLowerCase() === 'doctor';
        
        if (isPatient) {
          // Use patient-specific endpoint
          try {
            appointments = await api.get<any[]>(`/api/v1/appointments/patient-appointments`);
          } catch (err: any) {
            // Silently handle permission errors for patients
            if (err?.status === 403 || err?.response?.status === 403) {
              console.warn("Patient appointments endpoint not accessible");
              appointments = [];
            } else {
              throw err;
            }
          }
        } else if (isStaff) {
          // Use staff endpoint
          appointments = await appointmentsApi.getAll({
            start_date: startDate,
            end_date: endDate,
          });
        } else {
          // Unknown role, skip fetching
          appointments = [];
        }
        
        // Group by weeks for the last 4 weeks
        const weeks = [];
        const scheduled = [];
        const completed = [];
        
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7 + 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - (i * 7));
          weekEnd.setHours(23, 59, 59, 999);
          
          weeks.push(`Sem ${4 - i}`);
          
          // Count appointments in this week
          const weekScheduled = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.scheduled_datetime || apt.created_at);
            return aptDate >= weekStart && aptDate <= weekEnd;
          }).length;
          
          const weekCompleted = appointments.filter((apt: any) => {
            const aptDate = new Date(apt.scheduled_datetime || apt.created_at);
            return aptDate >= weekStart && aptDate <= weekEnd && apt.status === 'completed';
          }).length;
          
          scheduled.push(weekScheduled);
          completed.push(weekCompleted);
        }
        
        setChartData({ labels: weeks, scheduled, completed });
      } catch (err) {
        console.error("Failed to fetch appointment data:", err);
        // Fallback to empty data
        setChartData({ labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], scheduled: [0, 0, 0, 0], completed: [0, 0, 0, 0] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const data = {
    labels: chartData?.labels || ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        label: 'Agendados',
        data: chartData?.scheduled || [0, 0, 0, 0],
        borderColor: 'rgb(15, 76, 117)', // #0F4C75
        backgroundColor: 'rgba(15, 76, 117, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(15, 76, 117)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Realizados',
        data: chartData?.completed || [0, 0, 0, 0],
        borderColor: 'rgb(27, 154, 170)', // #1B9AAA
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
            return `${context.dataset.label}: ${context.parsed.y} consultas`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
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

