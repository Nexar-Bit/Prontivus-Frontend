"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CircleDollarSign, TrendingUp, TrendingDown, Wallet, ReceiptText, RefreshCw,
  Calendar, Download, Filter, ArrowUpRight, ArrowDownRight, DollarSign,
  Clock, CheckCircle2, XCircle, AlertCircle, BarChart3, LineChart,
  Activity, CreditCard, Banknote, FileText, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialStats {
  monthly_revenue: number;
  monthly_expenses: number;
  current_balance: number;
  pending_amount: number;
  monthly_revenue_change: number;
  monthly_expenses_change: number;
  balance_change: number;
  pending_change: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface FinancialDashboardData {
  stats: FinancialStats;
  monthly_data: MonthlyData[];
}

interface DailyCashFlowData {
  day: string;
  date: string;
  entrada: number;
  saida: number;
}

interface CashFlowData {
  total_entrada: number;
  total_saida: number;
  saldo: number;
  daily_data: DailyCashFlowData[];
}

export default function FinanceiroDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [cashFlowDays, setCashFlowDays] = useState<number>(7);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCashFlow();
  }, [cashFlowDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashboardData = await api.get<FinancialDashboardData>("/api/v1/doctor/financial/dashboard");
      setData(dashboardData);
    } catch (error: any) {
      console.error("Failed to load financial data:", error);
      toast.error("Erro ao carregar dados financeiros", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados financeiros",
      });
      setData({
        stats: {
          monthly_revenue: 0,
          monthly_expenses: 0,
          current_balance: 0,
          pending_amount: 0,
          monthly_revenue_change: 0,
          monthly_expenses_change: 0,
          balance_change: 0,
          pending_change: 0,
        },
        monthly_data: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCashFlow = async () => {
    try {
      const cashFlow = await api.get<CashFlowData>(`/api/v1/doctor/financial/cash-flow?days=${cashFlowDays}`);
      setCashFlowData(cashFlow);
    } catch (error: any) {
      console.error("Failed to load cash flow:", error);
      // Don't show error toast for cash flow, just set empty data
      setCashFlowData({
        total_entrada: 0,
        total_saida: 0,
        saldo: 0,
        daily_data: [],
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  const exportData = () => {
    if (!data) return;
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("Mês,Receita,Despesas,Saldo");
    
    data.monthly_data.forEach(month => {
      csvRows.push(`${month.month},${month.revenue},${month.expenses},${month.revenue - month.expenses}`);
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">
          <CircleDollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Não foi possível carregar os dados financeiros</p>
          <Button onClick={loadData} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Receita do Mês",
      value: formatCurrency(data.stats.monthly_revenue),
      change: formatPercentage(data.stats.monthly_revenue_change),
      changeValue: data.stats.monthly_revenue_change,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(data.stats.monthly_expenses),
      change: formatPercentage(data.stats.monthly_expenses_change),
      changeValue: data.stats.monthly_expenses_change,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200",
    },
    {
      title: "Saldo Atual",
      value: formatCurrency(data.stats.current_balance),
      change: formatPercentage(data.stats.balance_change),
      changeValue: data.stats.balance_change,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
    },
    {
      title: "Pendências",
      value: formatCurrency(data.stats.pending_amount),
      change: formatPercentage(data.stats.pending_change),
      changeValue: data.stats.pending_change,
      icon: ReceiptText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200",
    },
  ];

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(
    ...data.monthly_data.map(d => Math.max(d.revenue, d.expenses)),
    1
  );

  // Calculate max cash flow value
  const maxCashFlowValue = cashFlowData
    ? Math.max(
        ...cashFlowData.daily_data.map(d => Math.max(d.entrada, d.saida)),
        1
      )
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CircleDollarSign className="h-8 w-8 text-green-600" />
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral das suas finanças pessoais e desempenho financeiro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={!data || data.monthly_data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border-2 ${stat.borderColor} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className={`text-sm flex items-center gap-1 ${getChangeColor(stat.changeValue)}`}>
                  {getChangeIcon(stat.changeValue)}
                  <span>
                    {stat.change} em relação ao mês anterior
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>
                  Receitas e despesas dos últimos 6 meses
                </CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {data.monthly_data.length > 0 ? (
              <div className="space-y-4">
                {data.monthly_data.map((monthData, index) => {
                  const receitaPercent = (monthData.revenue / maxChartValue) * 100;
                  const despesaPercent = (monthData.expenses / maxChartValue) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">{monthData.month}</span>
                        <div className="flex gap-4">
                          <span className="text-green-600 font-medium">
                            {formatCurrency(monthData.revenue)}
                          </span>
                          <span className="text-red-600 font-medium">
                            {formatCurrency(monthData.expenses)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-8 rounded overflow-hidden">
                        <div 
                          className="bg-green-500 flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${receitaPercent}%` }}
                          title={`Receita: ${formatCurrency(monthData.revenue)}`}
                        >
                          {receitaPercent > 10 && (
                            <span className="text-white text-xs font-semibold">
                              {formatCurrency(monthData.revenue)}
                            </span>
                          )}
                        </div>
                        <div 
                          className="bg-red-500 flex items-center justify-start pl-2 transition-all"
                          style={{ width: `${despesaPercent}%` }}
                          title={`Despesa: ${formatCurrency(monthData.expenses)}`}
                        >
                          {despesaPercent > 10 && (
                            <span className="text-white text-xs font-semibold">
                              {formatCurrency(monthData.expenses)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum dado disponível para exibição</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>
                  Entradas e saídas dos últimos dias
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={cashFlowDays.toString()} onValueChange={(v) => setCashFlowDays(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cashFlowData && cashFlowData.daily_data.length > 0 ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Total Entrada</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(cashFlowData.total_entrada)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Total Saída</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(cashFlowData.total_saida)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Saldo</div>
                    <div className={`text-lg font-bold ${
                      cashFlowData.saldo >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(cashFlowData.saldo)}
                    </div>
                  </div>
                </div>

                {/* Daily Chart */}
                <div className="space-y-3">
                  {cashFlowData.daily_data.map((dayData, index) => {
                    const entradaPercent = (dayData.entrada / maxCashFlowValue) * 100;
                    const saidaPercent = (dayData.saida / maxCashFlowValue) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">
                              {format(parseISO(dayData.date), "dd/MM", { locale: ptBR })}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({dayData.day})
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-green-600 font-medium">
                              {formatCurrency(dayData.entrada)}
                            </span>
                            <span className="text-red-600 font-medium">
                              {formatCurrency(dayData.saida)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-6 rounded overflow-hidden">
                          <div 
                            className="bg-green-400 transition-all"
                            style={{ width: `${entradaPercent}%` }}
                            title={`Entrada: ${formatCurrency(dayData.entrada)}`}
                          />
                          <div 
                            className="bg-red-400 transition-all"
                            style={{ width: `${saidaPercent}%` }}
                            title={`Saída: ${formatCurrency(dayData.saida)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <LineChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum dado de fluxo de caixa disponível</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCashFlow}
                  className="mt-4"
                >
                  Carregar Dados
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumo de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Receita do Mês</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.stats.monthly_revenue)}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Saldo Atual</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.stats.current_balance)}
                  </div>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Pendências</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.stats.pending_amount)}
                  </div>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Métricas de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Crescimento de Receita</div>
                <div className={`text-xl font-bold ${getChangeColor(data.stats.monthly_revenue_change)}`}>
                  {formatPercentage(data.stats.monthly_revenue_change)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Comparado ao mês anterior
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Variação de Saldo</div>
                <div className={`text-xl font-bold ${getChangeColor(data.stats.balance_change)}`}>
                  {formatPercentage(data.stats.balance_change)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Comparado ao mês anterior
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Taxa de Pendências</div>
                <div className="text-xl font-bold text-orange-600">
                  {data.stats.monthly_revenue > 0
                    ? formatPercentage((data.stats.pending_amount / data.stats.monthly_revenue) * 100)
                    : "0%"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Pendências sobre receita
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Insights Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stats.monthly_revenue > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-green-800">Receita Positiva</div>
                      <div className="text-sm text-green-700">
                        Você teve receita este mês
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {data.stats.pending_amount > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-orange-800">Pendências</div>
                      <div className="text-sm text-orange-700">
                        Você tem {formatCurrency(data.stats.pending_amount)} em pendências
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {data.stats.monthly_revenue_change > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-blue-800">Crescimento</div>
                      <div className="text-sm text-blue-700">
                        Sua receita aumentou {formatPercentage(data.stats.monthly_revenue_change)} este mês
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {data.stats.monthly_revenue === 0 && data.stats.pending_amount === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-800">Sem Dados</div>
                      <div className="text-sm text-gray-700">
                        Ainda não há dados financeiros para exibir
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
