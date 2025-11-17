"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, ArrowUp, ArrowDown, RefreshCw, Download, Calendar,
  DollarSign, TrendingDown, Activity, BarChart3, LineChart, PieChart,
  Filter, Eye, FileText, CreditCard, Banknote, Clock, CheckCircle2,
  AlertCircle, ArrowUpRight, ArrowDownRight, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyCashFlow {
  day: string;
  date: string;
  entrada: number;
  saida: number;
}

interface CashFlowData {
  total_entrada: number;
  total_saida: number;
  saldo: number;
  daily_data: DailyCashFlow[];
}

export default function FluxoCaixaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [selectedDate, setSelectedDate] = useState<DailyCashFlow | null>(null);

  useEffect(() => {
    loadCashFlow();
  }, [selectedDays]);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      const cashFlowData = await api.get<CashFlowData>(
        `/api/v1/doctor/financial/cash-flow?days=${selectedDays}`
      );
      setData(cashFlowData);
    } catch (error: any) {
      console.error("Failed to load cash flow:", error);
      toast.error("Erro ao carregar fluxo de caixa", {
        description: error?.message || error?.detail || "Não foi possível carregar o fluxo de caixa",
      });
      setData({
        total_entrada: 0,
        total_saida: 0,
        saldo: 0,
        daily_data: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateFull = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const exportData = () => {
    if (!data || data.daily_data.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("Data,Entrada,Saída,Saldo Diário");
    
    data.daily_data.forEach(day => {
      const saldoDiario = day.entrada - day.saida;
      csvRows.push([
        formatDate(day.date),
        day.entrada.toFixed(2),
        day.saida.toFixed(2),
        saldoDiario.toFixed(2)
      ].join(","));
    });
    
    csvRows.push(""); // Empty row
    csvRows.push("Total Entrada,Total Saída,Saldo Final");
    csvRows.push([
      data.total_entrada.toFixed(2),
      data.total_saida.toFixed(2),
      data.saldo.toFixed(2)
    ].join(","));
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `fluxo-caixa-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  // Calculate statistics
  const stats = data ? {
    avgDailyEntrada: data.daily_data.length > 0
      ? data.total_entrada / data.daily_data.length
      : 0,
    avgDailySaida: data.daily_data.length > 0
      ? data.total_saida / data.daily_data.length
      : 0,
    bestDay: data.daily_data.reduce((best, day) => {
      const daySaldo = day.entrada - day.saida;
      const bestSaldo = best.entrada - best.saida;
      return daySaldo > bestSaldo ? day : best;
    }, data.daily_data[0] || { day: "", date: "", entrada: 0, saida: 0 }),
    worstDay: data.daily_data.reduce((worst, day) => {
      const daySaldo = day.entrada - day.saida;
      const worstSaldo = worst.entrada - worst.saida;
      return daySaldo < worstSaldo ? day : worst;
    }, data.daily_data[0] || { day: "", date: "", entrada: 0, saida: 0 }),
    positiveDays: data.daily_data.filter(day => day.entrada - day.saida > 0).length,
    negativeDays: data.daily_data.filter(day => day.entrada - day.saida < 0).length,
  } : null;

  // Calculate max value for chart scaling
  const maxChartValue = data
    ? Math.max(
        ...data.daily_data.map(d => Math.max(d.entrada, d.saida)),
        1
      )
    : 1;

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
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Não foi possível carregar o fluxo de caixa</p>
          <Button onClick={loadCashFlow} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const { total_entrada, total_saida, saldo, daily_data } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Fluxo de Caixa
          </h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o fluxo de entrada e saída de recursos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={!data || data.daily_data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCashFlow}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(total_entrada)}
            </div>
            {stats && (
              <div className="text-xs text-gray-500">
                Média diária: {formatCurrency(stats.avgDailyEntrada)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-red-600" />
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(total_saida)}
            </div>
            {stats && (
              <div className="text-xs text-gray-500">
                Média diária: {formatCurrency(stats.avgDailySaida)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className={`border-2 ${saldo >= 0 ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : 'border-red-200 bg-gradient-to-br from-red-50 to-white'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-2 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </div>
            {saldo >= 0 ? (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Saldo positivo
              </div>
            ) : (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3" />
                Saldo negativo
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period Selection and View Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>
                Visualize entradas e saídas por período
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedDays.toString()} onValueChange={(v) => setSelectedDays(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={(v: "chart" | "table") => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chart">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Gráfico
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tabela
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {daily_data.length > 0 ? (
            viewMode === "chart" ? (
              <div className="space-y-4">
                {daily_data.map((dayData, index) => {
                  const entradaPercent = (dayData.entrada / maxChartValue) * 100;
                  const saidaPercent = (dayData.saida / maxChartValue) * 100;
                  const saldoDiario = dayData.entrada - dayData.saida;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-700">
                            {formatDate(dayData.date)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (Dia {dayData.day})
                          </span>
                          {saldoDiario > 0 && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              Positivo
                            </Badge>
                          )}
                          {saldoDiario < 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                              Negativo
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <span className="text-green-600 font-medium">
                            Entrada: {formatCurrency(dayData.entrada)}
                          </span>
                          <span className="text-red-600 font-medium">
                            Saída: {formatCurrency(dayData.saida)}
                          </span>
                          <span className={`font-bold ${saldoDiario >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Saldo: {formatCurrency(saldoDiario)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-10 rounded overflow-hidden border">
                        <div 
                          className="bg-green-500 flex items-center justify-end pr-2 transition-all hover:bg-green-600 cursor-pointer"
                          style={{ width: `${entradaPercent}%` }}
                          title={`Entrada: ${formatCurrency(dayData.entrada)}`}
                          onClick={() => setSelectedDate(dayData)}
                        >
                          {entradaPercent > 15 && (
                            <span className="text-white text-xs font-semibold">
                              {formatCurrency(dayData.entrada)}
                            </span>
                          )}
                        </div>
                        <div 
                          className="bg-red-500 flex items-center justify-start pl-2 transition-all hover:bg-red-600 cursor-pointer"
                          style={{ width: `${saidaPercent}%` }}
                          title={`Saída: ${formatCurrency(dayData.saida)}`}
                          onClick={() => setSelectedDate(dayData)}
                        >
                          {saidaPercent > 15 && (
                            <span className="text-white text-xs font-semibold">
                              {formatCurrency(dayData.saida)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Entrada</TableHead>
                      <TableHead className="text-right">Saída</TableHead>
                      <TableHead className="text-right">Saldo Diário</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily_data.map((dayData, index) => {
                      const saldoDiario = dayData.entrada - dayData.saida;
                      return (
                        <TableRow 
                          key={index}
                          className={saldoDiario < 0 ? "bg-red-50" : ""}
                          onClick={() => setSelectedDate(dayData)}
                        >
                          <TableCell className="font-medium">
                            {formatDate(dayData.date)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(dayData.entrada)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {formatCurrency(dayData.saida)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${saldoDiario >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(saldoDiario)}
                          </TableCell>
                          <TableCell className="text-center">
                            {saldoDiario > 0 ? (
                              <Badge className="bg-green-100 text-green-800">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Positivo
                              </Badge>
                            ) : saldoDiario < 0 ? (
                              <Badge className="bg-red-100 text-red-800">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                Negativo
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                Neutro
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhum dado disponível</p>
              <p className="text-sm mt-2">
                Não há movimentações financeiras no período selecionado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && daily_data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Melhor Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600 mb-1">
                {formatDate(stats.bestDay.date)}
              </div>
              <div className="text-sm text-gray-600">
                Saldo: {formatCurrency(stats.bestDay.entrada - stats.bestDay.saida)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pior Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600 mb-1">
                {formatDate(stats.worstDay.date)}
              </div>
              <div className="text-sm text-gray-600">
                Saldo: {formatCurrency(stats.worstDay.entrada - stats.worstDay.saida)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Dias Positivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.positiveDays}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {daily_data.length > 0
                  ? Math.round((stats.positiveDays / daily_data.length) * 100)
                  : 0}% do período
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Dias Negativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.negativeDays}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {daily_data.length > 0
                  ? Math.round((stats.negativeDays / daily_data.length) * 100)
                  : 0}% do período
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Analysis */}
      {data && daily_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Análise do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Taxa de Entrada/Saída</div>
                <div className="text-2xl font-bold text-gray-900">
                  {total_saida > 0
                    ? ((total_entrada / total_saida) * 100).toFixed(1)
                    : total_entrada > 0
                    ? "∞"
                    : "0"}
                  %
                </div>
                <div className="text-xs text-gray-500">
                  {total_entrada > total_saida
                    ? "Entradas superam saídas"
                    : total_saida > total_entrada
                    ? "Saídas superam entradas"
                    : "Equilíbrio"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Média Diária de Entrada</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.avgDailyEntrada || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Baseado em {daily_data.length} {daily_data.length === 1 ? "dia" : "dias"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Média Diária de Saída</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.avgDailySaida || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  Baseado em {daily_data.length} {daily_data.length === 1 ? "dia" : "dias"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Details Dialog */}
      {selectedDate && (
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Dia</DialogTitle>
              <DialogDescription>
                {formatDateFull(selectedDate.date)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Entrada</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedDate.entrada)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Saída</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedDate.saida)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-gray-600 mb-1">Saldo do Dia</div>
                <div className={`text-3xl font-bold ${selectedDate.entrada - selectedDate.saida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedDate.entrada - selectedDate.saida)}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Nota:</p>
                    <p>Os detalhes das transações individuais estarão disponíveis quando o modelo de despesas for implementado.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDate(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
