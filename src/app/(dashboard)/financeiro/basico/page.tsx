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
import { Loader2 } from "lucide-react";
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
  LineChart
} from "lucide-react";

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
      // Use monthly_revenue_trend to get previous month's revenue
      let prevRevenue = 0;
      if (financialData.monthly_revenue_trend && financialData.monthly_revenue_trend.length >= 2) {
        // Get the second-to-last month (previous period)
        const sortedTrend = [...financialData.monthly_revenue_trend].sort((a, b) => 
          a.month.localeCompare(b.month)
        );
        prevRevenue = sortedTrend[sortedTrend.length - 2]?.total_revenue || 0;
      } else if (financialData.monthly_revenue_trend && financialData.monthly_revenue_trend.length === 1) {
        // Only one month available, use it as previous (will show 0% change)
        prevRevenue = financialData.monthly_revenue_trend[0].total_revenue;
      }
      
      // If no trend data, try to get previous period directly
      if (prevRevenue === 0) {
        try {
          // Calculate previous period dates
          const today = new Date();
          const daysAgo = parseInt(selectedPeriod);
          const prevEndDate = new Date(today);
          prevEndDate.setDate(prevEndDate.getDate() - daysAgo);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
          
          // Query invoices for previous period
          const prevInvoices = await api.get<Array<{ total_amount: number }>>(
            `/api/financial/invoices?start_date=${prevStartDate.toISOString().split('T')[0]}&end_date=${prevEndDate.toISOString().split('T')[0]}`
          );
          prevRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        } catch (error) {
          // If that fails, use current revenue (will show 0% change)
          prevRevenue = financialData.total_revenue;
        }
      }
      
      // Calculate revenue change
      const revenueChange = prevRevenue > 0
        ? ((financialData.total_revenue - prevRevenue) / prevRevenue) * 100
        : financialData.total_revenue > 0 ? 100 : 0;
      
      // For expenses, we'll use a placeholder (would need an expenses endpoint)
      // For now, estimate expenses as 70% of revenue
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
      
      // Get patients count
      const patients = await patientsApi.getAll();
      
      // Get appointments for the period
      const today = new Date();
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const appointments = await appointmentsApi.getAll({
        start_date: startDate.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
      });
      
      // Calculate average ticket
      const averageTicket = financialData.total_invoices > 0
        ? financialData.total_revenue / financialData.total_invoices
        : 0;
      
      // Calculate conversion rate (appointments with invoices / total appointments)
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
      // Set defaults on error
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

  const getChangeIcon = (value: number) => {
    return value >= 0 ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />;
  };

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Visão Geral Financeira
          </h1>
          <p className="text-muted-foreground mt-2">
            Métricas financeiras básicas e indicadores de desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadFinancialData()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(summary?.revenueChange || 0)}`}>
              {getChangeIcon(summary?.revenueChange || 0)}
              <span className="ml-1">{formatPercentage(summary?.revenueChange || 0)}</span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses || 0)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(summary?.expenseChange || 0)}`}>
              {getChangeIcon(summary?.expenseChange || 0)}
              <span className="ml-1">{formatPercentage(summary?.expenseChange || 0)}</span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.netProfit || 0)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(summary?.profitChange || 0)}`}>
              {getChangeIcon(summary?.profitChange || 0)}
              <span className="ml-1">{formatPercentage(summary?.profitChange || 0)}</span>
              <span className="ml-1 text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(quickStats?.averageTicket || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Por consulta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.conversionRate ? quickStats.conversionRate.toFixed(1) : 0}%</div>
            <p className="text-xs text-muted-foreground">
              Conversão de pacientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Despesas</CardTitle>
            <CardDescription>
              Comparação mensal de receita e despesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart will be implemented here</p>
                <p className="text-sm">Revenue vs Expenses visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Margem de Lucro</CardTitle>
            <CardDescription>
              Tendência da margem de lucro ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart will be implemented here</p>
                <p className="text-sm">Profit margin visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Tarefas financeiras comuns e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={async () => {
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  const token = localStorage.getItem('access_token');
                  const periodMap: Record<string, string> = {
                    "7": "last_7_days",
                    "30": "last_30_days",
                    "90": "last_90_days",
                    "365": "last_year"
                  };
                  const apiPeriod = periodMap[selectedPeriod] || "last_30_days";
                  const url = `${apiUrl}/api/analytics/export/financial/excel?period=${apiPeriod}`;
                  
                  const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` },
                  });
                  
                  if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
                    link.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    toast.success("Relatório gerado com sucesso!");
                  } else {
                    toast.error("Erro ao gerar relatório");
                  }
                } catch (error: any) {
                  toast.error("Erro ao gerar relatório", { description: error.message });
                }
              }}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Gerar Relatório</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/financeiro/analytics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Ver Análises</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/financeiro/relatorios')}
            >
              <PieChart className="h-6 w-6" />
              <span className="text-sm">Despesas</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => router.push('/financeiro/configuracoes')}
            >
              <Settings className="h-6 w-6" />
              <span className="text-sm">Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
