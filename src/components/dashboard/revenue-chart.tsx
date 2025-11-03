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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function RevenueChart() {
  const data = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Convênio',
        data: [45000, 52000, 48000, 61000, 55000, 67000],
        backgroundColor: 'rgba(15, 76, 117, 0.8)', // #0F4C75
        borderColor: 'rgb(15, 76, 117)',
        borderWidth: 1,
      },
      {
        label: 'Particular',
        data: [32000, 38000, 35000, 42000, 40000, 48000],
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

