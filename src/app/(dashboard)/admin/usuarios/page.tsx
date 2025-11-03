"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Database connection test states
  const [dbTestResults, setDbTestResults] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [showDbTests, setShowDbTests] = useState(false);

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: 1,
      username: "admin",
      email: "admin@clinic.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      is_active: true,
      is_verified: true,
      created_at: "2025-01-01T00:00:00Z"
    },
    {
      id: 2,
      username: "secretary",
      email: "secretary@clinic.com",
      first_name: "Sarah",
      last_name: "Secretary",
      role: "secretary",
      is_active: true,
      is_verified: true,
      created_at: "2025-01-01T00:00:00Z"
    },
    {
      id: 3,
      username: "dr.smith",
      email: "dr.smith@clinic.com",
      first_name: "John",
      last_name: "Smith",
      role: "doctor",
      is_active: true,
      is_verified: true,
      created_at: "2025-01-01T00:00:00Z"
    },
    {
      id: 4,
      username: "dr.jones",
      email: "dr.jones@clinic.com",
      first_name: "Emily",
      last_name: "Jones",
      role: "doctor",
      is_active: true,
      is_verified: true,
      created_at: "2025-01-01T00:00:00Z"
    },
    {
      id: 5,
      username: "patient1",
      email: "patient@example.com",
      first_name: "Michael",
      last_name: "Patient",
      role: "patient",
      is_active: true,
      is_verified: false,
      created_at: "2025-01-01T00:00:00Z"
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

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
      case 'admin': return "bg-red-100 text-red-800";
      case 'secretary': return "bg-blue-100 text-blue-800";
      case 'doctor': return "bg-green-100 text-green-800";
      case 'patient': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success("Usuário excluído com sucesso");
    }
  };

  const handleToggleActive = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, is_active: !user.is_active } : user
    ));
    toast.success("Status do usuário atualizado");
  };

  const testDatabaseConnections = async () => {
    setIsTestingDb(true);
    setShowDbTests(true);
    try {
      const results = await adminApi.testDatabaseConnections();
      setDbTestResults(results);
      toast.success("Teste de conexão concluído");
    } catch (error: any) {
      toast.error("Erro ao testar conexões", { description: error.message });
      setDbTestResults(null);
    } finally {
      setIsTestingDb(false);
    }
  };

  const getModuleDisplayName = (module: string): string => {
    const names: Record<string, string> = {
      'patients': 'Pacientes',
      'appointments': 'Agendamentos',
      'clinical': 'Clínico',
      'prescriptions': 'Prescrições',
      'diagnoses': 'Diagnósticos',
      'financial': 'Financeiro',
      'payments': 'Pagamentos',
      'service_items': 'Itens de Serviço',
      'stock': 'Estoque',
      'stock_movements': 'Movimentações de Estoque',
      'procedures': 'Procedimentos',
      'users': 'Usuários',
      'clinics': 'Clínicas'
    };
    return names[module] || module;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie usuários, permissões e acessos do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={testDatabaseConnections}
              disabled={isTestingDb}
            >
              {isTestingDb ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {isTestingDb ? 'Testando...' : 'Testar Conexões DB'}
            </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input id="firstName" placeholder="Nome" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" placeholder="Sobrenome" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="username" />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select>
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  setIsCreateDialogOpen(false);
                  toast.success("Usuário criado com sucesso");
                }}>
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Database Connection Tests */}
        {showDbTests && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Teste de Conexões com Banco de Dados
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testDatabaseConnections}
                  disabled={isTestingDb}
                >
                  <RefreshCw className={`h-4 w-4 ${isTestingDb ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isTestingDb && !dbTestResults ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Testando conexões...</span>
                </div>
              ) : dbTestResults ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total de Módulos</div>
                      <div className="text-2xl font-bold">{dbTestResults.summary.total_modules}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sucesso</div>
                      <div className="text-2xl font-bold text-green-600">{dbTestResults.summary.successful}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Falhas</div>
                      <div className="text-2xl font-bold text-red-600">{dbTestResults.summary.failed}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tempo Médio</div>
                      <div className="text-2xl font-bold">{dbTestResults.summary.average_response_time_ms}ms</div>
                    </div>
                  </div>

                  {/* Module Results */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Resultados por Módulo:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(dbTestResults.modules).map(([module, result]: [string, any]) => (
                        <div
                          key={module}
                          className={`p-3 rounded-lg border ${
                            result.status === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{getModuleDisplayName(module)}</span>
                            {result.status === 'success' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                {result.status === 'success' ? 'OK' : 'Erro'}
                              </Badge>
                            </div>
                            {result.record_count !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Registros:</span>
                                <span className="font-medium">{result.record_count}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tempo:</span>
                              <span className="font-medium">{result.response_time_ms}ms</span>
                            </div>
                            {result.error && (
                              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 break-words">
                                {result.error}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Clique em "Testar Conexões DB" para verificar a conectividade dos módulos
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_verified ? "default" : "outline"}>
                        {user.is_verified ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
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
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
