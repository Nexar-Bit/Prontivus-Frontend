"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search, Edit, Trash2, User, Shield, UserCog2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
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
import { adminApi } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ClinicUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  role_id?: number;
  role_name?: string;
  clinic_id?: number;
  clinic_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'doctor';
  is_active: boolean;
  is_verified: boolean;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'AdminClinica', icon: Shield },
  { value: 'doctor', label: 'Médico', icon: UserCog2 },
  { value: 'secretary', label: 'Secretária', icon: User },
];

export default function UsuariosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClinicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "doctor" | "secretary">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClinicUser | null>(null);
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ClinicUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    role: 'doctor',
    is_active: true,
    is_verified: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load users for current clinic (AdminClinica can only see their clinic's users)
      const data = await adminApi.getUsers({ clinic_id: user?.clinic_id });
      // Filter to only show admin, doctor, secretary (not patients)
      const staffUsers = data.filter(u => ['admin', 'doctor', 'secretary'].includes(u.role));
      setUsers(staffUsers);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error("Erro ao carregar usuários", {
        description: error?.message || error?.detail || "Não foi possível carregar os usuários",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) =>
        statusFilter === "active" ? u.is_active : !u.is_active
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      role: 'doctor',
      is_active: true,
      is_verified: false,
    });
    setShowForm(true);
  };

  const handleEdit = (user: ClinicUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      confirm_password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role as 'admin' | 'secretary' | 'doctor',
      is_active: user.is_active ?? true,
      is_verified: user.is_verified ?? false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("A senha é obrigatória para novos usuários");
      return;
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active,
          is_verified: formData.is_verified,
        };

        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await adminApi.updateUser(editingUser.id, updateData);
        toast.success("Usuário atualizado com sucesso");
      } else {
        // Create new user
        await adminApi.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          clinic_id: user?.clinic_id, // Use current clinic
        });
        toast.success("Usuário criado com sucesso");
      }

      setShowForm(false);
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast.error("Erro ao salvar usuário", {
        description: error?.message || error?.detail || "Não foi possível salvar o usuário",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (userToDelete: ClinicUser) => {
    setUserToDelete(userToDelete);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await adminApi.deleteUser(userToDelete.id);
      toast.success("Usuário excluído com sucesso");
      setShowDeleteDialog(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error("Erro ao excluir usuário", {
        description: error?.message || error?.detail || "Não foi possível excluir o usuário",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLE_OPTIONS.find(r => r.value === role);
    if (!roleConfig) return null;

    const Icon = roleConfig.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {roleConfig.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os usuários da clínica (AdminClinica, Médicos, Secretárias)
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Função</Label>
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="admin">AdminClinica</SelectItem>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informações do usuário"
                : "Preencha os dados para criar um novo usuário"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={!!editingUser}
                placeholder="nomeusuario"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Nome"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Sobrenome"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(v: 'admin' | 'secretary' | 'doctor') => handleInputChange("role", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                      placeholder="Confirme a senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
            {editingUser && (
              <div className="col-span-2">
                <Label htmlFor="password">Nova Senha (opcional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Usuário Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                />
                <Label htmlFor="is_verified">Email Verificado</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o usuário "${userToDelete?.username}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

