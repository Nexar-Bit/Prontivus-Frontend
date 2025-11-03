"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  value: number;
  change: number;
  trend: 'up' | 'down';
  color: 'blue' | 'green' | 'orange' | 'teal' | 'purple';
  label: string;
  subtitle: string;
  format?: 'number' | 'currency' | 'percentage';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    accent: 'bg-green-500',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    accent: 'bg-orange-500',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    border: 'border-teal-200',
    accent: 'bg-teal-500',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    accent: 'bg-purple-500',
  },
};

export function MetricCard({
  icon: Icon,
  value,
  change,
  trend,
  color,
  label,
  subtitle,
  format = 'number',
}: MetricCardProps) {
  const colors = colorMap[color];
  const isPositive = trend === 'up';

  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all hover:shadow-md",
      colors.border
    )}>
      {/* Medical pattern background */}
      <div className={cn(
        "absolute inset-0 opacity-5 pointer-events-none",
        "bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)]",
        "bg-[length:20px_20px]"
      )} />
      
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", colors.accent)} />

      <div className={cn("relative p-6", colors.bg)}>
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-lg bg-white/80 shadow-sm", colors.icon)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
            isPositive 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {label}
          </div>
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        </div>

        {/* Trend indicator line */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {trend === 'up' ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Crescimento</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Redução</span>
              </>
            )}
            <span className="text-gray-400">vs. período anterior</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

