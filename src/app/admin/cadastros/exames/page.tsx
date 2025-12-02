"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, FlaskConical, Search } from "lucide-react";

interface ExamCatalogItem {
  id: number;
  code: string | null;
  name: string;
  category: string | null;
  description: string | null;
  preparation: string | null;
  price: number | null;
  is_active: boolean;
}

interface ExamFormData {
  code: string;
  name: string;
  category: string;
  description: string;
  preparation: string;
  price: string;
  is_active: boolean;
}

export default function AdminExamsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExamCatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamCatalogItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ExamFormData>({
    code: "",
    name: "",
    category: "",
    description: "",
    preparation: "",
    price: "",
    is_active: true,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const data = await api.get<ExamCatalogItem[]>(
        `/api/v1/clinical/exam-catalog?${params.toString()}`
      );
      setItems(data);
    } catch (error: any) {
      console.error("Failed to load exam catalog:", error);
      toast.error("Erro ao carregar exames", {
        description:
          error?.message ||
          error?.detail ||
          "Não foi possível carregar o cadastro de exames",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      category: "",
      description: "",
      preparation: "",
      price: "",
      is_active: true,
    });
    setShowForm(true);
  };

  const openEditForm = (item: ExamCatalogItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code || "",
      name: item.name,
      category: item.category || "",
      description: item.description || "",
      preparation: item.preparation || "",
      price: item.price != null ? String(item.price) : "",
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("O nome do exame é obrigatório");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        code: formData.code.trim() || null,
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        preparation: formData.preparation.trim() || null,
        price: formData.price ? parseFloat(formData.price.replace(",", ".")) : null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/api/v1/clinical/exam-catalog/${editingItem.id}`, payload);
        toast.success("Exame atualizado com sucesso!");
      } else {
        await api.post(`/api/v1/clinical/exam-catalog`, payload);
        toast.success("Exame cadastrado com sucesso!");
      }

      setShowForm(false);
      await loadItems();
    } catch (error: any) {
      console.error("Failed to save exam:", error);
      toast.error(editingItem ? "Erro ao atualizar exame" : "Erro ao cadastrar exame", {
        description:
          error?.message || error?.detail || "Não foi possível salvar o exame",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInactivate = async (item: ExamCatalogItem) => {
    try {
      await api.delete(`/api/v1/clinical/exam-catalog/${item.id}`);
      toast.success("Exame inativado com sucesso!");
      await loadItems();
    } catch (error: any) {
      console.error("Failed to inactivate exam:", error);
      toast.error("Erro ao inativar exame", {
        description:
          error?.message || error?.detail || "Não foi possível inativar o exame",
      });
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const value = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(value) ||
      (item.code || "").toLowerCase().includes(value) ||
      (item.category || "").toLowerCase().includes(value)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-cyan-600" />
            Cadastro de Exames
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie a tabela de exames da clínica (laboratório, imagem, etc.).
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, nome ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full md:w-72"
            />
          </div>
          <Button onClick={openCreateForm} className="bg-cyan-600 hover:bg-cyan-700">
            Novo Exame
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exames cadastrados</CardTitle>
          <CardDescription>
            Lista de exames disponíveis para solicitação e registro de resultados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando exames...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Nenhum exame cadastrado até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.code || "-"}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>
                        {item.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-700">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(item)}
                        >
                          Editar
                        </Button>
                        {item.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInactivate(item)}
                          >
                            Inativar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Exame" : "Novo Exame"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Ex.: HMG001"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex.: Laboratório, Imagem..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Nome do exame *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex.: Hemograma completo"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="preparation">Preparo / Orientações</Label>
              <Textarea
                id="preparation"
                value={formData.preparation}
                onChange={(e) =>
                  setFormData({ ...formData, preparation: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <Label htmlFor="price">Preço (opcional)</Label>
                <Input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="Ex.: 120,00"
                />
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-7">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Exame ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingItem ? (
                  "Atualizar"
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


