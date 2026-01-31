"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  History, Search, RefreshCw, Loader2, Filter,
  Database, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  FileText, Calendar, User, Building2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tissInsuranceApi, TUSSLoadHistory } from "@/lib/tiss-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TISSHistoricoCargasPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TUSSLoadHistory[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoCargaFilter, setTipoCargaFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedHistory, setSelectedHistory] = useState<TUSSLoadHistory | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyData, companiesData] = await Promise.all([
        tissInsuranceApi.getLoadHistory({ limit: 1000 }),
        tissInsuranceApi.getCompanies({ limit: 1000 })
      ]);
      setHistory(historyData);
      setCompanies(companiesData);
    } catch (error: any) {
      console.error("Failed to load history:", error);
      toast.error("Erro ao carregar histórico", {
        description: error.message || "Não foi possível carregar o histórico"
      });
      setHistory([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchesSearch = !searchTerm || 
        h.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.tipo_carga.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.user_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = tipoCargaFilter === "all" || h.tipo_carga === tipoCargaFilter;
      
      const matchesCompany = companyFilter === "all" || 
        (h.insurance_company_id && h.insurance_company_id.toString() === companyFilter);
      
      return matchesSearch && matchesTipo && matchesCompany;
    });
  }, [history, searchTerm, tipoCargaFilter, companyFilter]);

  const stats = useMemo(() => {
    const total = history.length;
    const totalRecords = history.reduce((sum, h) => sum + h.total_registros, 0);
    const totalInserted = history.reduce((sum, h) => sum + h.registros_inseridos, 0);
    const totalErrors = history.reduce((sum, h) => sum + h.registros_erro, 0);
    
    return { total, totalRecords, totalInserted, totalErrors };
  }, [history]);

  const tiposCarga = useMemo(() => {
    return Array.from(new Set(history.map(h => h.tipo_carga)));
  }, [history]);

  const handleViewDetails = (h: TUSSLoadHistory) => {
    setSelectedHistory(h);
    setIsDetailDialogOpen(true);
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground font-medium">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg">
              <History className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Histórico de Cargas TUSS
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Visualize o histórico de cargas de dados TUSS realizadas
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadData} 
          disabled={loading}
          className="bg-white"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Cargas</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-700">{stats.total}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Registros</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.totalRecords.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Inseridos</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.totalInserted.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Erros</p>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.totalErrors.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por arquivo, tipo de carga ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Select value={tipoCargaFilter} onValueChange={setTipoCargaFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Tipo de carga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposCarga.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Convênio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os convênios</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Histórico de Cargas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'carga encontrada' : 'cargas encontradas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <History className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
              <p className="font-medium text-base sm:text-lg">Nenhuma carga encontrada</p>
              {searchTerm || tipoCargaFilter !== "all" || companyFilter !== "all" ? (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              ) : (
                <p className="text-sm">Nenhuma carga foi realizada ainda</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Data/Hora</TableHead>
                    <TableHead className="min-w-[150px]">Tipo de Carga</TableHead>
                    <TableHead className="min-w-[200px]">Arquivo</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Total</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Inseridos</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Atualizados</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[100px]">Erros</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[150px]">Usuário</TableHead>
                    <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((h) => (
                    <TableRow key={h.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(h.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.created_at), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{h.tipo_carga}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{h.nome_arquivo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-medium">{h.total_registros.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-sm text-green-600">{h.registros_inseridos.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-blue-600">{h.registros_atualizados.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {h.registros_erro > 0 ? (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-sm text-red-600">{h.registros_erro.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{h.user_nome || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(h)}
                          title="Ver detalhes"
                          className="h-8 w-8 p-0"
                        >
                          <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes da Carga</DialogTitle>
            <DialogDescription className="text-sm">
              Informações detalhadas sobre a carga realizada
            </DialogDescription>
          </DialogHeader>
          
          {selectedHistory && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Data/Hora</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedHistory.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de Carga</p>
                  <Badge variant="outline">{selectedHistory.tipo_carga}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Arquivo</p>
                  <p className="text-sm font-medium">{selectedHistory.nome_arquivo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Usuário</p>
                  <p className="text-sm">{selectedHistory.user_nome || "N/A"}</p>
                </div>
                {selectedHistory.insurance_company_nome && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Convênio</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{selectedHistory.insurance_company_nome}</p>
                    </div>
                  </div>
                )}
                {selectedHistory.versao_tuss && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Versão TUSS</p>
                    <p className="text-sm">{selectedHistory.versao_tuss}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Registros</p>
                  <p className="text-lg font-bold">{selectedHistory.total_registros.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Inseridos</p>
                  <p className="text-lg font-bold text-green-600">{selectedHistory.registros_inseridos.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Atualizados</p>
                  <p className="text-lg font-bold text-blue-600">{selectedHistory.registros_atualizados.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Erros</p>
                  <p className="text-lg font-bold text-red-600">{selectedHistory.registros_erro.toLocaleString()}</p>
                </div>
              </div>

              {selectedHistory.observacoes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{selectedHistory.observacoes}</p>
                </div>
              )}

              {selectedHistory.erros && Object.keys(selectedHistory.erros).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes dos Erros</p>
                  <div className="p-3 bg-red-50 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs text-red-800 whitespace-pre-wrap">
                      {JSON.stringify(selectedHistory.erros, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedHistory.avisos && Object.keys(selectedHistory.avisos).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Avisos</p>
                  <div className="p-3 bg-yellow-50 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs text-yellow-800 whitespace-pre-wrap">
                      {JSON.stringify(selectedHistory.avisos, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
