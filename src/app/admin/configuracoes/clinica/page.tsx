"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Save, Upload, Image as ImageIcon, RefreshCw, Shield, CheckCircle2, XCircle, Calendar, Users, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { maskCPFOrCNPJ, onlyDigits } from "@/lib/inputMasks";

interface ClinicData {
  id: number;
  name: string;
  legal_name: string;
  tax_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  license_key: string | null;
  expiration_date: string | null;
  max_users: number;
  active_modules: string[];
  created_at: string;
  updated_at: string | null;
}

const AVAILABLE_MODULES = [
  { id: "patients", label: "Pacientes", description: "Gestão de pacientes" },
  { id: "appointments", label: "Agendamentos", description: "Agendamento de consultas" },
  { id: "clinical", label: "Prontuário Clínico", description: "Registros clínicos e prontuários" },
  { id: "financial", label: "Financeiro", description: "Gestão financeira e faturamento" },
  { id: "stock", label: "Estoque", description: "Gestão de estoque e insumos" },
  { id: "procedures", label: "Procedimentos", description: "Gestão de procedimentos" },
  { id: "bi", label: "Business Intelligence", description: "Relatórios e análises" },
  { id: "telemed", label: "Telemedicina", description: "Consultas remotas" },
  { id: "tiss", label: "TISS", description: "Integração TISS" },
  { id: "mobile", label: "Mobile", description: "Acesso mobile" },
];

const MODULE_DEPENDENCIES: Record<string, string[]> = {
  bi: ["financial", "clinical", "appointments"],
  telemed: ["appointments", "clinical"],
  stock: ["financial"],
  financial: ["appointments"],
  clinical: ["appointments"],
  procedures: ["financial", "stock"],
  tiss: ["financial", "clinical"],
  mobile: ["appointments", "clinical", "patients"],
};

export default function ClinicaConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    logo: null as File | null,
  });
  const [licenseData, setLicenseData] = useState({
    license_key: "",
    expiration_date: "",
    max_users: 10,
    active_modules: [] as string[],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  // Check if user is SuperAdmin (can edit license info)
  const isSuperAdmin = user?.role === 'admin' && (user?.role_id === 1 || user?.role_name === 'SuperAdmin');

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      setLoadingData(true);
      const data = await api.get<ClinicData>("/api/v1/admin/clinics/me");
      
      setClinicData(data);
      // Apply mask to tax_id when loading data
      const maskedTaxId = data.tax_id ? maskCPFOrCNPJ(data.tax_id) : "";
      setFormData({
        name: data.name || "",
        legal_name: data.legal_name || "",
        tax_id: maskedTaxId,
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        is_active: data.is_active ?? true,
        logo: null,
      });
      setLicenseData({
        license_key: data.license_key || "",
        expiration_date: data.expiration_date || "",
        max_users: data.max_users || 10,
        active_modules: data.active_modules || [],
      });
      setOriginalData({
        ...data,
        formData: { ...formData },
        licenseData: { ...licenseData },
      });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to load clinic data:", error);
      toast.error("Erro ao carregar dados da clínica", {
        description: error?.message || error?.detail || "Não foi possível carregar as informações da clínica",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply CPF/CNPJ mask for tax_id field
    if (name === 'tax_id') {
      const digits = onlyDigits(value);
      const masked = maskCPFOrCNPJ(digits);
      setFormData(prev => ({ ...prev, [name]: masked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setHasChanges(true);
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
    setHasChanges(true);
  };

  const handleLicenseChange = (field: string, value: any) => {
    // Prevent changes if not SuperAdmin
    if (!isSuperAdmin) {
      toast.warning("Apenas Super Administradores podem editar informações de licenciamento");
      return;
    }
    setLicenseData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    // Prevent changes if not SuperAdmin - double check for security
    if (!isSuperAdmin || !user || user.role !== 'admin' || (user.role_id !== 1 && user.role_name !== 'SuperAdmin')) {
      toast.warning("Apenas Super Administradores podem gerenciar módulos", {
        description: "Você não tem permissão para modificar os módulos ativos da clínica."
      });
      return;
    }
    
    setLicenseData(prev => {
      let newModules = [...prev.active_modules];
      
      if (checked) {
        // Add module and its dependencies
        if (!newModules.includes(moduleId)) {
          newModules.push(moduleId);
        }
        // Add dependencies
        const deps = MODULE_DEPENDENCIES[moduleId] || [];
        deps.forEach(dep => {
          if (!newModules.includes(dep)) {
            newModules.push(dep);
          }
        });
      } else {
        // Remove module
        newModules = newModules.filter(m => m !== moduleId);
        // Remove modules that depend on this one
        Object.entries(MODULE_DEPENDENCIES).forEach(([mod, deps]) => {
          if (deps.includes(moduleId) && newModules.includes(mod)) {
            newModules = newModules.filter(m => m !== mod);
          }
        });
      }
      
      return { ...prev, active_modules: newModules };
    });
    setHasChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Apenas arquivos de imagem são permitidos");
        return;
      }
      setFormData(prev => ({ ...prev, logo: file }));
      setHasChanges(true);
      toast.success("Logo selecionado com sucesso");
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("O nome da clínica é obrigatório");
      return false;
    }
    if (!formData.legal_name.trim()) {
      toast.error("A razão social é obrigatória");
      return false;
    }
    if (!formData.tax_id.trim()) {
      toast.error("O CNPJ é obrigatório");
      return false;
    }
    if (!formData.address?.trim()) {
      toast.error("O endereço é obrigatório");
      return false;
    }
    if (!formData.phone?.trim()) {
      toast.error("O telefone é obrigatório");
      return false;
    }
    if (!formData.email?.trim()) {
      toast.error("O e-mail é obrigatório");
      return false;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("E-mail inválido");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Update basic clinic information
      // Remove mask from tax_id before sending to backend (send only digits)
      const updateData = {
        name: formData.name,
        legal_name: formData.legal_name,
        tax_id: onlyDigits(formData.tax_id), // Send only digits to backend
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: formData.is_active,
      };

      await api.put<ClinicData>("/api/v1/admin/clinics/me", updateData);
      
      // Update license information ONLY if user is SuperAdmin
      // Double check to prevent unauthorized access
      const isActuallySuperAdmin = user?.role === 'admin' && (user?.role_id === 1 || user?.role_name === 'SuperAdmin');
      if (isActuallySuperAdmin && clinicData) {
        try {
          // Update modules separately
          if (JSON.stringify(licenseData.active_modules.sort()) !== JSON.stringify((clinicData.active_modules || []).sort())) {
            await api.patch("/api/v1/admin/clinics/me/modules", { active_modules: licenseData.active_modules });
          }
          
          // Update license info (license_key, expiration_date, max_users)
          const hasLicenseChanges = 
            licenseData.license_key !== (clinicData.license_key || "") ||
            licenseData.expiration_date !== (clinicData.expiration_date || "") ||
            licenseData.max_users !== clinicData.max_users;
          
          if (hasLicenseChanges) {
            const licenseUpdateData: any = {};
            
            if (licenseData.license_key !== (clinicData.license_key || "")) {
              licenseUpdateData.license_key = licenseData.license_key || null;
            }
            
            if (licenseData.expiration_date !== (clinicData.expiration_date || "")) {
              licenseUpdateData.expiration_date = licenseData.expiration_date || null;
            }
            
            if (licenseData.max_users !== clinicData.max_users) {
              licenseUpdateData.max_users = licenseData.max_users;
            }
            
            // Use the clinic_id endpoint for license updates (SuperAdmin only)
            if (Object.keys(licenseUpdateData).length > 0) {
              await api.patch(`/api/v1/admin/clinics/${clinicData.id}/license`, licenseUpdateData);
            }
          }
        } catch (licenseError: any) {
          console.error("Failed to update license:", licenseError);
          // Don't fail the whole operation if license update fails
          toast.warning("Informações básicas salvas, mas houve um erro ao atualizar a licença", {
            description: licenseError?.message || licenseError?.detail,
          });
        }
      }
      
      // TODO: Upload logo separately if needed
      // if (formData.logo) {
      //   // Upload logo via separate endpoint
      // }
      
      toast.success("Configurações da clínica salvas com sucesso!");
      
      // Reload data to get updated information
      await loadClinicData();
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to save clinic data:", error);
      toast.error("Erro ao salvar configurações", {
        description: error?.message || error?.detail || "Não foi possível salvar as configurações da clínica",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (clinicData) {
      // Apply mask to tax_id when canceling
      const maskedTaxId = clinicData.tax_id ? maskCPFOrCNPJ(clinicData.tax_id) : "";
      setFormData({
        name: clinicData.name || "",
        legal_name: clinicData.legal_name || "",
        tax_id: maskedTaxId,
        address: clinicData.address || "",
        phone: clinicData.phone || "",
        email: clinicData.email || "",
        is_active: clinicData.is_active ?? true,
        logo: null,
      });
      setLicenseData({
        license_key: clinicData.license_key || "",
        expiration_date: clinicData.expiration_date || "",
        max_users: clinicData.max_users || 10,
        active_modules: clinicData.active_modules || [],
      });
      setFormData(prev => ({ ...prev, logo: null }));
      setHasChanges(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isLicenseExpired = (): boolean => {
    if (!clinicData?.expiration_date) return false;
    try {
      const expDate = new Date(clinicData.expiration_date);
      return expDate < new Date();
    } catch {
      return false;
    }
  };

  const isLicenseExpiringSoon = (): boolean => {
    if (!clinicData?.expiration_date) return false;
    try {
      const expDate = new Date(clinicData.expiration_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    } catch {
      return false;
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!clinicData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Não foi possível carregar os dados da clínica</p>
            <Button onClick={loadClinicData} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-blue-600" />
            Configurações da Clínica
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as informações básicas e configurações da sua clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-700 border-2 border-orange-500 bg-orange-50 px-4 py-2 shadow-md hover:shadow-lg transition-shadow font-semibold">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              Alterações não salvas
            </Badge>
          )}
          <button
            onClick={loadClinicData}
            disabled={loadingData || loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
            <CardTitle className="text-2xl font-bold text-gray-900">Informações Básicas</CardTitle>
            <CardDescription className="text-gray-600 font-medium">
              Dados principais da clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Logo Upload - First Field */}
            <div className="space-y-2 pb-6 border-b-2 border-gray-200">
              <Label htmlFor="logo" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Logo da Clínica
              </Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={loading}
                />
                <Label
                  htmlFor="logo"
                  className={`cursor-pointer flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 shadow-sm hover:shadow-md font-semibold text-gray-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="h-5 w-5" />
                  Selecionar Logo
                </Label>
                {formData.logo && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">{formData.logo.name}</span>
                    <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50">
                      Arquivo selecionado
                    </Badge>
                  </div>
                )}
              </div>
              {formData.logo && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Preview do Logo"
                    className="max-w-xs h-32 object-contain border-2 border-gray-300 rounded-xl p-3 shadow-sm"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Faça upload do logo da clínica (máximo 5MB). Formatos aceitos: JPG, PNG, GIF, WebP.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Nome da Clínica <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Clínica São Paulo"
                  required
                  className="mt-1 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legal_name"
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleInputChange}
                  placeholder="Ex: Clínica São Paulo Ltda"
                  required
                  className="mt-1 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                CNPJ/CPF <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                required
                className="mt-1 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md font-mono"
                disabled={loading}
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
                  setFormData(prev => ({ ...prev, tax_id: masked }));
                  setHasChanges(true);
                }}
                maxLength={18} // CNPJ max length with mask
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Endereço Completo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                required
                className="mt-1 min-h-[100px] border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md resize-y"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(00) 0000-0000"
                  required
                  className="mt-1 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@clinica.com"
                  required
                  className="mt-1 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                  disabled={loading}
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold text-gray-700">
                  Clínica Ativa
                </Label>
              </div>
              {formData.is_active ? (
                <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50 px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  <span className="font-semibold">Ativa</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-700 border-red-500 bg-red-50 px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <XCircle className="h-4 w-4 mr-1.5" />
                  <span className="font-semibold">Inativa</span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
          !isSuperAdmin ? 'border-gray-300 bg-gray-50/50' : 'border-gray-200'
        }`}>
          <CardHeader className={`border-b-2 ${
            !isSuperAdmin 
              ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300' 
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Shield className={`h-6 w-6 ${!isSuperAdmin ? 'text-gray-500' : 'text-indigo-600'}`} />
                  Informações de Licenciamento
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium mt-1">
                  {isSuperAdmin 
                    ? "Gerencie as informações de licenciamento da clínica"
                    : "Informações de licenciamento (somente leitura - apenas Super Administradores podem editar)"}
                </CardDescription>
              </div>
              {!isSuperAdmin && (
                <Badge variant="outline" className="text-gray-600 border-gray-400 bg-white px-3 py-1.5 shadow-sm">
                  <Shield className="h-4 w-4 mr-1.5" />
                  Somente Leitura
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {isLicenseExpired() && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg text-red-900 mb-1">Licença Expirada</p>
                  <p className="text-sm text-red-800">
                    A licença expirou em <span className="font-semibold">{formatDate(clinicData.expiration_date)}</span>. Entre em contato para renovar.
                  </p>
                </div>
              </div>
            )}
            
            {isLicenseExpiringSoon() && !isLicenseExpired() && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-5 flex items-start gap-4 shadow-md hover:shadow-lg transition-shadow">
                <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg text-orange-900 mb-1">Licença Expirando em Breve</p>
                  <p className="text-sm text-orange-800">
                    A licença expira em <span className="font-semibold">{formatDate(clinicData.expiration_date)}</span>. Considere renovar.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license_key" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Chave de Licença
                  {!isSuperAdmin && (
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 bg-gray-50">
                      Somente Leitura
                    </Badge>
                  )}
                </Label>
                <Input
                  id="license_key"
                  value={licenseData.license_key || "N/A"}
                  onChange={(e) => handleLicenseChange("license_key", e.target.value)}
                  placeholder="Chave de licença"
                  readOnly={!isSuperAdmin}
                  className={`mt-1 h-12 border-2 transition-all duration-200 shadow-sm font-mono ${
                    !isSuperAdmin 
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 hover:shadow-md'
                  }`}
                  disabled={loading || !isSuperAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Data de Expiração
                  {!isSuperAdmin && (
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 bg-gray-50">
                      Somente Leitura
                    </Badge>
                  )}
                </Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={licenseData.expiration_date || ""}
                  onChange={(e) => handleLicenseChange("expiration_date", e.target.value)}
                  readOnly={!isSuperAdmin}
                  className={`mt-1 h-12 border-2 transition-all duration-200 shadow-sm ${
                    !isSuperAdmin 
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 hover:shadow-md'
                  }`}
                  disabled={loading || !isSuperAdmin}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="h-5 w-5 text-indigo-600" />
                Máximo de Usuários
                {!isSuperAdmin && (
                  <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 bg-gray-50 ml-auto">
                    Somente Leitura
                  </Badge>
                )}
              </Label>
              <Input
                id="max_users"
                type="number"
                min="1"
                max="1000"
                value={licenseData.max_users}
                onChange={(e) => handleLicenseChange("max_users", parseInt(e.target.value) || 10)}
                readOnly={!isSuperAdmin}
                className={`mt-1 h-12 border-2 transition-all duration-200 shadow-sm ${
                  !isSuperAdmin 
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 hover:shadow-md'
                }`}
                disabled={loading || !isSuperAdmin}
              />
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Número máximo de usuários permitidos para esta clínica
              </p>
            </div>

            {/* Read-only information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-gray-500">Data de Criação</Label>
                <p className="text-sm font-medium mt-1">{formatDate(clinicData.created_at)}</p>
              </div>
              <div>
                <Label className="text-gray-500">Última Atualização</Label>
                <p className="text-sm font-medium mt-1">
                  {clinicData.updated_at ? formatDate(clinicData.updated_at) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Management */}
        <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
          !isSuperAdmin ? 'border-gray-300 bg-gray-50/50' : 'border-gray-200'
        }`}>
          <CardHeader className={`border-b-2 ${
            !isSuperAdmin 
              ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300' 
              : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Package className={`h-6 w-6 ${!isSuperAdmin ? 'text-gray-500' : 'text-purple-600'}`} />
                  Módulos Ativos
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium mt-1">
                  {isSuperAdmin 
                    ? "Gerencie os módulos disponíveis para a clínica"
                    : "Módulos ativos da clínica (somente leitura - apenas Super Administradores podem editar)"}
                </CardDescription>
              </div>
              {!isSuperAdmin && (
                <Badge variant="outline" className="text-gray-600 border-gray-400 bg-white px-3 py-1.5 shadow-sm">
                  <Package className="h-4 w-4 mr-1.5" />
                  Somente Leitura
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {!isSuperAdmin && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Apenas Super Administradores podem gerenciar os módulos ativos da clínica.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_MODULES.map((module) => {
                const isChecked = licenseData.active_modules.includes(module.id);
                const dependencies = MODULE_DEPENDENCIES[module.id] || [];
                const hasDependencies = dependencies.length > 0;
                
                return (
                  <div
                    key={module.id}
                    className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                      !isSuperAdmin 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-90' 
                        : isChecked 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg' 
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {isSuperAdmin ? (
                        <Checkbox
                          id={`module-${module.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                          disabled={loading}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded bg-gray-100">
                          {isChecked && (
                            <CheckCircle2 className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label
                            htmlFor={isSuperAdmin ? `module-${module.id}` : undefined}
                            className={`font-medium ${isSuperAdmin ? 'cursor-pointer' : 'cursor-default text-gray-700'}`}
                          >
                            {module.label}
                          </Label>
                          {isChecked && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                isSuperAdmin 
                                  ? 'text-blue-600 border-blue-400 bg-blue-50' 
                                  : 'text-gray-600 border-gray-400 bg-gray-100'
                              }`}
                            >
                              {isSuperAdmin ? 'Ativo' : 'Ativado'}
                            </Badge>
                          )}
                          {!isSuperAdmin && (
                            <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 bg-gray-50">
                              Somente Leitura
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${!isSuperAdmin ? 'text-gray-500' : 'text-gray-600'}`}>
                          {module.description}
                        </p>
                        {hasDependencies && (
                          <p className="text-xs text-gray-400 mt-2">
                            Depende de: {dependencies.map(d => AVAILABLE_MODULES.find(m => m.id === d)?.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {licenseData.active_modules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">Nenhum módulo ativo</p>
                {!isSuperAdmin && (
                  <p className="text-sm text-gray-400 mt-2">
                    Entre em contato com o Super Administrador para ativar módulos
                  </p>
                )}
              </div>
            )}
            
            {!isSuperAdmin && licenseData.active_modules.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Você está visualizando os módulos ativos. Para modificar esta configuração, entre em contato com o Super Administrador do sistema.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading || !hasChanges}
            className="h-12 px-8 border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !hasChanges} 
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <>
                <Save className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
