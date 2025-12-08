"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog2, Plus, Search, Edit, Trash2, User, RefreshCw, Mail, Phone, Eye, EyeOff, Shield, CheckCircle2, XCircle, Calendar, Download, Filter, Upload, FileText } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  consultation_room?: string | null;
  consultation_fee?: number | null;
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
  consultation_room: string;
  consultation_fee: string;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  
  const [formData, setFormData] = useState<DoctorFormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    is_active: true,
    is_verified: false,
    consultation_room: "",
    consultation_fee: "",
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
      const data = await api.get<Doctor[]>("/api/v1/users?role=doctor");
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
      consultation_room: "",
      consultation_fee: "",
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
      consultation_room: doctor.consultation_room || "",
      consultation_fee: doctor.consultation_fee?.toString() || "",
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
          consultation_room: formData.consultation_room.trim() || null,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        };

        // Only include password if it was provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await api.patch(`/api/v1/users/${editingDoctor.id}`, updateData);
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
          consultation_room: formData.consultation_room.trim() || null,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        };

        await api.post("/api/v1/users", createData);
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
      await api.patch(`/api/v1/users/${selectedDoctor?.id}`, {
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

  const handleDelete = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/api/v1/users/${doctorToDelete.id}`);
      toast.success("Médico excluído com sucesso!");
      await loadDoctors();
      setDoctorToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete doctor:", error);
      toast.error("Erro ao excluir médico", {
        description: error?.message || error?.detail || "Não foi possível excluir o médico",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      await api.patch(`/api/v1/users/${doctor.id}`, {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setUploadFile(file);
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    // Improved CSV parser that handles quoted values
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add last field
      result.push(current.trim());
      return result;
    };

    // Parse header
    const headerLine = parseCSVLine(lines[0]);
    const headers = headerLine.map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Handle cases where row has fewer or more columns than headers
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Remove surrounding quotes if present
        row[header] = value.replace(/^"|"$/g, '').trim();
      });
      
      // Only add row if it has at least one non-empty value
      if (Object.values(row).some(v => v && v.toString().trim())) {
        rows.push(row);
      }
    }
    
    return rows;
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const fileText = await uploadFile.text();
      const csvData = parseCSV(fileText);
      
      if (csvData.length === 0) {
        toast.error("O arquivo CSV está vazio ou em formato inválido");
        setIsUploading(false);
        return;
      }

      // Debug: Log first row to help diagnose issues
      if (csvData.length > 0) {
        console.log("CSV Headers:", Object.keys(csvData[0]));
        console.log("First row data:", csvData[0]);
      }

      if (csvData.length > 1000) {
        toast.error("O arquivo contém mais de 1000 linhas. Por favor, divida o arquivo.");
        setIsUploading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process doctors in batches
      const batchSize = 10;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        for (let batchIdx = 0; batchIdx < batch.length; batchIdx++) {
          const row = batch[batchIdx];
          const rowIndex = i + batchIdx + 2; // +2 because: +1 for header row, +1 for 0-based index
          
          try {
            // Map CSV columns to doctor data
            const username = (row.usuario || row.username || row['nome usuario'] || "").toString().trim();
            const email = (row.email || row.e_mail || row['e-mail'] || "").toString().trim();
            const firstName = (row.nome || row.first_name || row['first name'] || row['primeiro nome'] || "").toString().trim();
            const lastName = (row.sobrenome || row.last_name || row['last name'] || row['último nome'] || "").toString().trim();
            const password = (row.senha || row.password || "Senha123!").toString().trim(); // Default password if not provided

            // Validate required fields
            if (!username || !email || !firstName || !lastName) {
              failed++;
              const missingFields = [];
              if (!username) missingFields.push('usuario');
              if (!email) missingFields.push('email');
              if (!firstName) missingFields.push('nome');
              if (!lastName) missingFields.push('sobrenome');
              errors.push(`Linha ${rowIndex}: Campos obrigatórios faltando: ${missingFields.join(', ')}`);
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              failed++;
              errors.push(`Linha ${rowIndex}: E-mail inválido: ${email}`);
              continue;
            }

            // Create doctor data
            const doctorData = {
              username: username,
              email: email,
              password: password,
              first_name: firstName,
              last_name: lastName,
              role: "doctor" as const,
            };

            await api.post("/api/users", doctorData);
            console.log(`Doctor created successfully at row ${rowIndex}`);
            success++;
          } catch (error: any) {
            failed++;
            console.error(`Error creating doctor at row ${rowIndex}:`, error);
            
            // Safely extract error message
            const errorDetail = error?.response?.data?.detail;
            let errorMsgStr = "Erro desconhecido";
            
            if (typeof errorDetail === 'string') {
              errorMsgStr = errorDetail;
            } else if (Array.isArray(errorDetail)) {
              errorMsgStr = errorDetail.map((e: any) => {
                if (typeof e === 'string') return e;
                if (e?.msg) {
                  const field = e?.loc && Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
                  return field ? `${field}: ${e.msg}` : e.msg;
                }
                return JSON.stringify(e);
              }).join(', ');
            } else if (errorDetail && typeof errorDetail === 'object') {
              errorMsgStr = errorDetail.msg || errorDetail.message || JSON.stringify(errorDetail);
            } else {
              errorMsgStr = error?.response?.data?.message || error?.message || error?.detail || "Erro desconhecido";
            }
            
            errors.push(`Linha ${rowIndex}: ${errorMsgStr}`);
          }
        }

        // Update progress
        const progress = Math.min(90, ((i + batch.length) / csvData.length) * 90);
        setUploadProgress(progress);
      }

      setUploadProgress(100);
      setUploadResults({ success, failed, errors: errors.slice(0, 20) }); // Limit to 20 errors

      if (success > 0) {
        toast.success(`${success} médico(s) importado(s) com sucesso!`);
        
        // Wait a bit to ensure backend has processed all requests
        console.log("Waiting 1 second before reloading doctors...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reload doctors list with retry logic
        let retries = 3;
        let loaded = false;
        while (retries > 0 && !loaded) {
          try {
            console.log(`Attempting to reload doctors (${4 - retries}/3)...`);
            await loadDoctors();
            loaded = true;
            console.log("Doctors reloaded successfully!");
          } catch (error) {
            console.error(`Failed to reload doctors (attempt ${4 - retries}/3):`, error);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.error("Failed to reload doctors after upload:", error);
              toast.warning("Médicos importados, mas a lista não foi atualizada. Clique em 'Atualizar' para ver os novos médicos.");
            }
          }
        }
        
        // Switch to list tab to show the imported doctors
        if (loaded) {
          console.log("Switching to list tab...");
          setActiveTab("list");
        }
      }
      
      if (failed > 0) {
        toast.error(`${failed} médico(s) falharam ao importar`);
      }
    } catch (error: any) {
      console.error("Failed to upload CSV:", error);
      toast.error("Erro ao processar arquivo CSV", {
        description: error?.message || error?.detail || "Não foi possível processar o arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = "usuario,email,nome,sobrenome,senha\nmedico1,medico1@clinica.com,João,Silva,Senha123!\nmedico2,medico2@clinica.com,Maria,Santos,Senha123!";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_medicos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso");
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Médicos</TabsTrigger>
          <TabsTrigger value="bulk">Upload em Massa</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload em Massa de Médicos</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV para cadastrar múltiplos médicos de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="mb-4">
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Clique para selecionar um arquivo CSV
                    </span>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </Label>
                </div>
                {uploadFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(uploadFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(0)}% concluído</p>
                  </div>
                )}
                {uploadResults && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">{uploadResults.success} importado(s)</span>
                        </div>
                        {uploadResults.failed > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span className="font-semibold">{uploadResults.failed} falhou(ram)</span>
                          </div>
                        )}
                      </div>
                      {uploadResults.success > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await loadDoctors();
                            toast.success("Lista atualizada!");
                          }}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Atualizar Lista
                        </Button>
                      )}
                    </div>
                    {uploadResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">Erros encontrados:</p>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {uploadResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                        {uploadResults.errors.length >= 20 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Mostrando apenas os primeiros 20 erros...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template CSV
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Fazendo Upload..." : "Fazer Upload"}
                </Button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Instruções:</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>O arquivo CSV deve conter as colunas: usuario, email, nome, sobrenome, senha</li>
                  <li>A senha é opcional. Se não fornecida, será usada "Senha123!" como padrão</li>
                  <li>O arquivo deve estar codificado em UTF-8</li>
                  <li>Máximo de 1000 linhas por arquivo</li>
                  <li>Baixe o template para ver o formato correto</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <div className="col-span-2">
                <Label htmlFor="consultation_room">Sala / Local de atendimento padrão</Label>
                <Input
                  id="consultation_room"
                  value={formData.consultation_room}
                  onChange={(e) =>
                    setFormData({ ...formData, consultation_room: e.target.value })
                  }
                  placeholder="Ex.: Pré-consulta 1, Consultório 3"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="consultation_fee">Taxa de Consulta Padrão (R$)</Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.consultation_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, consultation_fee: e.target.value })
                  }
                  placeholder="Ex.: 150.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Valor padrão da consulta para este médico (opcional)
                </p>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Médico"
        description={doctorToDelete ? `Tem certeza que deseja excluir o médico ${doctorToDelete.first_name} ${doctorToDelete.last_name}? Esta ação desativará o médico.` : ""}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
