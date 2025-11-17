"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog2, Plus, Search, Edit, Trash2, User, RefreshCw, Mail, Phone, Eye, EyeOff, Shield, CheckCircle2, XCircle, Calendar, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Doctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id?: number;
  role_name?: string;
  clinic_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DoctorFormData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function MedicosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showForm, setShowForm] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<DoctorFormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    is_active: true,
    is_verified: false,
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      // Use the users endpoint with role filter for doctors
      const data = await api.get<Doctor[]>("/api/users?role=doctor");
      setDoctors(data);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      toast.error("Erro ao carregar médicos", {
        description: error?.message || error?.detail || "Não foi possível carregar os médicos",
      });
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchLower) ||
          doctor.username.toLowerCase().includes(searchLower) ||
          doctor.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((doctor) => doctor.is_active === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((doctor) => doctor.is_active === false);
    }

    setFilteredDoctors(filtered);
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      is_active: true,
      is_verified: false,
    });
    setEditingDoctor(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      username: doctor.username,
      email: doctor.email,
      password: "",
      confirm_password: "",
      first_name: doctor.first_name || "",
      last_name: doctor.last_name || "",
      is_active: doctor.is_active ?? true,
      is_verified: doctor.is_verified ?? false,
    });
    setShowForm(true);
  };

  const openDetailDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailDialog(true);
  };

  const openPasswordDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setShowPasswordDialog(true);
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      toast.error("O nome de usuário é obrigatório");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("O e-mail é obrigatório");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("E-mail inválido");
      return false;
    }

    if (!formData.first_name.trim()) {
      toast.error("O nome é obrigatório");
      return false;
    }

    if (!formData.last_name.trim()) {
      toast.error("O sobrenome é obrigatório");
      return false;
    }

    if (!editingDoctor) {
      // Creating new doctor
      if (!formData.password) {
        toast.error("A senha é obrigatória para novos médicos");
        return false;
      }

      if (formData.password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return false;
      }

      if (formData.password !== formData.confirm_password) {
        toast.error("As senhas não coincidem");
        return false;
      }
    } else {
      // Updating existing doctor
      if (formData.password && formData.password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return false;
      }

      if (formData.password && formData.password !== formData.confirm_password) {
        toast.error("As senhas não coincidem");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingDoctor) {
        // Update existing doctor
        const updateData: any = {
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          is_active: formData.is_active,
          is_verified: formData.is_verified,
        };

        // Only include password if it was provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await api.patch(`/api/users/${editingDoctor.id}`, updateData);
        toast.success("Médico atualizado com sucesso!");
      } else {
        // Create new doctor
        const createData = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          role: "doctor" as const,
        };

        await api.post("/api/users", createData);
        toast.success("Médico cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to save doctor:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || error?.detail || "Não foi possível salvar o médico";
      toast.error(editingDoctor ? "Erro ao atualizar médico" : "Erro ao cadastrar médico", {
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      setSaving(true);
      // Note: The backend might need a specific endpoint for password changes
      // For now, we'll use the update endpoint
      await api.patch(`/api/users/${selectedDoctor?.id}`, {
        password: passwordData.new_password,
      });
      toast.success("Senha alterada com sucesso!");
      setShowPasswordDialog(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || error?.detail || "Não foi possível alterar a senha";
      toast.error("Erro ao alterar senha", {
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Tem certeza que deseja excluir o médico ${doctor.first_name} ${doctor.last_name}? Esta ação desativará o médico.`)) {
      return;
    }

    try {
      await api.delete(`/api/users/${doctor.id}`);
      toast.success("Médico excluído com sucesso!");
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to delete doctor:", error);
      toast.error("Erro ao excluir médico", {
        description: error?.message || error?.detail || "Não foi possível excluir o médico",
      });
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await api.patch(`/api/users/${doctor.id}`, {
        is_active: !doctor.is_active,
      });
      toast.success(`Médico ${!doctor.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadDoctors();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status do médico", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Nome", "Sobrenome", "Usuário", "E-mail", "Status", "Verificado", "Data de Criação"];
    const rows = filteredDoctors.map(doctor => [
      doctor.first_name || "",
      doctor.last_name || "",
      doctor.username || "",
      doctor.email || "",
      doctor.is_active ? "Ativo" : "Inativo",
      doctor.is_verified ? "Sim" : "Não",
      doctor.created_at ? format(new Date(doctor.created_at), "dd/MM/yyyy", { locale: ptBR }) : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Lista de médicos exportada com sucesso!");
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserCog2 className="h-8 w-8 text-blue-600" />
          Cadastro de Médicos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie o cadastro de médicos da clínica
        </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Médicos Cadastrados</CardTitle>
              <CardDescription>
                Lista de todos os médicos ({filteredDoctors.length} {filteredDoctors.length === 1 ? 'médico' : 'médicos'})
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar médico..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDoctors}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredDoctors.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Médico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDoctors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetailDialog(doctor)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{doctor.first_name} {doctor.last_name}</div>
                          {doctor.role_name && (
                            <div className="text-xs text-gray-500">{doctor.role_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gray-400" />
                        {doctor.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {doctor.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={doctor.is_active ? "default" : "secondary"}
                        className={doctor.is_active ? "bg-green-600" : "bg-gray-400"}
                      >
                        {doctor.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={doctor.is_verified ? "default" : "outline"}
                        className={doctor.is_verified ? "bg-blue-600" : ""}
                      >
                        {doctor.is_verified ? "Verificado" : "Não verificado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(doctor)}
                          title={doctor.is_active ? "Desativar" : "Ativar"}
                        >
                          {doctor.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(doctor)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordDialog(doctor)}
                          title="Alterar senha"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doctor)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserCog2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || statusFilter !== "all" ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}</p>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Doctor Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Editar Médico" : "Cadastrar Novo Médico"}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor ? "Atualize os dados do médico" : "Preencha os dados do médico"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  required
                  disabled={!!editingDoctor}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nome.usuario"
                />
                {editingDoctor && (
                  <p className="text-xs text-gray-500 mt-1">O usuário não pode ser alterado</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="medico@clinica.com"
                />
              </div>
            </div>
            {!editingDoctor && (
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                <Input
                  id="password"
                      type={showPassword ? "text" : "password"}
                      required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Confirme a senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {editingDoctor && formData.password && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_password">Nova Senha (opcional)</Label>
                  <div className="relative">
                    <Input
                      id="edit_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Deixe em branco para manter"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_confirm_password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="edit_confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Confirme a nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Nome do médico"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Sobrenome do médico"
                />
              </div>
            </div>
            {editingDoctor && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Médico Ativo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_verified"
                    checked={formData.is_verified}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
                  />
                  <Label htmlFor="is_verified" className="cursor-pointer">
                    Verificado
                  </Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingDoctor ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Altere a senha do médico {selectedDoctor?.first_name} {selectedDoctor?.last_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="new_password">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm_new_password">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirm_new_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Confirme a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Alterando..." : "Alterar Senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Doctor Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Médico</DialogTitle>
            <DialogDescription>
              Informações completas do médico
            </DialogDescription>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Nome Completo</Label>
                  <p className="font-medium">{selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Usuário</Label>
                  <p className="font-medium">{selectedDoctor.username}</p>
                </div>
                <div>
                  <Label className="text-gray-500">E-mail</Label>
                  <p className="font-medium">{selectedDoctor.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Função</Label>
                  <p className="font-medium">{selectedDoctor.role_name || selectedDoctor.role || "Médico"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge
                    variant={selectedDoctor.is_active ? "default" : "secondary"}
                    className={selectedDoctor.is_active ? "bg-green-600" : "bg-gray-400"}
                  >
                    {selectedDoctor.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Verificação</Label>
                  <Badge
                    variant={selectedDoctor.is_verified ? "default" : "outline"}
                    className={selectedDoctor.is_verified ? "bg-blue-600" : ""}
                  >
                    {selectedDoctor.is_verified ? "Verificado" : "Não verificado"}
                  </Badge>
                </div>
                {selectedDoctor.created_at && (
                  <div>
                    <Label className="text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Criação
                    </Label>
                    <p className="font-medium">{formatDate(selectedDoctor.created_at)}</p>
                  </div>
                )}
                {selectedDoctor.updated_at && (
                  <div>
                    <Label className="text-gray-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Última Atualização
                    </Label>
                    <p className="font-medium">{formatDate(selectedDoctor.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
            {selectedDoctor && (
              <>
                <Button variant="outline" onClick={() => {
                  setShowDetailDialog(false);
                  openEditForm(selectedDoctor);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowDetailDialog(false);
                  openPasswordDialog(selectedDoctor);
                }}>
                  <Shield className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
