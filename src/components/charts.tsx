"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
);

type AnyRecord = Record<string, any>;

interface ChartProps {
  data: AnyRecord;
  options?: AnyRecord;
  height?: number;
}

export function BarChart({ data, options, height = 280 }: ChartProps) {
  return <Bar data={data as any} options={options} height={height} />;
}

export function LineChart({ data, options, height = 280 }: ChartProps) {
  return <Line data={data as any} options={options} height={height} />;
}

export function PieChart({ data, options, height = 280 }: ChartProps) {
  return <Pie data={data as any} options={options} height={height} />;
}


