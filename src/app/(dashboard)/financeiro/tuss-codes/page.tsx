"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ServiceCategory } from "@/lib/types";
import { financialApi } from "@/lib/financial-api";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileCode, 
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface TussCode {
  id: number;
  codigo: string;
  descricao: string;
  tabela?: string;
  categoria: ServiceCategory;
  ativo: boolean;
  observacoes?: string;
}

const TUSS_TABLES = {
  "01": "Consultas",
  "02": "Procedimentos", 
  "03": "Exames",
  "04": "Medicamentos",
  "99": "Outros"
};

export default function TussCodesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tussCodes, setTussCodes] = useState<TussCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<TussCode | null>(null);
  const [formData, setFormData] = useState<Partial<TussCode>>({
    codigo: "",
    descricao: "",
    tabela: "01",
    categoria: ServiceCategory.CONSULTATION,
    ativo: true,
    observacoes: ""
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadTussCodes();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadTussCodes = async () => {
    setLoading(true);
    try {
      // Load service items that have TUSS codes (code field is not empty)
      const serviceItems = await financialApi.getServiceItems();
      
      // Filter service items that have codes and map them to TUSS codes format
      const codes: TussCode[] = serviceItems
        .filter(item => item.code && item.code.trim() !== "")
        .map(item => {
          // Extract table from code if possible (first 2 digits)
          const code = item.code || "";
          const tabela = code.length >= 2 ? code.substring(0, 2) : "01";
          
          return {
            id: item.id,
            codigo: code,
            descricao: item.name,
            tabela: tabela,
            categoria: item.category,
            ativo: item.is_active,
            observacoes: item.description || undefined
          };
        });
      
      setTussCodes(codes);
    } catch (error: any) {
      console.error("Failed to load TUSS codes:", error);
      toast.error("Erro ao carregar códigos TUSS", {
        description: error.message || "Não foi possível carregar os códigos TUSS"
      });
      setTussCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.descricao) {
      toast.error("Erro de validação", {
        description: "Código e descrição são obrigatórios"
      });
      return;
    }

    try {
      if (editingCode) {
        // Update existing service item
        await financialApi.updateServiceItem(editingCode.id, {
          name: formData.descricao || "",
          code: formData.codigo || "",
          description: formData.observacoes || "",
          category: formData.categoria || ServiceCategory.CONSULTATION,
          is_active: formData.ativo ?? true,
          price: 0 // TUSS codes don't have prices, but ServiceItem requires it
        });
        toast.success("Código TUSS atualizado!");
      } else {
        // Create new service item with TUSS code
        await financialApi.createServiceItem({
          name: formData.descricao || "",
          code: formData.codigo || "",
          description: formData.observacoes || "",
          category: formData.categoria || ServiceCategory.CONSULTATION,
          is_active: formData.ativo ?? true,
          price: 0 // TUSS codes don't have prices, but ServiceItem requires it
        });
        toast.success("Código TUSS adicionado!");
      }
      
      setIsDialogOpen(false);
      setEditingCode(null);
      setFormData({
        codigo: "",
        descricao: "",
        tabela: "01",
        categoria: ServiceCategory.CONSULTATION,
        ativo: true,
        observacoes: ""
      });
      await loadTussCodes();
    } catch (error: any) {
      console.error("Failed to save TUSS code:", error);
      toast.error("Erro ao salvar código TUSS", {
        description: error.message || "Não foi possível salvar o código TUSS"
      });
    }
  };

  const handleEdit = (code: TussCode) => {
    setEditingCode(code);
    setFormData({
      codigo: code.codigo,
      descricao: code.descricao,
      tabela: code.tabela || "01",
      categoria: code.categoria,
      ativo: code.ativo,
      observacoes: code.observacoes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este código TUSS?")) {
      try {
        // Get the current service item to preserve other fields
        const currentCode = tussCodes.find(c => c.id === id);
        if (!currentCode) {
          toast.error("Código TUSS não encontrado");
          return;
        }

        // Delete by setting is_active to false (soft delete) - preserve other fields
        await financialApi.updateServiceItem(id, {
          name: currentCode.descricao,
          code: currentCode.codigo,
          description: currentCode.observacoes || "",
          category: currentCode.categoria,
          is_active: false,
          price: 0 // ServiceItem requires price, but we set it to 0 for TUSS codes
        });
        toast.success("Código TUSS excluído!");
        await loadTussCodes();
      } catch (error: any) {
        console.error("Failed to delete TUSS code:", error);
        toast.error("Erro ao excluir código TUSS", {
          description: error.message || "Não foi possível excluir o código TUSS"
        });
      }
    }
  };

  const filteredCodes = tussCodes.filter(code => {
    const matchesSearch = !searchTerm || 
      code.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTable = filterTable === "all" || code.tabela === filterTable;
    
    return matchesSearch && matchesTable;
  });

  if (isLoading || (loading && tussCodes.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando códigos TUSS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Códigos TUSS</h1>
          <p className="text-muted-foreground">
            Gerencie os códigos TUSS para procedimentos e exames
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCode(null);
              setFormData({
                codigo: "",
                descricao: "",
                tabela: "01",
                categoria: ServiceCategory.CONSULTATION,
                ativo: true,
                observacoes: ""
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Código TUSS
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Editar Código TUSS" : "Novo Código TUSS"}
              </DialogTitle>
              <DialogDescription>
                {editingCode ? "Atualize as informações do código TUSS" : "Adicione um novo código TUSS"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código TUSS</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo || ""}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    placeholder="Ex: 10101012"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="tabela">Tabela</Label>
                  <Select
                    value={formData.tabela || "01"}
                    onValueChange={(value) => setFormData({...formData, tabela: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TUSS_TABLES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição do procedimento"
                />
              </div>
              
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria || ServiceCategory.CONSULTATION}
                    onValueChange={(value) => setFormData({...formData, categoria: value as ServiceCategory})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ServiceCategory.CONSULTATION}>Consulta</SelectItem>
                      <SelectItem value={ServiceCategory.PROCEDURE}>Procedimento</SelectItem>
                      <SelectItem value={ServiceCategory.EXAM}>Exame</SelectItem>
                      <SelectItem value={ServiceCategory.MEDICATION}>Medicamento</SelectItem>
                      <SelectItem value={ServiceCategory.OTHER}>Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ""}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCode ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sobre os Códigos TUSS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Os códigos TUSS (Terminologia Unificada da Saúde Suplementar) são utilizados 
            para padronizar a identificação de procedimentos, exames e medicamentos 
            no sistema de saúde suplementar brasileiro. Configure os códigos utilizados 
            pela sua clínica para garantir a compatibilidade com o padrão TISS.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tabelas</SelectItem>
                {Object.entries(TUSS_TABLES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TUSS Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Códigos TUSS ({filteredCodes.length})</CardTitle>
          <CardDescription>
            Lista de códigos TUSS configurados para a clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-medium">
                    {code.codigo}
                  </TableCell>
                  <TableCell>{code.descricao}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {code.tabela} - {TUSS_TABLES[code.tabela as keyof typeof TUSS_TABLES]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {code.categoria === ServiceCategory.CONSULTATION && "Consulta"}
                      {code.categoria === ServiceCategory.PROCEDURE && "Procedimento"}
                      {code.categoria === ServiceCategory.EXAM && "Exame"}
                      {code.categoria === ServiceCategory.MEDICATION && "Medicamento"}
                      {code.categoria === ServiceCategory.OTHER && "Outro"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.ativo ? "default" : "secondary"}>
                      {code.ativo ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(code)}
                        title="Editar código"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(code.id)}
                        title="Excluir código"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {loading && tussCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando códigos TUSS...
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum código TUSS encontrado</p>
              {searchTerm || filterTable !== "all" ? (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
              ) : (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Código TUSS
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
