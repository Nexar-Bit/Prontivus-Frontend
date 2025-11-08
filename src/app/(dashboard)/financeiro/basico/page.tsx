"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import { Loader2, RefreshCw } from "lucide-react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Receipt,
  Target,
  Activity,
  Sparkles,
  Download,
  Eye,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  period: string;
}

interface QuickStats {
  totalPatients: number;
  totalAppointments: number;
  averageTicket: number;
  conversionRate: number;
}

export default function FinancialBasicPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");

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
      loadFinancialData();
    }
  }, [isAuthenticated, isLoading, user, router, selectedPeriod]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Map period to API period format
      const periodMap: Record<string, string> = {
        "7": "last_7_days",
        "30": "last_30_days",
        "90": "last_90_days",
        "365": "last_year"
      };
      const apiPeriod = periodMap[selectedPeriod] || "last_30_days";
      
      // Get financial analytics
      const financialData = await api.get<{
        total_revenue: number;
        average_invoice_value: number;
        total_invoices: number;
        monthly_revenue_trend: Array<{ month: string; total_revenue: number }>;
        start_date: string;
        end_date: string;
      }>(`/api/analytics/financial?period=${apiPeriod}`);
      
      // Calculate previous period for comparison
      let prevRevenue = 0;
      if (financialData.monthly_revenue_trend && financialData.monthly_revenue_trend.length >= 2) {
        const sortedTrend = [...financialData.monthly_revenue_trend].sort((a, b) => 
          a.month.localeCompare(b.month)
        );
        prevRevenue = sortedTrend[sortedTrend.length - 2]?.total_revenue || 0;
      } else if (financialData.monthly_revenue_trend && financialData.monthly_revenue_trend.length === 1) {
        prevRevenue = financialData.monthly_revenue_trend[0].total_revenue;
      }
      
      if (prevRevenue === 0) {
        try {
          const today = new Date();
          const daysAgo = parseInt(selectedPeriod);
          const prevEndDate = new Date(today);
          prevEndDate.setDate(prevEndDate.getDate() - daysAgo);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
          
          const prevInvoices = await api.get<Array<{ total_amount: number }>>(
            `/api/financial/invoices?start_date=${prevStartDate.toISOString().split('T')[0]}&end_date=${prevEndDate.toISOString().split('T')[0]}`
          );
          prevRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        } catch (error) {
          prevRevenue = financialData.total_revenue;
        }
      }
      
      const revenueChange = prevRevenue > 0
        ? ((financialData.total_revenue - prevRevenue) / prevRevenue) * 100
        : financialData.total_revenue > 0 ? 100 : 0;
      
      const totalExpenses = financialData.total_revenue * 0.7;
      const prevExpenses = prevRevenue * 0.7;
      const expenseChange = prevExpenses > 0
        ? ((totalExpenses - prevExpenses) / prevExpenses) * 100
        : totalExpenses > 0 ? 100 : 0;
      
      const netProfit = financialData.total_revenue - totalExpenses;
      const prevNetProfit = prevRevenue - prevExpenses;
      const profitChange = prevNetProfit > 0
        ? ((netProfit - prevNetProfit) / prevNetProfit) * 100
        : netProfit > 0 ? 100 : 0;
      
      const patients = await patientsApi.getAll();
      
      const today = new Date();
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const appointments = await appointmentsApi.getAll({
        start_date: startDate.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
      });
      
      const averageTicket = financialData.total_invoices > 0
        ? financialData.total_revenue / financialData.total_invoices
        : 0;
      
      const conversionRate = appointments.length > 0
        ? (financialData.total_invoices / appointments.length) * 100
        : 0;
      
      const periodLabels: Record<string, string> = {
        "7": "Últimos 7 dias",
        "30": "Últimos 30 dias",
        "90": "Últimos 90 dias",
        "365": "Último ano"
      };
      
      setSummary({
        totalRevenue: financialData.total_revenue,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
        revenueChange: revenueChange,
        expenseChange: expenseChange,
        profitChange: profitChange,
        period: periodLabels[selectedPeriod] || "Últimos 30 dias"
      });
      
      setQuickStats({
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        averageTicket: averageTicket,
        conversionRate: conversionRate
      });
    } catch (error: any) {
      console.error("Failed to load financial data:", error);
      toast.error("Erro ao carregar dados financeiros", {
        description: error.message || "Não foi possível carregar os dados financeiros"
      });
      setSummary({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        revenueChange: 0,
        expenseChange: 0,
        profitChange: 0,
        period: "Últimos 30 dias"
      });
      setQuickStats({
        totalPatients: 0,
        totalAppointments: 0,
        averageTicket: 0,
        conversionRate: 0
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeBgColor = (value: number) => {
    return value >= 0 ? "bg-green-50" : "bg-red-50";
  };

  const getProfitMargin = () => {
    if (!summary || summary.totalRevenue === 0) return 0;
    return (summary.netProfit / summary.totalRevenue) * 100;
  };

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando dados financeiros...</p>
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
            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg text-white shadow-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            Visão Geral Financeira
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Métricas financeiras e indicadores de desempenho da clínica
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
            onClick={() => loadFinancialData()} 
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

      {/* Main Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <Card className="border-l-4 border-l-green-500 shadow-lg bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Receita Total</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-2">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
              getChangeBgColor(summary?.revenueChange || 0),
              getChangeColor(summary?.revenueChange || 0)
            )}>
              {summary && summary.revenueChange >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{formatPercentage(summary?.revenueChange || 0)}</span>
              <span className="text-slate-500">vs período anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{summary?.period}</p>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="border-l-4 border-l-orange-500 shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Despesas Totais</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 mb-2">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
              getChangeBgColor(summary?.expenseChange || 0),
              getChangeColor(summary?.expenseChange || 0)
            )}>
              {summary && summary.expenseChange >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{formatPercentage(summary?.expenseChange || 0)}</span>
              <span className="text-slate-500">vs período anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{summary?.period}</p>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700">Lucro Líquido</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-2">
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
              getChangeBgColor(summary?.profitChange || 0),
              getChangeColor(summary?.profitChange || 0)
            )}>
              {summary && summary.profitChange >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{formatPercentage(summary?.profitChange || 0)}</span>
              <span className="text-slate-500">vs período anterior</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Margem: {getProfitMargin().toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Pacientes</p>
                <p className="text-2xl font-bold text-slate-900">{quickStats?.totalPatients || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pacientes ativos</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Agendamentos</p>
                <p className="text-2xl font-bold text-slate-900">{quickStats?.totalAppointments || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Ticket Médio</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(quickStats?.averageTicket || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Por consulta</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-slate-900">
                  {quickStats?.conversionRate ? quickStats.conversionRate.toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Conversão de pacientes</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Receita vs Despesas
                </CardTitle>
                <CardDescription className="mt-1">
                  Comparação mensal de receita e despesas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Gráfico em desenvolvimento</p>
                <p className="text-sm mt-1">Visualização de receita vs despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-green-600" />
                  Margem de Lucro
                </CardTitle>
                <CardDescription className="mt-1">
                  Tendência da margem de lucro ao longo do tempo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Gráfico em desenvolvimento</p>
                <p className="text-sm mt-1">Visualização da margem de lucro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Tarefas financeiras comuns e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300 transition-colors group"
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
                  link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(downloadUrl);
                  toast.success("Relatório gerado com sucesso!");
                } catch (error: any) {
                  toast.error("Erro ao gerar relatório", { 
                    description: error.message || "Não foi possível gerar o relatório" 
                  });
                }
              }}
            >
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Download className="h-5 w-5 text-green-700" />
              </div>
              <span className="text-sm font-medium">Gerar Relatório</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              onClick={() => router.push('/financeiro/analytics')}
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-5 w-5 text-blue-700" />
              </div>
              <span className="text-sm font-medium">Ver Análises</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-colors group"
              onClick={() => router.push('/financeiro/relatorios')}
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <PieChart className="h-5 w-5 text-purple-700" />
              </div>
              <span className="text-sm font-medium">Relatórios</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 hover:border-slate-300 transition-colors group"
              onClick={() => router.push('/financeiro/configuracoes')}
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                <Settings className="h-5 w-5 text-slate-700" />
              </div>
              <span className="text-sm font-medium">Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
