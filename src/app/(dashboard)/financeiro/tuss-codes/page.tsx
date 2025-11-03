"use client";

import { useState, useEffect } from "react";
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
  id: string;
  codigo: string;
  descricao: string;
  tabela: string;
  categoria: string;
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

const TUSS_CATEGORIES = {
  "CONSULTATION": "Consulta",
  "PROCEDURE": "Procedimento",
  "EXAM": "Exame", 
  "MEDICATION": "Medicamento",
  "OTHER": "Outro"
};

export default function TussCodesPage() {
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
    categoria: "CONSULTATION",
    ativo: true,
    observacoes: ""
  });

  useEffect(() => {
    loadTussCodes();
  }, []);

  const loadTussCodes = async () => {
    setLoading(true);
    try {
      // Load from localStorage (in a real app, this would be from the backend)
      const savedCodes = localStorage.getItem('tuss-codes');
      if (savedCodes) {
        setTussCodes(JSON.parse(savedCodes));
      } else {
        // Load default TUSS codes
        const defaultCodes: TussCode[] = [
          {
            id: "1",
            codigo: "10101012",
            descricao: "Consulta médica em consultório",
            tabela: "01",
            categoria: "CONSULTATION",
            ativo: true,
            observacoes: "Consulta de rotina"
          },
          {
            id: "2", 
            codigo: "20101010",
            descricao: "Eletrocardiograma",
            tabela: "03",
            categoria: "EXAM",
            ativo: true,
            observacoes: "ECG de 12 derivações"
          },
          {
            id: "3",
            codigo: "40301010", 
            descricao: "Hemograma completo",
            tabela: "03",
            categoria: "EXAM",
            ativo: true,
            observacoes: "Inclui contagem diferencial"
          },
          {
            id: "4",
            codigo: "30101010",
            descricao: "Curativo simples",
            tabela: "02", 
            categoria: "PROCEDURE",
            ativo: true,
            observacoes: "Curativo de pequeno porte"
          },
          {
            id: "5",
            codigo: "30101020",
            descricao: "Aplicação de injeção",
            tabela: "02",
            categoria: "PROCEDURE", 
            ativo: true,
            observacoes: "Aplicação intramuscular ou subcutânea"
          }
        ];
        setTussCodes(defaultCodes);
        localStorage.setItem('tuss-codes', JSON.stringify(defaultCodes));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar códigos TUSS", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let updatedCodes;
      
      if (editingCode) {
        // Update existing code
        updatedCodes = tussCodes.map(code => 
          code.id === editingCode.id ? { ...code, ...formData } : code
        );
      } else {
        // Add new code
        const { id, ...formDataWithoutId } = formData as TussCode;
        const newCode: TussCode = {
          id: Date.now().toString(),
          ...formDataWithoutId
        };
        updatedCodes = [...tussCodes, newCode];
      }
      
      setTussCodes(updatedCodes);
      localStorage.setItem('tuss-codes', JSON.stringify(updatedCodes));
      
      toast.success(editingCode ? "Código TUSS atualizado!" : "Código TUSS adicionado!");
      setIsDialogOpen(false);
      setEditingCode(null);
      setFormData({
        codigo: "",
        descricao: "",
        tabela: "01",
        categoria: "CONSULTATION",
        ativo: true,
        observacoes: ""
      });
    } catch (error: any) {
      toast.error("Erro ao salvar código TUSS", {
        description: error.message
      });
    }
  };

  const handleEdit = (code: TussCode) => {
    setEditingCode(code);
    setFormData(code);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este código TUSS?")) {
      try {
        const updatedCodes = tussCodes.filter(code => code.id !== id);
        setTussCodes(updatedCodes);
        localStorage.setItem('tuss-codes', JSON.stringify(updatedCodes));
        toast.success("Código TUSS excluído!");
      } catch (error: any) {
        toast.error("Erro ao excluir código TUSS", {
          description: error.message
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                categoria: "CONSULTATION",
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
                  value={formData.categoria || "CONSULTATION"}
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TUSS_CATEGORIES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
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
                      {TUSS_CATEGORIES[code.categoria as keyof typeof TUSS_CATEGORIES]}
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
          
          {filteredCodes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum código TUSS encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
