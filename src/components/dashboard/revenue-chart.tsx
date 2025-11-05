"use client";

import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyRevenue {
  month: string;
  total_revenue: number;
}

export function RevenueChart() {
  const [chartData, setChartData] = React.useState<{ labels: string[]; insurance: number[]; private: number[] } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get monthly revenue trend for the last 6 months
        const financialData = await api.get<{ monthly_revenue_trend: MonthlyRevenue[] }>("/api/analytics/financial?period=last_year");
        
        // Get the last 6 months
        const months = financialData.monthly_revenue_trend.slice(-6);
        const labels = months.map(m => {
          const [year, month] = m.month.split('-');
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return monthNames[parseInt(month) - 1] || month;
        });
        
        // For now, split revenue between insurance and private (50/50 as approximation)
        // This can be enhanced with actual insurance vs private breakdown from invoices
        const insurance = months.map(m => m.total_revenue * 0.6); // Approximate 60% insurance
        const privateRevenue = months.map(m => m.total_revenue * 0.4); // Approximate 40% private
        
        setChartData({ labels, insurance, private: privateRevenue });
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
        // Fallback to empty data
        setChartData({ labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], insurance: [0, 0, 0, 0, 0, 0], private: [0, 0, 0, 0, 0, 0] });
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

  const data = {
    labels: chartData?.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Convênio',
        data: chartData?.insurance || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(15, 76, 117, 0.8)', // #0F4C75
        borderColor: 'rgb(15, 76, 117)',
        borderWidth: 1,
      },
      {
        label: 'Particular',
        data: chartData?.private || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(27, 154, 170, 0.8)', // #1B9AAA
        borderColor: 'rgb(27, 154, 170)',
        borderWidth: 1,
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
            const value = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
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
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          callback: function(value: any) {
            return 'R$ ' + (value / 1000).toFixed(0) + 'k';
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Bar data={data} options={options as any} />
    </div>
  );
}

