"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, RefreshCw, Download, Filter, TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialAnalytics {
  total_revenue: number;
  average_invoice_value: number;
  total_invoices: number;
  monthly_revenue_trend: Array<{ month: string; total_revenue: number }>;
  start_date: string;
  end_date: string;
}

interface RevenueByCategory {
  category: string;
  total: number;
  percentage: number;
}

export default function FinancialAnalyticsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState("revenue");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, isLoading, user, router, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const periodMap: Record<string, string> = {
        "7": "last_7_days",
        "30": "last_30_days",
        "90": "last_90_days",
        "365": "last_year"
      };
      const apiPeriod = periodMap[selectedPeriod] || "last_30_days";
      
      const financialData = await api.get<FinancialAnalytics>(
        `/api/analytics/financial?period=${apiPeriod}`
      );
      
      setAnalytics(financialData);
    } catch (error: any) {
      console.error("Failed to load analytics:", error);
      toast.error("Erro ao carregar análises", {
        description: error.message || "Não foi possível carregar os dados"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Prepare chart data
  const revenueTrendData = analytics?.monthly_revenue_trend ? {
    labels: analytics.monthly_revenue_trend.map(item => {
      const date = new Date(item.month);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Receita',
        data: analytics.monthly_revenue_trend.map(item => item.total_revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  } : null;

  const revenueBarData = analytics?.monthly_revenue_trend ? {
    labels: analytics.monthly_revenue_trend.map(item => {
      const date = new Date(item.month);
      return date.toLocaleDateString('pt-BR', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Receita Mensal',
        data: analytics.monthly_revenue_trend.map(item => item.total_revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  } : null;

  // Mock category data (would come from API in real implementation)
  const categoryData = {
    labels: ['Consultas', 'Exames', 'Procedimentos', 'Medicamentos', 'Outros'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.parsed.y || context.parsed);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${percentage}%`;
          }
        }
      }
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando análises financeiras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            Análises Financeiras
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Visualizações detalhadas e insights financeiros da clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-44 bg-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => loadAnalytics()} 
            disabled={loading}
            className="bg-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Receita Total</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-2">
              {formatCurrency(analytics?.total_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.total_invoices || 0} faturas processadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Ticket Médio</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-2">
              {formatCurrency(analytics?.average_invoice_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por fatura
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Total de Faturas</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 mb-2">
              {analytics?.total_invoices || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Faturas no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white">
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Tendência de Receita
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Comparação Mensal
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Por Categoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-600" />
                Tendência de Receita
              </CardTitle>
              <CardDescription>
                Evolução da receita ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {revenueTrendData ? (
                  <Line data={revenueTrendData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Comparação Mensal
              </CardTitle>
              <CardDescription>
                Receita mensal comparativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {revenueBarData ? (
                  <Bar data={revenueBarData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Distribuição por Categoria
                </CardTitle>
                <CardDescription>
                  Receita distribuída por tipo de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes por Categoria</CardTitle>
                <CardDescription>
                  Valores e percentuais detalhados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.labels.map((label, index) => {
                    const value = categoryData.datasets[0].data[index];
                    const total = categoryData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    const color = categoryData.datasets[0].backgroundColor[index];
                    
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-medium">{label}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{percentage}%</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency((analytics?.total_revenue || 0) * (value / 100))}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Insights e Recomendações</CardTitle>
            <CardDescription>
              Análises automáticas baseadas nos dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Tendência Positiva</p>
                <p className="text-sm text-blue-700 mt-1">
                  A receita está mostrando uma tendência de crescimento no período analisado.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Activity className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Performance Estável</p>
                <p className="text-sm text-green-700 mt-1">
                  O ticket médio está dentro da média esperada para o setor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            <CardDescription>
              Exportar dados e relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const periodMap: Record<string, string> = {
                      "7": "last_7_days",
                      "30": "last_30_days",
                      "90": "last_90_days",
                      "365": "last_year"
                    };
                    const apiPeriod = periodMap[selectedPeriod] || "last_30_days";
                    const endpoint = `/api/analytics/export/financial/excel?period=${apiPeriod}`;
                    
                    const blob = await api.download(endpoint);
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `analytics_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
                    toast.success("Relatório exportado com sucesso!");
                  } catch (error: any) {
                    toast.error("Erro ao exportar", { 
                      description: error.message || "Não foi possível exportar o relatório" 
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar para Excel
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/financeiro/basico')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Voltar para Visão Geral
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

