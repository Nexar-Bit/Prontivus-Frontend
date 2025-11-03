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

export function PatientVitalsChart() {
  const data = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Pressão Sistólica',
        data: [120, 118, 122, 119, 121, 120, 119],
        borderColor: 'rgb(239, 68, 68)', // Red for blood pressure
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Frequência Cardíaca',
        data: [72, 75, 70, 73, 71, 74, 72],
        borderColor: 'rgb(15, 76, 117)', // Blue for heart rate
        backgroundColor: 'rgba(15, 76, 117, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Temperatura',
        data: [36.5, 36.7, 36.4, 36.6, 36.5, 36.8, 36.6],
        borderColor: 'rgb(27, 154, 170)', // Teal for temperature
        backgroundColor: 'rgba(27, 154, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
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
      },
      annotation: {
        annotations: {
          normalRange: {
            type: 'box',
            yMin: 70,
            yMax: 90,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            borderWidth: 1,
            borderDash: [5, 5],
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 30,
        max: 140,
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

