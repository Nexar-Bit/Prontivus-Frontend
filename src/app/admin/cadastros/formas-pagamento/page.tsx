"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, Plus, Edit, Trash2, CheckCircle2, RefreshCw, Search,
  ArrowUp, ArrowDown, Settings, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";

interface PaymentMethodConfig {
  id: number;
  clinic_id: number;
  method: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

interface PaymentMethodFormData {
  method: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
}

// Payment method options
const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro", icon: "💵" },
  { value: "credit_card", label: "Cartão de Crédito", icon: "💳" },
  { value: "debit_card", label: "Cartão de Débito", icon: "💳" },
  { value: "bank_transfer", label: "Transferência Bancária", icon: "🏦" },
  { value: "pix", label: "PIX", icon: "📱" },
  { value: "check", label: "Boleto", icon: "🧾" },
  { value: "insurance", label: "Convênio", icon: "🏥" },
  { value: "other", label: "Outro", icon: "📋" },
];

export default function FormasPagamentoPage() {
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethodConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    method: "",
    name: "",
    is_active: true,
    is_default: false,
    display_order: 0,
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    filterMethods();
  }, [paymentMethods, searchTerm]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await api.get<PaymentMethodConfig[]>("/api/v1/payment-methods");
      setPaymentMethods(data);
    } catch (error: any) {
      console.error("Failed to load payment methods:", error);
      toast.error("Erro ao carregar formas de pagamento", {
        description: error?.message || error?.detail || "Não foi possível carregar as formas de pagamento",
      });
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentMethods = async () => {
    try {
      setInitializing(true);
      await api.post("/api/v1/payment-methods/initialize");
      toast.success("Formas de pagamento inicializadas com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to initialize payment methods:", error);
      toast.error("Erro ao inicializar formas de pagamento", {
        description: error?.message || error?.detail || "Não foi possível inicializar as formas de pagamento",
      });
    } finally {
      setInitializing(false);
    }
  };

  const filterMethods = () => {
    let filtered = [...paymentMethods];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (method) =>
          method.name.toLowerCase().includes(searchLower) ||
          method.method.toLowerCase().includes(searchLower)
      );
    }

    // Sort by display_order, then by name
    filtered.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredMethods(filtered);
  };

  const resetForm = () => {
    setFormData({
      method: "",
      name: "",
      is_active: true,
      is_default: false,
      display_order: 0,
    });
    setEditingMethod(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setFormData({
      method: method.method,
      name: method.name,
      is_active: method.is_active,
      is_default: method.is_default,
      display_order: method.display_order,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.method || !formData.name.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      if (editingMethod) {
        // Update existing method
        await api.put(`/api/v1/payment-methods/${editingMethod.id}`, {
          name: formData.name.trim(),
          is_active: formData.is_active,
          is_default: formData.is_default,
          display_order: formData.display_order,
        });
        toast.success("Forma de pagamento atualizada com sucesso!");
      } else {
        // Create new method
        await api.post("/api/v1/payment-methods", {
          method: formData.method,
          name: formData.name.trim(),
          is_active: formData.is_active,
          is_default: formData.is_default,
          display_order: formData.display_order,
        });
        toast.success("Forma de pagamento cadastrada com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to save payment method:", error);
      toast.error(editingMethod ? "Erro ao atualizar forma de pagamento" : "Erro ao cadastrar forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível salvar a forma de pagamento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: PaymentMethodConfig) => {
    if (!confirm(`Tem certeza que deseja excluir a forma de pagamento "${method.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/payment-methods/${method.id}`);
      toast.success("Forma de pagamento excluída com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to delete payment method:", error);
      toast.error("Erro ao excluir forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível excluir a forma de pagamento",
      });
    }
  };

  const handleToggleActive = async (method: PaymentMethodConfig) => {
    try {
      await api.put(`/api/v1/payment-methods/${method.id}`, {
        is_active: !method.is_active,
      });
      toast.success(`Forma de pagamento ${!method.is_active ? 'ativada' : 'desativada'} com sucesso!`);
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status da forma de pagamento", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const handleSetDefault = async (method: PaymentMethodConfig) => {
    if (method.is_default) {
      return; // Already default
    }

    try {
      await api.put(`/api/v1/payment-methods/${method.id}`, {
        is_default: true,
      });
      toast.success("Forma de pagamento padrão definida com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to set default:", error);
      toast.error("Erro ao definir forma de pagamento padrão", {
        description: error?.message || error?.detail || "Não foi possível definir a forma de pagamento padrão",
      });
    }
  };

  const handleMoveOrder = async (method: PaymentMethodConfig, direction: "up" | "down") => {
    const currentIndex = paymentMethods.findIndex(m => m.id === method.id);
    if (currentIndex === -1) return;

    const sortedMethods = [...paymentMethods].sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.name.localeCompare(b.name);
    });

    const sortedIndex = sortedMethods.findIndex(m => m.id === method.id);
    if (sortedIndex === -1) return;

    let targetIndex: number;
    if (direction === "up") {
      if (sortedIndex === 0) return;
      targetIndex = sortedIndex - 1;
    } else {
      if (sortedIndex === sortedMethods.length - 1) return;
      targetIndex = sortedIndex + 1;
    }

    const targetMethod = sortedMethods[targetIndex];
    const newOrder = targetMethod.display_order;
    const oldOrder = method.display_order;

    try {
      // Swap orders
      await api.put(`/api/v1/payment-methods/${method.id}`, {
        display_order: newOrder,
      });
      await api.put(`/api/v1/payment-methods/${targetMethod.id}`, {
        display_order: oldOrder,
      });
      toast.success("Ordem atualizada com sucesso!");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Failed to move order:", error);
      toast.error("Erro ao alterar ordem", {
        description: error?.message || error?.detail || "Não foi possível alterar a ordem",
      });
    }
  };

  const getMethodIcon = (method: string) => {
    return PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method)?.icon || "📋";
  };

  const getMethodLabel = (method: string) => {
    return PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method)?.label || method;
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const needsInitialization = paymentMethods.length === 0 || paymentMethods.some(m => m.id === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-blue-600" />
          Formas de Pagamento
        </h1>
        <p className="text-gray-600 mt-2">
          Configure as formas de pagamento aceitas pela clínica
        </p>
      </div>

      {needsInitialization && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Nenhuma forma de pagamento configurada. Clique no botão para inicializar as formas padrão.</span>
              <Button
                onClick={initializePaymentMethods}
                disabled={initializing}
                size="sm"
                className="ml-4"
              >
                {initializing ? "Inicializando..." : "Inicializar Formas de Pagamento"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>
                Gerencie as formas de pagamento disponíveis ({filteredMethods.length} {filteredMethods.length === 1 ? 'forma' : 'formas'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar forma de pagamento..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPaymentMethods}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={openCreateForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Forma de Pagamento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMethods.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Ordem</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMethods.map((method, index) => {
                  const sortedMethods = [...paymentMethods].sort((a, b) => {
                    if (a.display_order !== b.display_order) {
                      return a.display_order - b.display_order;
                    }
                    return a.name.localeCompare(b.name);
                  });
                  const sortedIndex = sortedMethods.findIndex(m => m.id === method.id);
                  const canMoveUp = sortedIndex > 0;
                  const canMoveDown = sortedIndex < sortedMethods.length - 1;

                  return (
                    <TableRow key={method.id || method.method}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveOrder(method, "up")}
                            disabled={!canMoveUp}
                            title="Mover para cima"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveOrder(method, "down")}
                            disabled={!canMoveDown}
                            title="Mover para baixo"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getMethodIcon(method.method)}</span>
                          <span className="text-sm text-gray-600">{getMethodLabel(method.method)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        <Badge className={method.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {method.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {method.is_default ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">Padrão</span>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(method)}
                            className="text-xs"
                          >
                            Definir como padrão
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(method)}
                            title={method.is_active ? "Desativar" : "Ativar"}
                          >
                            {method.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(method)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {method.id > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(method)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm ? "Nenhuma forma de pagamento encontrada" : "Nenhuma forma de pagamento cadastrada"}</p>
              {!searchTerm && !needsInitialization && (
                <Button
                  onClick={openCreateForm}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Forma de Pagamento
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Payment Method Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Editar Forma de Pagamento" : "Cadastrar Nova Forma de Pagamento"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? "Atualize os dados da forma de pagamento" : "Preencha os dados da forma de pagamento"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Método *</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => {
                    const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === value);
                    setFormData({ 
                      ...formData, 
                      method: value,
                      name: option?.label || formData.name
                    });
                  }}
                  required
                  disabled={!!editingMethod} // Can't change method when editing
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingMethod && (
                  <p className="text-xs text-gray-500 mt-1">O método não pode ser alterado após a criação</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Nome de Exibição *</Label>
                <Input
                  id="name"
                  required
                  placeholder="Ex: Dinheiro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Nome que será exibido para os usuários</p>
              </div>
            </div>
            <div>
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">Menor número aparece primeiro na lista</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">Ativo</Label>
                <p className="text-xs text-gray-500">Forma de pagamento disponível para uso</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default" className="cursor-pointer">Padrão</Label>
                <p className="text-xs text-gray-500">Será selecionada automaticamente</p>
              </div>
            </div>
            {formData.is_default && !editingMethod?.is_default && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ao definir esta forma como padrão, a forma de pagamento padrão atual será desmarcada automaticamente.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingMethod ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
