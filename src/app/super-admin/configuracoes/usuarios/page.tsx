"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  UserCheck, 
  UserX,
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Loader2,
  Building,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  is_active: boolean;
  is_verified: boolean;
  clinic_id?: number;
  clinic_name?: string;
  created_at: string;
}

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
}

export default function SuperAdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "secretary" as 'admin' | 'secretary' | 'doctor' | 'patient',
    clinic_id: 0,
  });

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (clinics.length > 0) {
      loadUsers();
    }
  }, [selectedClinicId, roleFilter, clinics]);

  const loadClinics = async () => {
    try {
      const data = await adminApi.getClinics();
      setClinics(data);
      if (data.length > 0 && selectedClinicId === "all") {
        // Optionally set first clinic as default
      }
    } catch (e) {
      console.error(e);
      toast.error("Falha ao carregar clínicas");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      let data: User[] = [];
      
      if (selectedClinicId === "all") {
        // For SuperAdmin, we might need to get all users
        // For now, we'll use the admin API which returns users from current clinic
        // You may need to create a SuperAdmin-specific endpoint
        const params = roleFilter !== 'all' ? { role: roleFilter } : undefined;
        data = await adminApi.getUsers(params) as User[];
      } else {
        // Filter by clinic - you may need to add clinic_id filter to the API
        const params = roleFilter !== 'all' ? { role: roleFilter } : undefined;
        const allUsers = await adminApi.getUsers(params) as User[];
        data = allUsers.filter(u => u.clinic_id === selectedClinicId);
      }
      
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'secretary': return <ClipboardList className="h-4 w-4" />;
      case 'doctor': return <Stethoscope className="h-4 w-4" />;
      case 'patient': return <UserCheck className="h-4 w-4" />;
      default: return <UserX className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return "bg-purple-100 text-purple-800 border-purple-200";
      case 'secretary': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'doctor': return "bg-green-100 text-green-800 border-green-200";
      case 'patient': return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return "Administrador";
      case 'secretary': return "Secretária";
      case 'doctor': return "Médico";
      case 'patient': return "Paciente";
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    if (!formData.clinic_id || formData.clinic_id === 0) {
      toast.error("Selecione uma clínica");
      return;
    }

    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);
      // Use registration endpoint which accepts clinic_id
      await api.post('/api/v1/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        clinic_id: formData.clinic_id,
      });
      
      toast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast.error(error.response?.data?.detail || "Falha ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      clinic_id: user.clinic_id || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      await adminApi.updateUser(selectedUser.id, {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      });
      
      toast.success("Usuário atualizado com sucesso");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.detail || "Falha ao atualizar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success("Usuário excluído com sucesso");
    } catch (e: any) {
      toast.error("Erro ao excluir usuário", { description: e?.message });
    }
  };

  const handleToggleActive = async (userId: number) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    try {
      const updated = await adminApi.updateUser(userId, { is_active: !u.is_active });
      setUsers(prev => prev.map(x => x.id === userId ? { ...x, is_active: (updated as any).is_active ?? !u.is_active } : x));
      toast.success("Status do usuário atualizado");
    } catch (e: any) {
      toast.error("Erro ao atualizar status", { description: e?.message });
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "secretary",
      clinic_id: 0,
    });
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    verified: users.filter(u => u.is_verified).length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      secretary: users.filter(u => u.role === 'secretary').length,
      doctor: users.filter(u => u.role === 'doctor').length,
      patient: users.filter(u => u.role === 'patient').length,
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-7 w-7 text-purple-600" />
            </div>
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Gerencie usuários de todas as clínicas do sistema
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema. Selecione a clínica para a qual o usuário será criado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="clinic_id">Clínica *</Label>
                <Select
                  value={formData.clinic_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, clinic_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Nome"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Sobrenome"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <Label htmlFor="role">Função *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="secretary">Secretária</SelectItem>
                    <SelectItem value="doctor">Médico</SelectItem>
                    <SelectItem value="patient">Paciente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedClinicId.toString()} onValueChange={(value) => setSelectedClinicId(value === "all" ? "all" : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as clínicas</SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="patient">Paciente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Médicos
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.doctor}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Secretárias
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.secretary}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Lista de todos os usuários {selectedClinicId !== "all" ? `da clínica selecionada` : "do sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <div>
                            <div className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.username}
                            </div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={cn("border", getRoleColor(user.role))}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.clinic_name || `Clínica #${user.clinic_id}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                          {user.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">Nome</Label>
                <Input
                  id="editFirstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Sobrenome</Label>
                <Input
                  id="editLastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="patient">Paciente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

