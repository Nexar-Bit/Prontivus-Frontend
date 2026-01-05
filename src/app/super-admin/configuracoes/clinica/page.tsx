"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building, Plus, Search, Edit, Trash2, RefreshCw, Users, Calendar, 
  AlertCircle, CheckCircle2, Settings, Eye, XCircle, Loader2, Key, Package,
  Shield, ClipboardList, Stethoscope, UserCheck, UserX, Copy, PlayCircle, Save, AlertTriangle
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { maskCPFOrCNPJ, maskPhone, onlyDigits } from "@/lib/inputMasks";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Clinic {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  license_key?: string;
  expiration_date?: string;
  max_users: number;
  active_modules: string[];
  user_count?: number;
  created_at: string;
  updated_at?: string;
}

interface ClinicStats {
  total_clinics: number;
  active_clinics: number;
  expired_licenses: number;
  total_users: number;
  clinics_near_expiration: number;
}

interface ClinicFormData {
  name: string;
  legal_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  license_key: string;
  expiration_date: string;
  max_users: string;
  active_modules: string[];
  is_active: boolean;
}

// User management interfaces
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

interface UserFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  clinic_id: number;
}

// License management interfaces
interface License {
  id: string;
  tenant_id: number;
  plan: string;
  modules: string[];
  users_limit: number;
  units_limit?: number;
  start_at: string;
  end_at: string;
  status: string;
  activation_key: string;
  is_active: boolean;
  is_expired: boolean;
  days_until_expiry: number;
  created_at: string;
  updated_at?: string;
  clinic_name?: string;
  ai_token_limit?: number | null;
  ai_enabled?: boolean;
}

interface LicenseFormData {
  tenant_id: string;
  plan: string;
  modules: string[];
  users_limit: string;
  units_limit: string;
  start_at: string;
  end_at: string;
}

// Module management interfaces
interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
  dependencies: string[];
  dependents: string[];
}

interface ClinicForModules {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  active_modules: string[];
  is_active: boolean;
  user_count?: number;
  max_users?: number;
}

const AVAILABLE_MODULES = [
  { value: "patients", label: "Pacientes" },
  { value: "appointments", label: "Agendamentos" },
  { value: "clinical", label: "Clínico" },
  { value: "financial", label: "Financeiro" },
  { value: "stock", label: "Estoque" },
  { value: "bi", label: "Business Intelligence" },
  { value: "procedures", label: "Procedimentos" },
  { value: "tiss", label: "TISS" },
  { value: "mobile", label: "Mobile" },
  { value: "telemed", label: "Telemedicina" },
];

const LICENSE_PLANS = [
  { value: "basic", label: "Básico" },
  { value: "professional", label: "Profissional" },
  { value: "enterprise", label: "Enterprise" },
  { value: "custom", label: "Customizado" },
];

const LICENSE_STATUSES = [
  { value: "active", label: "Ativa" },
  { value: "suspended", label: "Suspensa" },
  { value: "cancelled", label: "Cancelada" },
  { value: "expired", label: "Expirada" },
];

export default function ClinicaPage() {
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    license_key: "",
    expiration_date: "",
    max_users: "10",
    active_modules: [],
    is_active: true,
  });

  // User management states
  const [users, setUsers] = useState<User[]>([]);
  const [userClinics, setUserClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | "all">("all");
  const [userLoading, setUserLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "secretary",
    clinic_id: 0,
  });

  // License management states
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [licenseClinics, setLicenseClinics] = useState<Clinic[]>([]);
  const [licenseSearchTerm, setLicenseSearchTerm] = useState("");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<string>("all");
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [showLicenseDetailDialog, setShowLicenseDetailDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [licenseSaving, setLicenseSaving] = useState(false);
  const [showDeleteLicenseDialog, setShowDeleteLicenseDialog] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [licenseDeleting, setLicenseDeleting] = useState(false);
  const [licenseStats, setLicenseStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });
  const [licenseFormData, setLicenseFormData] = useState<LicenseFormData>({
    tenant_id: "",
    plan: "basic",
    modules: [],
    users_limit: "10",
    units_limit: "",
    start_at: new Date().toISOString().split('T')[0],
    end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Module management states
  const [moduleClinics, setModuleClinics] = useState<ClinicForModules[]>([]);
  const [selectedModuleClinicId, setSelectedModuleClinicId] = useState<string>("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [moduleItems, setModuleItems] = useState<Module[]>([]);
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");
  const [moduleLoading, setModuleLoading] = useState(true);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleHasChanges, setModuleHasChanges] = useState(false);
  const [pendingModuleChanges, setPendingModuleChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
    loadUserClinics();
    loadLicenseData();
    loadModuleData();
  }, []);

  const loadLicenseData = async () => {
    try {
      await Promise.all([
        loadLicenseClinics(),
        loadLicenses(),
      ]);
    } catch (error: any) {
      console.error("Failed to load license data:", error);
    }
  };

  useEffect(() => {
    filterClinics();
  }, [clinics, searchTerm, statusFilter]);

  useEffect(() => {
    if (userClinics.length > 0) {
      loadUsers();
    }
  }, [selectedClinicId, roleFilter, userClinics]);

  useEffect(() => {
    filterLicenses();
    calculateLicenseStats();
  }, [licenses, licenseSearchTerm, licenseStatusFilter]);

  useEffect(() => {
    if (selectedModuleClinicId) {
      loadClinicModules();
    }
  }, [selectedModuleClinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClinics(),
        loadStats(),
      ]);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=1000");
      setClinics(data);
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas", {
        description: error?.message || error?.detail || "Não foi possível carregar as clínicas",
      });
      setClinics([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.get<ClinicStats>("/api/v1/admin/clinics/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
      setStats(null);
    }
  };

  const filterClinics = () => {
    let filtered = [...clinics];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchLower) ||
          clinic.legal_name.toLowerCase().includes(searchLower) ||
          clinic.tax_id.includes(searchTerm) ||
          clinic.email?.toLowerCase().includes(searchLower) ||
          clinic.license_key?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter(c => c.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(c => !c.is_active);
    } else if (statusFilter === "expired") {
      filtered = filtered.filter(c => {
        if (!c.expiration_date) return false;
        return new Date(c.expiration_date) < new Date();
      });
    } else if (statusFilter === "expiring") {
      filtered = filtered.filter(c => {
        if (!c.expiration_date) return false;
        const expDate = new Date(c.expiration_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expDate >= today && expDate <= thirtyDaysFromNow;
      });
    }

    setFilteredClinics(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      legal_name: "",
      tax_id: "",
      address: "",
      phone: "",
      email: "",
      license_key: "",
      expiration_date: "",
      max_users: "10",
      active_modules: [],
      is_active: true,
    });
    setEditingClinic(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (clinic: Clinic) => {
    try {
      // Load full clinic details to ensure we have all fields (phone, address, etc.)
      const fullClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
      setEditingClinic(fullClinic);
      const expirationDate = fullClinic.expiration_date ? parseISO(fullClinic.expiration_date).toISOString().split('T')[0] : "";
      // Apply masks to tax_id and phone when loading from database
      const taxIdWithMask = fullClinic.tax_id ? maskCPFOrCNPJ(fullClinic.tax_id) : "";
      const phoneWithMask = fullClinic.phone ? maskPhone(fullClinic.phone) : "";
      setFormData({
        name: fullClinic.name || "",
        legal_name: fullClinic.legal_name || "",
        tax_id: taxIdWithMask,
        address: fullClinic.address || "",
        phone: phoneWithMask,
        email: fullClinic.email || "",
        license_key: fullClinic.license_key || "",
        expiration_date: expirationDate,
        max_users: fullClinic.max_users?.toString() || "10",
        active_modules: fullClinic.active_modules || [],
        is_active: fullClinic.is_active ?? true,
      });
      setShowForm(true);
    } catch (error: any) {
      console.error("Failed to load clinic details:", error);
      toast.error("Erro ao carregar detalhes da clínica", {
        description: error?.message || error?.detail,
      });
    }
  };

  const openDetailDialog = async (clinic: Clinic) => {
    try {
      // Load full clinic details
      const fullClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
      setSelectedClinic(fullClinic);
      setShowDetailDialog(true);
    } catch (error: any) {
      console.error("Failed to load clinic details:", error);
      toast.error("Erro ao carregar detalhes da clínica", {
        description: error?.message || error?.detail,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.legal_name || !formData.tax_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      // Prepare clinic data, ensuring no empty strings are sent
      const clinicData: any = {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim(),
        tax_id: onlyDigits(formData.tax_id.trim()), // Remove mask before sending
        max_users: parseInt(formData.max_users) || 10,
        active_modules: formData.active_modules || [],
        is_active: formData.is_active,
      };
      
      // Only include optional fields if they have values
      if (formData.address?.trim()) {
        clinicData.address = formData.address.trim();
      }
      if (formData.phone?.trim()) {
        const phoneDigits = onlyDigits(formData.phone.trim());
        if (phoneDigits) {
          clinicData.phone = phoneDigits;
        }
      }
      if (formData.email?.trim()) {
        clinicData.email = formData.email.trim();
      }
      if (formData.license_key?.trim()) {
        clinicData.license_key = formData.license_key.trim();
      }
      if (formData.expiration_date) {
        clinicData.expiration_date = formData.expiration_date;
      }
      
      // Log data being sent in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Clinic Form] Sending data:', { ...clinicData, tax_id: '***masked***' });
      }

      if (editingClinic) {
        const updatedClinic = await api.put<Clinic>(`/api/v1/admin/clinics/${editingClinic.id}`, clinicData);
        // Update the clinic in the local list immediately
        setClinics(prevClinics => 
          prevClinics.map(c => c.id === editingClinic.id ? updatedClinic : c)
        );
        toast.success("Clínica atualizada com sucesso!");
      } else {
        const createdClinic = await api.post<any>("/api/v1/admin/clinics", clinicData);
        
        // Check if admin user was created
        if (createdClinic?.admin_user) {
          const adminUser = createdClinic.admin_user;
          toast.success("Clínica cadastrada com sucesso!", {
            description: `Usuário AdminClinica criado automaticamente. Username: ${adminUser.username}, Email: ${adminUser.email}, Senha: ${adminUser.password}`,
            duration: 10000, // Show for 10 seconds
          });
        } else {
          toast.success("Clínica cadastrada com sucesso!");
        }
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save clinic:", error);
      
      // Log full error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Clinic Form] Full error details:', {
          message: error?.message,
          status: error?.status,
          data: error?.data,
          detail: error?.detail,
          response: error?.response,
        });
      }
      
      // Extract error message from various possible locations
      let errorMessage = "Não foi possível salvar a clínica";
      if (error?.message) {
        errorMessage = error.message;
        // Handle empty array error messages
        if (errorMessage === '[]' || errorMessage.trim() === '' || errorMessage.includes('No details provided') || errorMessage.includes('Validation error')) {
          errorMessage = "Erro de validação: Verifique se todos os campos obrigatórios estão preenchidos corretamente. Campos obrigatórios: Nome, Razão Social e CNPJ/CPF.";
        }
      } else if (error?.data?.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (Array.isArray(error.data.detail)) {
          if (error.data.detail.length === 0) {
            errorMessage = "Erro de validação: Verifique os dados informados";
          } else {
            errorMessage = error.data.detail.map((err: any) => 
              `${err.loc?.join('.') || 'campo'}: ${err.msg || err.message || 'valor inválido'}`
            ).join(', ');
          }
        } else {
          errorMessage = JSON.stringify(error.data.detail);
        }
      } else if (error?.detail) {
        if (Array.isArray(error.detail) && error.detail.length === 0) {
          errorMessage = "Erro de validação: Verifique os dados informados";
        } else {
          errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        }
      } else if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail) && error.response.data.detail.length === 0) {
          errorMessage = "Erro de validação: Verifique os dados informados";
        } else {
          errorMessage = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail);
        }
      }
      
      toast.error(editingClinic ? "Erro ao atualizar clínica" : "Erro ao cadastrar clínica", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (clinic: Clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clinicToDelete) return;
    
    // Show loading notification
    const loadingToast = toast.loading("Excluindo clínica...", {
      description: "Esta operação pode levar alguns segundos. Por favor, aguarde.",
      duration: Infinity, // Keep it until we dismiss it
    });
    
    try {
      setDeleting(true);
      const response = await api.delete(`/api/v1/admin/clinics/${clinicToDelete.id}`);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success - remove from local state immediately for better UX
      const updatedClinics = clinics.filter(c => c.id !== clinicToDelete.id);
      setClinics(updatedClinics);
      
      // Reload stats to get updated counts
      await loadStats();
      
      toast.success("Clínica excluída com sucesso!");
      
      // filterClinics will be called automatically by useEffect when clinics changes
      setClinicToDelete(null);
    } catch (error: any) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error("Failed to delete clinic:", error);
      // Extract error message from various possible locations
      let errorMessage = "Não foi possível excluir a clínica";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (Array.isArray(error.data.detail)) {
          errorMessage = error.data.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg}`
          ).join(', ');
        } else {
          errorMessage = JSON.stringify(error.data.detail);
        }
      } else if (error?.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      }
      toast.error("Erro ao excluir clínica", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (clinic: Clinic) => {
    try {
      await api.put(`/api/v1/admin/clinics/${clinic.id}`, {
        is_active: !clinic.is_active,
      });
      toast.success(`Clínica ${!clinic.is_active ? 'ativada' : 'desativada'} com sucesso!`);
      await loadClinics();
    } catch (error: any) {
      console.error("Failed to toggle active status:", error);
      toast.error("Erro ao alterar status da clínica", {
        description: error?.message || error?.detail || "Não foi possível alterar o status",
      });
    }
  };

  const handleUpdateModules = async (clinic: Clinic, modules: string[]) => {
    try {
      await api.patch(`/api/v1/admin/clinics/${clinic.id}/modules`, {
        active_modules: modules,
      });
      toast.success("Módulos atualizados com sucesso!");
      await loadClinics();
      if (selectedClinic && selectedClinic.id === clinic.id) {
        const updatedClinic = await api.get<Clinic>(`/api/v1/admin/clinics/${clinic.id}`);
        setSelectedClinic(updatedClinic);
      }
    } catch (error: any) {
      console.error("Failed to update modules:", error);
      toast.error("Erro ao atualizar módulos", {
        description: error?.message || error?.detail || "Não foi possível atualizar os módulos",
      });
    }
  };

  const toggleModule = (moduleValue: string) => {
    setFormData((prev) => {
      const modules = [...prev.active_modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, active_modules: modules };
    });
  };

  const isLicenseExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const isLicenseNearExpiration = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expDate >= today && expDate <= thirtyDaysFromNow;
  };

  // User management functions
  const loadUserClinics = async () => {
    try {
      const data = await adminApi.getClinics();
      setUserClinics(data);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao carregar clínicas");
    }
  };

  const loadUsers = async () => {
    try {
      setUserLoading(true);
      const params: { role?: string; clinic_id?: number } = {};
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (selectedClinicId !== "all") {
        params.clinic_id = selectedClinicId;
      }
      
      const data = await adminApi.getUsers(Object.keys(params).length > 0 ? params : undefined) as User[];
      setUsers(data);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao carregar usuários");
    } finally {
      setUserLoading(false);
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
      case 'admin': return "bg-blue-100 text-blue-800 border-blue-200";
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
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    if (!userFormData.clinic_id || userFormData.clinic_id === 0) {
      toast.error("Selecione uma clínica");
      return;
    }

    if (!userFormData.username || !userFormData.email || !userFormData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setUserSaving(true);
      await adminApi.createUser({
        username: userFormData.username,
        email: userFormData.email,
        password: userFormData.password,
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        role: userFormData.role,
        clinic_id: userFormData.clinic_id,
      });
      
      toast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      resetUserForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      let errorMessage = "Falha ao criar usuário";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.detail) {
        errorMessage = typeof error.data.detail === 'string' ? error.data.detail : JSON.stringify(error.data.detail);
      }
      toast.error("Falha ao criar usuário", { description: errorMessage, duration: 5000 });
    } finally {
      setUserSaving(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
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
      setUserSaving(true);
      const updateData: any = {
        email: userFormData.email,
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        role: userFormData.role,
      };
      
      if (userFormData.password && userFormData.password.trim() !== "") {
        if (userFormData.password.length < 8) {
          toast.error("A senha deve ter pelo menos 8 caracteres");
          setUserSaving(false);
          return;
        }
        updateData.password = userFormData.password;
      }
      
      await adminApi.updateUser(selectedUser.id, updateData);
      
      toast.success("Usuário atualizado com sucesso");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetUserForm();
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.response?.data?.detail || "Falha ao atualizar usuário");
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteUserDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await adminApi.deleteUser(userToDelete);
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      toast.success("Usuário excluído com sucesso");
      setUserToDelete(null);
    } catch (e: any) {
      toast.error("Erro ao excluir usuário", { description: e?.message });
    }
  };

  const handleToggleUserActive = async (userId: number) => {
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

  const resetUserForm = () => {
    setUserFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "secretary",
      clinic_id: 0,
    });
  };

  const userStats = {
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

  // License management functions
  const loadLicenseClinics = async () => {
    try {
      const data = await api.get<Clinic[]>("/api/v1/admin/clinics?limit=1000");
      setLicenseClinics(data);
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      setLicenseClinics([]);
    }
  };

  const loadLicenses = async () => {
    try {
      const data = await api.get<License[]>("/api/v1/licenses");
      setLicenses(data);
    } catch (error: any) {
      console.error("Failed to load licenses:", error);
      toast.error("Erro ao carregar licenças");
      setLicenses([]);
    }
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    if (licenseSearchTerm) {
      const searchLower = licenseSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (license) =>
          license.activation_key.toLowerCase().includes(searchLower) ||
          license.plan.toLowerCase().includes(searchLower) ||
          license.clinic_name?.toLowerCase().includes(searchLower) ||
          license.status.toLowerCase().includes(searchLower) ||
          license.id.toLowerCase().includes(searchLower)
      );
    }

    if (licenseStatusFilter === "active") {
      filtered = filtered.filter(l => l.is_active && !l.is_expired);
    } else if (licenseStatusFilter === "expired") {
      filtered = filtered.filter(l => l.is_expired);
    } else if (licenseStatusFilter === "suspended") {
      filtered = filtered.filter(l => l.status === "suspended");
    } else if (licenseStatusFilter === "cancelled") {
      filtered = filtered.filter(l => l.status === "cancelled");
    } else if (licenseStatusFilter === "expiring") {
      filtered = filtered.filter(l => !l.is_expired && l.days_until_expiry <= 30);
    }

    setFilteredLicenses(filtered);
  };

  const calculateLicenseStats = () => {
    const total = licenses.length;
    const active = licenses.filter(l => l.is_active && !l.is_expired).length;
    const expiring = licenses.filter(l => !l.is_expired && l.days_until_expiry <= 30).length;
    const expired = licenses.filter(l => l.is_expired).length;
    
    setLicenseStats({ total, active, expiring, expired });
  };

  const getClinicName = (tenantId: number) => {
    const clinic = licenseClinics.find(c => c.id === tenantId);
    return clinic?.name || `Clínica #${tenantId}`;
  };

  const openLicenseCreateForm = () => {
    setLicenseFormData({
      tenant_id: "",
      plan: "basic",
      modules: [],
      users_limit: "10",
      units_limit: "",
      start_at: new Date().toISOString().split('T')[0],
      end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingLicense(null);
    setShowLicenseDialog(true);
  };

  const openLicenseEditForm = async (license: License) => {
    try {
      const fullLicense = await api.get<License>(`/api/v1/licenses/${license.id}`);
      setEditingLicense(fullLicense);
      const startDate = fullLicense.start_at ? parseISO(fullLicense.start_at).toISOString().split('T')[0] : "";
      const endDate = fullLicense.end_at ? parseISO(fullLicense.end_at).toISOString().split('T')[0] : "";
      setLicenseFormData({
        tenant_id: fullLicense.tenant_id.toString(),
        plan: fullLicense.plan || "basic",
        modules: fullLicense.modules || [],
        users_limit: fullLicense.users_limit?.toString() || "10",
        units_limit: fullLicense.units_limit?.toString() || "",
        start_at: startDate,
        end_at: endDate,
      });
      setShowLicenseDialog(true);
    } catch (error: any) {
      console.error("Failed to load license details:", error);
      toast.error("Erro ao carregar detalhes da licença");
    }
  };

  const openLicenseDetailDialog = async (license: License) => {
    try {
      const fullLicense = await api.get<License>(`/api/v1/licenses/${license.id}`);
      setSelectedLicense(fullLicense);
      setShowLicenseDetailDialog(true);
    } catch (error: any) {
      console.error("Failed to load license details:", error);
      toast.error("Erro ao carregar detalhes da licença");
    }
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseFormData.tenant_id || !licenseFormData.plan || !licenseFormData.start_at || !licenseFormData.end_at) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (new Date(licenseFormData.end_at) <= new Date(licenseFormData.start_at)) {
      toast.error("Data de término deve ser posterior à data de início");
      return;
    }

    try {
      setLicenseSaving(true);

      const getTokenLimitByPlan = (plan: string): number | null => {
        const limits: Record<string, number> = {
          basic: 10_000,
          professional: 100_000,
          enterprise: 1_000_000,
          custom: -1,
        };
        return limits[plan.toLowerCase()] ?? null;
      };

      const hasAIModule = licenseFormData.modules.includes("ai") || licenseFormData.modules.includes("api");
      const aiTokenLimit = getTokenLimitByPlan(licenseFormData.plan);

      const licenseData: any = {
        tenant_id: parseInt(licenseFormData.tenant_id),
        plan: licenseFormData.plan,
        modules: licenseFormData.modules,
        users_limit: parseInt(licenseFormData.users_limit) || 10,
        units_limit: licenseFormData.units_limit ? parseInt(licenseFormData.units_limit) : undefined,
        start_at: new Date(licenseFormData.start_at).toISOString(),
        end_at: new Date(licenseFormData.end_at).toISOString(),
        ai_enabled: hasAIModule,
        ai_token_limit: hasAIModule ? aiTokenLimit : null,
      };

      if (editingLicense) {
        await api.put(`/api/v1/licenses/${editingLicense.id}`, licenseData);
        toast.success("Licença atualizada com sucesso!");
      } else {
        await api.post("/api/v1/licenses", licenseData);
        toast.success("Licença criada com sucesso!");
      }

      setShowLicenseDialog(false);
      setLicenseFormData({
        tenant_id: "",
        plan: "basic",
        modules: [],
        users_limit: "10",
        units_limit: "",
        start_at: new Date().toISOString().split('T')[0],
        end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setEditingLicense(null);
      await loadLicenses();
    } catch (error: any) {
      console.error("Failed to save license:", error);
      toast.error(editingLicense ? "Erro ao atualizar licença" : "Erro ao criar licença", {
        description: error?.message || error?.detail || "Não foi possível salvar a licença",
      });
    } finally {
      setLicenseSaving(false);
    }
  };

  const confirmDeleteLicense = async () => {
    if (!licenseToDelete) return;

    try {
      setLicenseDeleting(true);
      await api.delete(`/api/v1/licenses/${licenseToDelete.id}`);
      toast.success("Licença cancelada com sucesso!");
      await loadLicenses();
      setLicenseToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete license:", error);
      toast.error("Erro ao cancelar licença", {
        description: error?.message || error?.detail || "Não foi possível cancelar a licença",
      });
    } finally {
      setLicenseDeleting(false);
    }
  };

  const handleUpdateLicenseStatus = async (license: License, newStatus: string) => {
    try {
      await api.put(`/api/v1/licenses/${license.id}`, {
        status: newStatus,
      });
      toast.success("Status da licença atualizado com sucesso!");
      await loadLicenses();
      if (selectedLicense && selectedLicense.id === license.id) {
        const updatedLicense = await api.get<License>(`/api/v1/licenses/${license.id}`);
        setSelectedLicense(updatedLicense);
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Erro ao atualizar status", {
        description: error?.message || error?.detail || "Não foi possível atualizar o status",
      });
    }
  };

  const toggleLicenseModule = (moduleValue: string) => {
    setLicenseFormData((prev) => {
      const modules = [...prev.modules];
      const index = modules.indexOf(moduleValue);
      if (index > -1) {
        modules.splice(index, 1);
      } else {
        modules.push(moduleValue);
      }
      return { ...prev, modules };
    });
  };

  const copyActivationKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave de ativação copiada para a área de transferência!");
  };

  const getLicenseStatusBadge = (license: License) => {
    if (license.is_expired) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirada</Badge>;
    } else if (license.status === "suspended") {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Suspensa</Badge>;
    } else if (license.status === "cancelled") {
      return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1 inline" />Cancelada</Badge>;
    } else if (license.days_until_expiry <= 30) {
      return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1 inline" />Expirando</Badge>;
    } else if (license.is_active) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => {
    const planObj = LICENSE_PLANS.find(p => p.value === plan);
    return planObj?.label || plan;
  };

  // Module management functions  
  const loadModuleData = async () => {
    try {
      setModuleLoading(true);
      await Promise.all([
        loadModuleClinics(),
        loadAvailableModules(),
      ]);
    } catch (error: any) {
      console.error("Failed to load module data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setModuleLoading(false);
    }
  };

  const loadModuleClinics = async () => {
    try {
      const data = await api.get<ClinicForModules[]>("/api/v1/admin/clinics?limit=1000");
      setModuleClinics(data);
      if (data.length > 0 && !selectedModuleClinicId) {
        setSelectedModuleClinicId(data[0].id.toString());
      }
    } catch (error: any) {
      console.error("Failed to load clinics:", error);
      toast.error("Erro ao carregar clínicas");
      setModuleClinics([]);
    }
  };

  const loadAvailableModules = async () => {
    try {
      const data = await api.get<string[]>("/api/v1/admin/modules");
      setAvailableModules(data);
    } catch (error: any) {
      console.error("Failed to load available modules:", error);
      setAvailableModules(Object.keys(AVAILABLE_MODULES.map(m => m.value)));
    }
  };

  const loadClinicModules = async () => {
    if (!selectedModuleClinicId) return;

    try {
      const clinic = moduleClinics.find(c => c.id.toString() === selectedModuleClinicId);
      if (!clinic) {
        const fullClinic = await api.get<ClinicForModules>(`/api/v1/admin/clinics/${selectedModuleClinicId}`);
        const activeModules = fullClinic.active_modules || [];
        
        const MODULE_DEPENDENCIES: Record<string, string[]> = {
          bi: ["financial", "clinical", "appointments"],
          telemed: ["appointments", "clinical"],
          stock: ["financial"],
          financial: ["appointments"],
          clinical: ["appointments"],
          procedures: ["financial", "stock"],
          mobile: ["appointments", "clinical", "patients"],
        };
        
        const modulesList: Module[] = availableModules.map(moduleId => {
          const definition = AVAILABLE_MODULES.find(m => m.value === moduleId) || { label: moduleId, value: moduleId };
          const dependencies = MODULE_DEPENDENCIES[moduleId] || [];
          const dependents = Object.keys(MODULE_DEPENDENCIES).filter(
            key => MODULE_DEPENDENCIES[key].includes(moduleId)
          );
          
          return {
            id: moduleId,
            name: definition.label,
            description: `Módulo ${definition.label}`,
            enabled: activeModules.includes(moduleId),
            required: ['patients', 'appointments', 'clinical'].includes(moduleId),
            dependencies,
            dependents,
          };
        });

        setModuleItems(modulesList);
        setPendingModuleChanges({});
        setModuleHasChanges(false);
      } else {
        const activeModules = clinic.active_modules || [];
        
        const MODULE_DEPENDENCIES: Record<string, string[]> = {
          bi: ["financial", "clinical", "appointments"],
          telemed: ["appointments", "clinical"],
          stock: ["financial"],
          financial: ["appointments"],
          clinical: ["appointments"],
          procedures: ["financial", "stock"],
          mobile: ["appointments", "clinical", "patients"],
        };
        
        const modulesList: Module[] = availableModules.map(moduleId => {
          const definition = AVAILABLE_MODULES.find(m => m.value === moduleId) || { label: moduleId, value: moduleId };
          const dependencies = MODULE_DEPENDENCIES[moduleId] || [];
          const dependents = Object.keys(MODULE_DEPENDENCIES).filter(
            key => MODULE_DEPENDENCIES[key].includes(moduleId)
          );
          
          return {
            id: moduleId,
            name: definition.label,
            description: `Módulo ${definition.label}`,
            enabled: activeModules.includes(moduleId),
            required: ['patients', 'appointments', 'clinical'].includes(moduleId),
            dependencies,
            dependents,
          };
        });

        setModuleItems(modulesList);
        setPendingModuleChanges({});
        setModuleHasChanges(false);
      }
    } catch (error: any) {
      console.error("Failed to load clinic modules:", error);
      toast.error("Erro ao carregar módulos da clínica");
      setModuleItems([]);
    }
  };

  const toggleModuleEnabled = (moduleId: string) => {
    if (!selectedModuleClinicId) {
      toast.error("Selecione uma clínica primeiro");
      return;
    }

    const module = moduleItems.find(m => m.id === moduleId);
    if (!module) return;

    if (module.required) {
      toast.error("Este módulo é obrigatório e não pode ser desativado");
      return;
    }

    const newEnabled = !module.enabled;
    
    // Check dependencies
    if (newEnabled && module.dependencies.length > 0) {
      const missingDeps = module.dependencies.filter(
        dep => !moduleItems.find(m => m.id === dep)?.enabled
      );
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(dep => AVAILABLE_MODULES.find(m => m.value === dep)?.label || dep).join(", ");
        toast.error(`Este módulo requer: ${depNames}`, {
          description: "Ative os módulos dependentes primeiro",
        });
        return;
      }
    }

    // Check dependents
    if (!newEnabled && module.dependents.length > 0) {
      const activeDependents = module.dependents.filter(
        dep => moduleItems.find(m => m.id === dep)?.enabled
      );
      if (activeDependents.length > 0) {
        const depNames = activeDependents.map(dep => AVAILABLE_MODULES.find(m => m.value === dep)?.label || dep).join(", ");
        toast.warning(`Desativar este módulo também desativará: ${depNames}`, {
          description: "Deseja continuar?",
          action: {
            label: "Continuar",
            onClick: () => {
              const updates: Record<string, boolean> = { [moduleId]: false };
              activeDependents.forEach(dep => {
                updates[dep] = false;
              });
              applyModuleChanges(updates);
            }
          },
        });
        return;
      }
    }

    // Update local state
    setModuleItems(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, enabled: newEnabled }
          : m
      )
    );

    // Track changes
    setPendingModuleChanges(prev => ({
      ...prev,
      [moduleId]: newEnabled,
    }));
    setModuleHasChanges(true);
  };

  const applyModuleChanges = (updates: Record<string, boolean>) => {
    setModuleItems(prev =>
      prev.map(m => {
        if (updates[m.id] !== undefined) {
          return { ...m, enabled: updates[m.id] };
        }
        return m;
      })
    );

    const newPendingChanges = { ...pendingModuleChanges, ...updates };
    setPendingModuleChanges(newPendingChanges);
    setModuleHasChanges(true);
  };

  const saveModuleChanges = async () => {
    if (!selectedModuleClinicId || !moduleHasChanges) return;

    try {
      setModuleSaving(true);

      const finalModules = moduleItems
        .filter(m => m.enabled)
        .map(m => m.id);

      // Ensure required modules are always included
      const requiredModules = availableModules.filter(m => ['patients', 'appointments', 'clinical'].includes(m));
      const allModules = [...new Set([...requiredModules, ...finalModules])];

      await api.patch(`/api/v1/admin/clinics/${selectedModuleClinicId}/modules`, {
        active_modules: allModules,
      });

      // Update clinics list
      setModuleClinics(prev =>
        prev.map(c =>
          c.id.toString() === selectedModuleClinicId
            ? { ...c, active_modules: allModules }
            : c
        )
      );

      setPendingModuleChanges({});
      setModuleHasChanges(false);
      toast.success("Módulos atualizados com sucesso!");
    } catch (error: any) {
      console.error("Failed to save modules:", error);
      toast.error("Erro ao salvar módulos", {
        description: error?.message || error?.detail || "Não foi possível salvar as alterações",
      });
    } finally {
      setModuleSaving(false);
    }
  };

  const getSelectedModuleClinic = () => {
    return moduleClinics.find(c => c.id.toString() === selectedModuleClinicId);
  };

  const filteredModules = moduleItems.filter(module =>
    moduleSearchTerm === "" ||
    module.name.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(moduleSearchTerm.toLowerCase()) ||
    module.id.toLowerCase().includes(moduleSearchTerm.toLowerCase())
  );

  const enabledModuleCount = moduleItems.filter(m => m.enabled).length;
  const disabledModuleCount = moduleItems.filter(m => !m.enabled && !m.required).length;
  const requiredModuleCount = moduleItems.filter(m => m.required).length;

  if (loading && clinics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Building className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <span className="truncate">Gestão de Clínica</span>
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Gerencie clínicas, usuários, licenciamento e módulos em um único local
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Main Tabs for unified clinic management */}
      <Tabs defaultValue="clinics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="clinics" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Clínicas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="licensing" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Licenciamento
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Módulos
          </TabsTrigger>
        </TabsList>

        {/* Clinics Tab */}
        <TabsContent value="clinics" className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clínicas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active_clinics}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Licenças Expiradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.expired_licenses}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expirando em 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.clinics_near_expiration}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Clínicas Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as clínicas no sistema ({filteredClinics.length} {filteredClinics.length === 1 ? 'clínica' : 'clínicas'})
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clínica..."
                  className="pl-10 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="expiring">Expirando</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Clínica
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredClinics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.map((clinic) => {
                  const expired = isLicenseExpired(clinic.expiration_date);
                  const nearExpiration = isLicenseNearExpiration(clinic.expiration_date);
                  
                  return (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{clinic.legal_name}</TableCell>
                      <TableCell>{clinic.tax_id}</TableCell>
                      <TableCell>{clinic.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {clinic.user_count || 0} / {clinic.max_users}
                        </div>
                      </TableCell>
                      <TableCell>
                        {clinic.expiration_date ? (
                          <div className="flex flex-col">
                            <span className={expired ? "text-red-600 font-medium" : nearExpiration ? "text-yellow-600 font-medium" : "text-gray-600"}>
                              {format(parseISO(clinic.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {expired && (
                              <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirada
                              </Badge>
                            )}
                            {nearExpiration && !expired && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">
                                <AlertCircle className="h-3 w-3 mr-1 inline" />Expirando
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sem data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {clinic.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1 inline" />Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openDetailDialog(clinic)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditForm(clinic)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 min-w-[80px]"
                            onClick={() => handleToggleActive(clinic)}
                            title={clinic.is_active ? "Desativar" : "Ativar"}
                          >
                            {clinic.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(clinic)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{searchTerm || statusFilter !== "all" ? "Nenhuma clínica encontrada" : "Nenhuma clínica cadastrada"}</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 sm:space-y-6">
          {userLoading && users.length === 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    Gerenciar Usuários
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Gerencie usuários de todas as clínicas do sistema
                  </p>
                </div>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
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
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
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
                          {userClinics.map((clinic) => (
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
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Usuários
                    </CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.total}</div>
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
                    <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Administradores
                    </CardTitle>
                    <Shield className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.byRole.admin}</div>
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
                    <div className="text-2xl font-bold">{userStats.byRole.doctor}</div>
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
                    <div className="text-2xl font-bold">{userStats.byRole.secretary}</div>
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
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditUser(user)}
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleToggleUserActive(user.id)}
                                    title={user.is_active ? "Desativar" : "Ativar"}
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
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDeleteUser(user.id)}
                                    title="Excluir"
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
            </>
          )}
        </TabsContent>

        {/* Licensing Tab */}
        <TabsContent value="licensing" className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Key className="h-6 w-6 text-blue-600" />
                Gestão de Licenciamento
              </h2>
              <p className="text-gray-600 mt-2 text-sm">
                Gerencie licenças e chaves de ativação das clínicas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLicenseData}
              disabled={licenseSaving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${licenseSaving ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Licenças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{licenseStats.total}</div>
                <p className="text-xs text-gray-500 mt-1">Clínicas licenciadas</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Licenças Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{licenseStats.active}</div>
                <p className="text-xs text-gray-500 mt-1">Em uso</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Expirando em 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{licenseStats.expiring}</div>
                <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Licenças Expiradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{licenseStats.expired}</div>
                <p className="text-xs text-gray-500 mt-1">Vencidas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Licenças</CardTitle>
                  <CardDescription>
                    Gerencie todas as licenças do sistema ({filteredLicenses.length} {filteredLicenses.length === 1 ? 'licença' : 'licenças'})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar licença..."
                      className="pl-10 w-64"
                      value={licenseSearchTerm}
                      onChange={(e) => setLicenseSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={licenseStatusFilter} onValueChange={setLicenseStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="expired">Expiradas</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                      <SelectItem value="expiring">Expirando</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={openLicenseCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Licença
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLicenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Chave de Ativação</TableHead>
                        <TableHead>Módulos</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLicenses.map((license) => (
                        <TableRow key={license.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              {getClinicName(license.tenant_id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getPlanLabel(license.plan)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {license.activation_key.substring(0, 12)}...
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyActivationKey(license.activation_key)}
                                className="h-6 w-6 p-0"
                                title="Copiar chave completa"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {license.modules.slice(0, 3).map((module) => (
                                <Badge key={module} variant="outline" className="text-xs">
                                  {AVAILABLE_MODULES.find(m => m.value === module)?.label || module}
                                </Badge>
                              ))}
                              {license.modules.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{license.modules.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              {license.users_limit}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="text-gray-600">
                                {format(parseISO(license.start_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="text-gray-400">até</span>
                              <span className={license.is_expired ? "text-red-600 font-medium" : license.days_until_expiry <= 30 ? "text-orange-600 font-medium" : "text-gray-600"}>
                                {format(parseISO(license.end_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              {!license.is_expired && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {license.days_until_expiry} {license.days_until_expiry === 1 ? 'dia' : 'dias'} restantes
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getLicenseStatusBadge(license)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openLicenseDetailDialog(license)}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openLicenseEditForm(license)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {license.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setLicenseToDelete(license);
                                    setShowDeleteLicenseDialog(true);
                                  }}
                                  title="Cancelar"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{licenseSearchTerm || licenseStatusFilter !== "all" ? "Nenhuma licença encontrada" : "Nenhuma licença cadastrada"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                Gestão de Módulos
              </h2>
              <p className="text-gray-600 mt-2 text-sm">
                Ative ou desative módulos do sistema para cada clínica
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadModuleData}
              disabled={moduleSaving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${moduleSaving ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Clinic Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Clínica</CardTitle>
              <CardDescription>
                Escolha a clínica para gerenciar seus módulos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedModuleClinicId || ""}
                    onValueChange={(value) => {
                      if (moduleHasChanges) {
                        if (confirm("Há alterações não salvas. Deseja descartá-las?")) {
                          setSelectedModuleClinicId(value);
                        }
                      } else {
                        setSelectedModuleClinicId(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      {moduleClinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{clinic.name}</span>
                            {!clinic.is_active && (
                              <Badge variant="secondary" className="ml-2">Inativa</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {getSelectedModuleClinic() && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{getSelectedModuleClinic()?.active_modules?.length || 0}</span> módulos ativos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedModuleClinicId && (
            <>
              {/* Changes Alert */}
              {moduleHasChanges && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Há alterações não salvas</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadClinicModules();
                          toast.info("Alterações descartadas");
                        }}
                      >
                        Descartar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={saveModuleChanges}
                        disabled={moduleSaving}
                      >
                        {moduleSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar módulo..."
                  className="pl-10"
                  value={moduleSearchTerm}
                  onChange={(e) => setModuleSearchTerm(e.target.value)}
                />
              </div>

              {/* Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModules.length > 0 ? (
                  filteredModules.map((module) => {
                    const hasPendingChange = pendingModuleChanges[module.id] !== undefined;
                    const isDependencyMissing = module.dependencies.some(
                      dep => !moduleItems.find(m => m.id === dep)?.enabled
                    );
                    
                    return (
                      <Card
                        key={module.id}
                        className={`${
                          module.enabled 
                            ? "border-blue-200 bg-blue-50/30" 
                            : ""
                        } ${
                          hasPendingChange 
                            ? "ring-2 ring-yellow-400" 
                            : ""
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {module.name}
                                {module.required && (
                                  <Badge variant="secondary" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                )}
                                {hasPendingChange && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100">
                                    Pendente
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {module.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={module.id} className="flex items-center gap-2">
                                {module.enabled ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-400" />
                                )}
                                <span className={module.enabled ? "text-gray-900" : "text-gray-500"}>
                                  {module.enabled ? "Ativo" : "Inativo"}
                                </span>
                              </Label>
                              <Switch
                                id={module.id}
                                checked={module.enabled}
                                onCheckedChange={() => toggleModuleEnabled(module.id)}
                                disabled={module.required || moduleSaving || isDependencyMissing}
                              />
                            </div>
                            
                            {module.dependencies.length > 0 && (
                              <div className="pt-2 border-t">
                                <div className="text-xs text-gray-500 mb-1">Dependências:</div>
                                <div className="flex flex-wrap gap-1">
                                  {module.dependencies.map(dep => {
                                    const depModule = moduleItems.find(m => m.id === dep);
                                    return (
                                      <Badge
                                        key={dep}
                                        variant="outline"
                                        className={`text-xs ${
                                          depModule?.enabled 
                                            ? "bg-green-50 border-green-200" 
                                            : "bg-red-50 border-red-200"
                                        }`}
                                      >
                                        {AVAILABLE_MODULES.find(m => m.value === dep)?.label || dep}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {module.dependents.length > 0 && (
                              <div className="pt-2 border-t">
                                <div className="text-xs text-gray-500 mb-1">Usado por:</div>
                                <div className="flex flex-wrap gap-1">
                                  {module.dependents.map(dep => {
                                    return (
                                      <Badge
                                        key={dep}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {AVAILABLE_MODULES.find(m => m.value === dep)?.label || dep}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      {moduleSearchTerm
                        ? "Nenhum módulo encontrado"
                        : "Nenhum módulo disponível"}
                    </p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {getSelectedModuleClinic() && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {enabledModuleCount}
                        </div>
                        <div className="text-sm text-gray-600">Módulos Ativos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {disabledModuleCount}
                        </div>
                        <div className="text-sm text-gray-600">Módulos Inativos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {requiredModuleCount}
                        </div>
                        <div className="text-sm text-gray-600">Módulos Obrigatórios</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!selectedModuleClinicId && moduleClinics.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma clínica cadastrada</p>
                <p className="text-sm mt-2">Cadastre uma clínica primeiro para gerenciar módulos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Clinic Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {editingClinic ? "Editar Clínica" : "Cadastrar Nova Clínica"}
            </DialogTitle>
            <DialogDescription>
              {editingClinic ? "Atualize os dados da clínica" : "Preencha os dados da clínica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="license">Licenciamento</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Razão Social *</Label>
                    <Input
                      id="legal_name"
                      required
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">CNPJ/CPF *</Label>
                    <Input
                      id="tax_id"
                      required
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      value={formData.tax_id}
                      onChange={(e) => {
                        // Remove all non-digits first, then apply mask
                        const digits = onlyDigits(e.target.value);
                        const masked = maskCPFOrCNPJ(digits);
                        setFormData({ ...formData, tax_id: masked });
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers and control keys
                        if (!/[0-9]/.test(e.key) && 
                            !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const digits = onlyDigits(pastedText);
                        const masked = maskCPFOrCNPJ(digits);
                        setFormData({ ...formData, tax_id: masked });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => {
                        // Remove all non-digits first, then apply mask
                        const digits = onlyDigits(e.target.value);
                        const masked = maskPhone(digits);
                        setFormData({ ...formData, phone: masked });
                      }}
                      onKeyPress={(e) => {
                        // Only allow numbers and control keys
                        if (!/[0-9]/.test(e.key) && 
                            !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const digits = onlyDigits(pastedText);
                        const masked = maskPhone(digits);
                        setFormData({ ...formData, phone: masked });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Clínica ativa
                  </Label>
                </div>
              </TabsContent>
              
              <TabsContent value="license" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="license_key">Chave de Licença</Label>
                    <Input
                      id="license_key"
                      placeholder="Chave única da licença"
                      value={formData.license_key}
                      onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration_date">Data de Expiração</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_users">Máximo de Usuários *</Label>
                    <Input
                      id="max_users"
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="modules" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-${module.value}`}
                        checked={formData.active_modules.includes(module.value)}
                        onCheckedChange={() => toggleModule(module.value)}
                      />
                      <Label
                        htmlFor={`module-${module.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingClinic ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clinic Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Detalhes da Clínica</DialogTitle>
            <DialogDescription>
              Informações completas da clínica {selectedClinic?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedClinic && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="license">Licenciamento</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Nome</Label>
                      <p className="font-medium">{selectedClinic.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Razão Social</Label>
                      <p className="font-medium">{selectedClinic.legal_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">CNPJ/CPF</Label>
                      <p className="font-medium">{selectedClinic.tax_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">E-mail</Label>
                      <p className="font-medium">{selectedClinic.email || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Telefone</Label>
                      <p className="font-medium">{selectedClinic.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Endereço</Label>
                      <p className="font-medium">{selectedClinic.address || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="mt-1">
                        {selectedClinic.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 mr-1 inline" />Inativa
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Criação</Label>
                      <p className="font-medium">
                        {selectedClinic.created_at ? format(parseISO(selectedClinic.created_at), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="license" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Chave de Licença</Label>
                      <p className="font-medium font-mono text-sm">{selectedClinic.license_key || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Expiração</Label>
                      <p className="font-medium">
                        {selectedClinic.expiration_date ? format(parseISO(selectedClinic.expiration_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Máximo de Usuários</Label>
                      <p className="font-medium">{selectedClinic.max_users}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Usuários Ativos</Label>
                      <p className="font-medium">{selectedClinic.user_count || 0}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <Label>Módulos Ativos</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(selectedClinic)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Módulos
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {AVAILABLE_MODULES.map((module) => {
                        const isActive = selectedClinic.active_modules?.includes(module.value) || false;
                        return (
                          <div
                            key={module.value}
                            className={`flex items-center space-x-2 p-2 rounded border ${
                              isActive ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <Checkbox
                              checked={isActive}
                              onCheckedChange={(checked) => {
                                const newModules = checked
                                  ? [...(selectedClinic.active_modules || []), module.value]
                                  : (selectedClinic.active_modules || []).filter(m => m !== module.value);
                                handleUpdateModules(selectedClinic, newModules);
                              }}
                            />
                            <Label className="text-sm font-normal cursor-pointer">
                              {module.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fechar
            </Button>
            {selectedClinic && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowDetailDialog(false);
                  openEditForm(selectedClinic);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Clínica
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setClinicToDelete(null);
          }
        }}
        title="Excluir Clínica"
        description={clinicToDelete ? `Tem certeza que deseja excluir a clínica "${clinicToDelete.name}"? Esta ação não pode ser desfeita.` : ""}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        loading={deleting}
      />

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema. Selecione a clínica para a qual o usuário será criado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinic_id">Clínica *</Label>
              <Select
                value={userFormData.clinic_id.toString()}
                onValueChange={(value) => setUserFormData({ ...userFormData, clinic_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a clínica" />
                </SelectTrigger>
                <SelectContent>
                  {userClinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={userFormData.first_name}
                  onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={userFormData.last_name}
                  onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: any) => setUserFormData({ ...userFormData, role: value })}
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
              resetUserForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={userSaving} className="bg-blue-600 hover:bg-blue-700">
              {userSaving ? (
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

      {/* Edit User Dialog */}
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
                  value={userFormData.first_name}
                  onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Sobrenome</Label>
                <Input
                  id="editLastName"
                  value={userFormData.last_name}
                  onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Função</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: any) => setUserFormData({ ...userFormData, role: value })}
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
            <div>
              <Label htmlFor="editPassword">Senha (opcional)</Label>
              <Input
                id="editPassword"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Deixe em branco para não alterar. Mínimo 8 caracteres"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco se não desejar alterar a senha
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
              resetUserForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={userSaving} className="bg-blue-600 hover:bg-blue-700">
              {userSaving ? (
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

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteUserDialog}
        onOpenChange={setShowDeleteUserDialog}
        title="Excluir Usuário"
        description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteUser}
        variant="destructive"
      />

      {/* Create/Edit License Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? "Editar Licença" : "Criar Nova Licença"}
            </DialogTitle>
            <DialogDescription>
              {editingLicense ? "Atualize os dados da licença" : "Preencha os dados da licença"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLicenseSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="limits">Limites</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Clínica *</Label>
                    <Select
                      value={licenseFormData.tenant_id}
                      onValueChange={(value) => setLicenseFormData({ ...licenseFormData, tenant_id: value })}
                      disabled={!!editingLicense}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenseClinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id.toString()}>
                            {clinic.name} ({clinic.tax_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editingLicense && (
                      <p className="text-xs text-gray-500 mt-1">A clínica não pode ser alterada</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plano *</Label>
                    <Select
                      value={licenseFormData.plan}
                      onValueChange={(value) => setLicenseFormData({ ...licenseFormData, plan: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_PLANS.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>
                            {plan.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_at">Data de Início *</Label>
                    <Input
                      id="start_at"
                      type="date"
                      required
                      value={licenseFormData.start_at}
                      onChange={(e) => setLicenseFormData({ ...licenseFormData, start_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_at">Data de Término *</Label>
                    <Input
                      id="end_at"
                      type="date"
                      required
                      value={licenseFormData.end_at}
                      onChange={(e) => setLicenseFormData({ ...licenseFormData, end_at: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="limits" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="users_limit">Limite de Usuários *</Label>
                    <Input
                      id="users_limit"
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={licenseFormData.users_limit}
                      onChange={(e) => setLicenseFormData({ ...licenseFormData, users_limit: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Número máximo de usuários permitidos</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="units_limit">Limite de Unidades</Label>
                    <Input
                      id="units_limit"
                      type="number"
                      min="1"
                      value={licenseFormData.units_limit}
                      onChange={(e) => setLicenseFormData({ ...licenseFormData, units_limit: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Número máximo de unidades/clínicas (opcional)</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="modules" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`license-module-${module.value}`}
                        checked={licenseFormData.modules.includes(module.value)}
                        onCheckedChange={() => toggleLicenseModule(module.value)}
                      />
                      <Label
                        htmlFor={`license-module-${module.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLicenseDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={licenseSaving}>
                {licenseSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingLicense ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* License Detail Dialog */}
      <Dialog open={showLicenseDetailDialog} onOpenChange={setShowLicenseDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Licença</DialogTitle>
            <DialogDescription>
              Informações completas da licença {selectedLicense?.activation_key.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                  <TabsTrigger value="actions">Ações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Clínica</Label>
                      <p className="font-medium">{getClinicName(selectedLicense.tenant_id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Plano</Label>
                      <p className="font-medium">{getPlanLabel(selectedLicense.plan)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Chave de Ativação</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {selectedLicense.activation_key}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyActivationKey(selectedLicense.activation_key)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="mt-1">{getLicenseStatusBadge(selectedLicense)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Limite de Usuários</Label>
                      <p className="font-medium">{selectedLicense.users_limit}</p>
                    </div>
                    {selectedLicense.units_limit && (
                      <div>
                        <Label className="text-sm text-gray-500">Limite de Unidades</Label>
                        <p className="font-medium">{selectedLicense.units_limit}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-500">Data de Início</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.start_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Data de Término</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.end_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    {!selectedLicense.is_expired && (
                      <div>
                        <Label className="text-sm text-gray-500">Dias Restantes</Label>
                        <p className="font-medium">{selectedLicense.days_until_expiry} dias</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-500">Data de Criação</Label>
                      <p className="font-medium">
                        {format(parseISO(selectedLicense.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="modules" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_MODULES.map((module) => {
                      const isActive = selectedLicense.modules?.includes(module.value) || false;
                      return (
                        <div
                          key={module.value}
                          className={`flex items-center space-x-2 p-2 rounded border ${
                            isActive ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <Checkbox
                            checked={isActive}
                            disabled
                          />
                          <Label className="text-sm font-normal">
                            {module.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Alterar Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LICENSE_STATUSES.map((status) => (
                          <Button
                            key={status.value}
                            variant={selectedLicense.status === status.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateLicenseStatus(selectedLicense, status.value)}
                            disabled={selectedLicense.status === status.value || selectedLicense.status === "cancelled"}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Alterar o status da licença pode afetar o acesso da clínica ao sistema.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLicenseDetailDialog(false)}>
              Fechar
            </Button>
            {selectedLicense && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowLicenseDetailDialog(false);
                  openLicenseEditForm(selectedLicense);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Licença
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete License Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteLicenseDialog}
        onOpenChange={setShowDeleteLicenseDialog}
        title="Cancelar Licença"
        description={licenseToDelete ? `Tem certeza que deseja cancelar a licença ${licenseToDelete.activation_key}? Esta ação não pode ser desfeita.` : ""}
        confirmText="Cancelar Licença"
        cancelText="Manter Licença"
        variant="destructive"
        loading={licenseDeleting}
        onConfirm={confirmDeleteLicense}
      />
    </div>
  );
}
