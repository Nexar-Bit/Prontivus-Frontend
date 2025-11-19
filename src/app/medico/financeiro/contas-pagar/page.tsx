"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, Search, Calendar, DollarSign, RefreshCw, Download,
  Eye, FileText, AlertCircle, CheckCircle2, Clock, TrendingUp,
  TrendingDown, Filter, Plus, Edit, Trash2, CreditCard,
  Banknote, CalendarDays, ArrowUpRight, ArrowDownRight, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payable {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  days_overdue?: number;
  category?: string | null;
  vendor?: string | null;
  paid_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PayableDetail extends Payable {
  payment_method?: string | null;
  payment_reference?: string | null;
}

export default function ContasPagarPage() {
  const [loading, setLoading] = useState(true);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [filteredPayables, setFilteredPayables] = useState<Payable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [payableDetail, setPayableDetail] = useState<PayableDetail | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    due_date: "",
    category: "",
    vendor: "",
    notes: "",
  });

  useEffect(() => {
    loadPayables();
  }, []);

  useEffect(() => {
    filterPayables();
  }, [payables, searchTerm, statusFilter, categoryFilter]);

  const loadPayables = async () => {
    try {
      setLoading(true);
      const data = await api.get<Payable[]>("/api/v1/financial/doctor/accounts-payable");
      setPayables(data);
    } catch (error: any) {
      console.error("Failed to load payables:", error);
      toast.error("Erro ao carregar contas a pagar", {
        description: error?.message || error?.detail || "Não foi possível carregar as contas a pagar",
      });
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPayableDetails = async (payable: Payable) => {
    try {
      setLoadingDetails(true);
      // Fetch expense details from API
      const detail = await api.get<PayableDetail>(`/api/v1/financial/doctor/expenses/${payable.id}`);
      setPayableDetail(detail);
      setSelectedPayable(payable);
      setShowDetails(true);
    } catch (error: any) {
      console.error("Failed to load payable details:", error);
      toast.error("Erro ao carregar detalhes", {
        description: error?.message || error?.detail || "Não foi possível carregar os detalhes",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterPayables = () => {
    let filtered = [...payables];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pay => 
        pay.description.toLowerCase().includes(search) ||
        (pay.category && pay.category.toLowerCase().includes(search)) ||
        (pay.vendor && pay.vendor.toLowerCase().includes(search)) ||
        pay.id.toString().includes(search)
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(pay => {
        const status = pay.status.toLowerCase();
        if (statusFilter === "paid") {
          return status === "paid" || status === "pago";
        } else if (statusFilter === "pending") {
          return status === "pending" || status === "pendente";
        } else if (statusFilter === "overdue") {
          return (pay.days_overdue && pay.days_overdue > 0) || status === "overdue" || status === "atrasado";
        }
        return true;
      });
    }
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(pay => pay.category === categoryFilter);
    }
    
    setFilteredPayables(filtered);
  };

  const handleCreate = () => {
    setFormData({
      description: "",
      amount: "",
      due_date: "",
      category: "",
      vendor: "",
      notes: "",
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (payable: Payable) => {
    setFormData({
      description: payable.description,
      amount: payable.amount.toString(),
      due_date: payable.due_date ? format(parseISO(payable.due_date), "yyyy-MM-dd") : "",
      category: payable.category || "",
      vendor: payable.vendor || "",
      notes: payable.notes || "",
    });
    setSelectedPayable(payable);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.description.trim()) {
        toast.error("Descrição é obrigatória");
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error("Valor deve ser maior que zero");
        return;
      }
      if (!formData.due_date) {
        toast.error("Data de vencimento é obrigatória");
        return;
      }
      
      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        due_date: new Date(formData.due_date).toISOString(),
        category: formData.category.trim() || undefined,
        vendor: formData.vendor.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };
      
      if (showEditDialog && selectedPayable) {
        // Update existing expense
        await api.put(`/api/v1/financial/doctor/expenses/${selectedPayable.id}`, expenseData);
        toast.success("Despesa atualizada com sucesso");
      } else {
        // Create new expense
        await api.post("/api/v1/financial/doctor/expenses", expenseData);
        toast.success("Despesa criada com sucesso");
      }
      
      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedPayable(null);
      await loadPayables();
    } catch (error: any) {
      console.error("Failed to save payable:", error);
      toast.error("Erro ao salvar", {
        description: error?.message || error?.detail || "Não foi possível salvar a conta a pagar",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayable) return;

    try {
      setDeleting(true);
      await api.delete(`/api/v1/financial/doctor/expenses/${selectedPayable.id}`);
      toast.success("Despesa excluída com sucesso");
      setShowDeleteDialog(false);
      setSelectedPayable(null);
      await loadPayables();
    } catch (error: any) {
      console.error("Failed to delete payable:", error);
      toast.error("Erro ao excluir", {
        description: error?.message || error?.detail || "Não foi possível excluir a conta a pagar",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string, daysOverdue?: number) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "paid" || statusLower === "pago") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
    } else if (daysOverdue && daysOverdue > 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Atrasado {daysOverdue > 0 ? `(${daysOverdue} dias)` : ""}
        </Badge>
      );
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
    }
  };

  const getAgingBadge = (daysOverdue?: number) => {
    if (!daysOverdue || daysOverdue <= 0) {
      return <Badge className="bg-green-100 text-green-800">Em dia</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">0-30 dias</Badge>;
    } else if (daysOverdue <= 60) {
      return <Badge className="bg-orange-100 text-orange-800">31-60 dias</Badge>;
    } else if (daysOverdue <= 90) {
      return <Badge className="bg-red-100 text-red-800">61-90 dias</Badge>;
    } else {
      return <Badge className="bg-red-200 text-red-900">+90 dias</Badge>;
    }
  };

  const exportData = () => {
    if (filteredPayables.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push("ID,Descrição,Valor,Data Vencimento,Categoria,Fornecedor,Status,Dias em Atraso");
    
    filteredPayables.forEach(pay => {
      csvRows.push([
        pay.id,
        pay.description,
        pay.amount.toFixed(2),
        formatDate(pay.due_date),
        pay.category || "",
        pay.vendor || "",
        pay.status,
        pay.days_overdue || 0
      ].join(","));
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `contas-pagar-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Dados exportados com sucesso!");
  };

  // Get unique categories
  const categories = Array.from(new Set(payables.map(p => p.category).filter(Boolean))) as string[];

  // Calculate statistics
  const stats = {
    total: payables.length,
    totalAmount: payables.reduce((sum, p) => sum + p.amount, 0),
    pending: payables.filter(p => {
      const status = p.status.toLowerCase();
      return status === "pending" || status === "pendente";
    }).length,
    pendingAmount: payables
      .filter(p => {
        const status = p.status.toLowerCase();
        return status === "pending" || status === "pendente";
      })
      .reduce((sum, p) => sum + p.amount, 0),
    overdue: payables.filter(p => p.days_overdue && p.days_overdue > 0).length,
    overdueAmount: payables
      .filter(p => p.days_overdue && p.days_overdue > 0)
      .reduce((sum, p) => sum + p.amount, 0),
    paid: payables.filter(p => {
      const status = p.status.toLowerCase();
      return status === "paid" || status === "pago";
    }).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-green-600" />
            Contas a Pagar
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as suas despesas pessoais e contas a pagar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={filteredPayables.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayables}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pending} {stats.pending === 1 ? "conta pendente" : "contas pendentes"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total} {stats.total === 1 ? "conta" : "contas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(stats.overdueAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overdue} {stats.overdue === 1 ? "conta atrasada" : "contas atrasadas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.paid}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contas já pagas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição, categoria, fornecedor ou ID..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payables Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                {filteredPayables.length} {filteredPayables.length === 1 ? "conta encontrada" : "contas encontradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayables.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Envelhecimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.map((payable) => (
                    <TableRow 
                      key={payable.id}
                      className={payable.days_overdue && payable.days_overdue > 0 ? "bg-red-50" : ""}
                    >
                      <TableCell className="font-medium">#{payable.id}</TableCell>
                      <TableCell className="font-medium">{payable.description}</TableCell>
                      <TableCell>
                        {payable.category ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Tag className="h-3 w-3" />
                            {payable.category}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{payable.vendor || "-"}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(payable.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(payable.due_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAgingBadge(payable.days_overdue)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payable.status, payable.days_overdue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadPayableDetails(payable)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(payable)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayable(payable);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Nenhuma conta encontrada com os filtros aplicados"
                  : "Nenhuma conta a pagar encontrada"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Tente ajustar os filtros ou limpar a busca"
                  : "Suas despesas aparecerão aqui quando houver contas a pagar registradas"}
              </p>
              {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payable Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Despesa</DialogTitle>
            <DialogDescription>
              {selectedPayable && `Despesa #${selectedPayable.id} - ${selectedPayable.description}`}
            </DialogDescription>
          </DialogHeader>
          {payableDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">ID</div>
                  <div className="font-semibold">#{payableDetail.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div>{getStatusBadge(payableDetail.status, payableDetail.days_overdue)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Descrição</div>
                  <div className="font-medium">{payableDetail.description}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Categoria</div>
                  <div className="font-medium">{payableDetail.category || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Fornecedor</div>
                  <div className="font-medium">{payableDetail.vendor || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Valor</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(payableDetail.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Data de Vencimento</div>
                  <div className="font-medium">{formatDate(payableDetail.due_date)}</div>
                </div>
                {payableDetail.paid_date && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Data de Pagamento</div>
                    <div className="font-medium">{formatDate(payableDetail.paid_date)}</div>
                  </div>
                )}
                {payableDetail.payment_method && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Método de Pagamento</div>
                    <div className="font-medium">{payableDetail.payment_method}</div>
                  </div>
                )}
                {payableDetail.payment_reference && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Referência</div>
                    <div className="font-medium">{payableDetail.payment_reference}</div>
                  </div>
                )}
              </div>
              {payableDetail.notes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Observações</div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {payableDetail.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
            {selectedPayable && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedPayable);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedPayable(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateDialog ? "Nova Despesa" : "Editar Despesa"}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog 
                ? "Adicione uma nova despesa ao sistema"
                : `Edite os detalhes da despesa #${selectedPayable?.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Aluguel, Material médico, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Aluguel, Material, etc."
                />
              </div>
              <div>
                <Label htmlFor="vendor">Fornecedor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedPayable(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa "{selectedPayable?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sim, excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
