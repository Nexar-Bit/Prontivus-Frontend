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

export function AppointmentChart() {
  const data = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        label: 'Agendados',
        data: [120, 145, 138, 162],
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
        data: [110, 132, 125, 148],
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

