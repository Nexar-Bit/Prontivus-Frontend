"use client";

import React, { useState, useEffect } from "react";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getUserSettings, updateUserSettings, updateUserProfile } from "@/lib/settings-api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  MapPin,
  Heart,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  X,
  Calendar,
  Users,
  Lock,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    appointmentReminders: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: "public" | "private" | "contacts";
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  // Patient profile form state
  const [profileForm, setProfileForm] = useState<Partial<PatientProfile>>({});
  
  // User settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<UserSettings>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patient, settings] = await Promise.all([
        api.get<PatientProfile>("/api/patients/me"),
        getUserSettings().catch(() => null),
      ]);
      
      setPatientProfile(patient);
      setProfileForm(patient);
      
      if (settings) {
        setUserSettings(settings);
        setSettingsForm(settings);
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar dados", {
        description: error.message || "Não foi possível carregar suas configurações",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof PatientProfile, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingsChange = (section: keyof UserSettings, field: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const saveProfile = async () => {
    if (!patientProfile) return;
    
    try {
      setSaving(true);
      
      // Prepare update data - convert date string to date if needed
      const updateData = { ...profileForm };
      if (updateData.date_of_birth && typeof updateData.date_of_birth === 'string') {
        // Keep as string, backend will parse it
      }
      
      // Update patient profile
      const updated = await api.put<PatientProfile>("/api/patients/me", updateData);
      setPatientProfile(updated);
      setProfileForm(updated);
      
      // Update user profile (name, email, phone) if changed
      if (updateData.first_name || updateData.last_name || updateData.email || updateData.phone) {
        await updateUserProfile({
          firstName: updateData.first_name,
          lastName: updateData.last_name,
          email: updateData.email,
          phone: updateData.phone,
        });
      }
      
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error("Erro ao salvar perfil", {
        description: error.message || "Não foi possível atualizar seu perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!userSettings) return;
    
    try {
      setSaving(true);
      
      // Update user settings
      await updateUserSettings({
        phone: settingsForm.profile?.phone,
        notifications: settingsForm.notifications,
        privacy: settingsForm.privacy,
        appearance: settingsForm.appearance,
        security: settingsForm.security,
      });
      
      // Update profile if name/email changed
      if (settingsForm.profile?.firstName || settingsForm.profile?.lastName || settingsForm.profile?.email) {
        await updateUserProfile({
          firstName: settingsForm.profile.firstName,
          lastName: settingsForm.profile.lastName,
          email: settingsForm.profile.email,
          phone: settingsForm.profile.phone,
        });
      }
      
      await loadData(); // Reload to get updated data
      toast.success("Configurações salvas com sucesso");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toast.error("Erro ao salvar configurações", {
        description: error.message || "Não foi possível salvar suas configurações",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetProfile = () => {
    setProfileForm(patientProfile || {});
  };

  const resetSettings = () => {
    setSettingsForm(userSettings || {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 overflow-y-auto patient-content-scroll w-full">
          <div className="px-4 lg:px-5 py-4 lg:py-6 pb-20 lg:pb-6">
          {/* Modern Header */}
          <div className="mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Settings className="h-7 w-7 text-white" />
              </div>
              Configurações
            </h1>
            <p className="text-gray-600 text-sm lg:text-base font-medium mt-2">Gerencie suas informações pessoais e preferências</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                Privacidade
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Palette className="h-4 w-4 mr-2" />
                Preferências
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5" />
                    </div>
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nome</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name || ""}
                        onChange={(e) => handleProfileChange("first_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name || ""}
                        onChange={(e) => handleProfileChange("last_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email || ""}
                        onChange={(e) => handleProfileChange("email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone || ""}
                        onChange={(e) => handleProfileChange("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={profileForm.cpf || ""}
                        onChange={(e) => handleProfileChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={profileForm.date_of_birth 
                          ? (typeof profileForm.date_of_birth === 'string'
                              ? (profileForm.date_of_birth.includes('T') 
                                  ? format(parseISO(profileForm.date_of_birth), "yyyy-MM-dd")
                                  : profileForm.date_of_birth)
                              : format(new Date(profileForm.date_of_birth), "yyyy-MM-dd"))
                          : ""}
                        onChange={(e) => handleProfileChange("date_of_birth", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={profileForm.gender || ""}
                        onValueChange={(value) => handleProfileChange("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
                      <Select
                        value={profileForm.blood_type || ""}
                        onValueChange={(value) => handleProfileChange("blood_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={profileForm.address || ""}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                      <Phone className="h-5 w-5" />
                    </div>
                    Contato de Emergência
                  </CardTitle>
                  <CardDescription>Informações de contato para emergências</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Nome do Contato</Label>
                      <Input
                        id="emergency_contact_name"
                        value={profileForm.emergency_contact_name || ""}
                        onChange={(e) => handleProfileChange("emergency_contact_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Telefone do Contato</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={profileForm.emergency_contact_phone || ""}
                        onChange={(e) => handleProfileChange("emergency_contact_phone", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="emergency_contact_relationship">Relacionamento</Label>
                      <Input
                        id="emergency_contact_relationship"
                        value={profileForm.emergency_contact_relationship || ""}
                        onChange={(e) => handleProfileChange("emergency_contact_relationship", e.target.value)}
                        placeholder="Ex: Pai, Mãe, Cônjuge, etc."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Heart className="h-5 w-5" />
                    </div>
                    Informações Médicas
                  </CardTitle>
                  <CardDescription>Informações importantes sobre sua saúde</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={profileForm.allergies || ""}
                      onChange={(e) => handleProfileChange("allergies", e.target.value)}
                      placeholder="Liste suas alergias conhecidas"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="active_problems">Problemas de Saúde Ativos</Label>
                    <Textarea
                      id="active_problems"
                      value={profileForm.active_problems || ""}
                      onChange={(e) => handleProfileChange("active_problems", e.target.value)}
                      placeholder="Condições médicas atuais ou crônicas"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={profileForm.notes || ""}
                      onChange={(e) => handleProfileChange("notes", e.target.value)}
                      placeholder="Outras informações relevantes"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetProfile} className="border-gray-300">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Perfil"}
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Bell className="h-5 w-5" />
                    </div>
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>Escolha como deseja receber notificações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">Receba notificações importantes por email</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.email ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "email", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.push ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "push", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="space-y-0.5">
                      <Label>Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">Receba notificações por mensagem de texto</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.sms ?? false}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "sms", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                    <div className="space-y-0.5">
                      <Label>Lembretes de Consulta</Label>
                      <p className="text-sm text-muted-foreground">Receba lembretes sobre suas consultas</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.appointmentReminders ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "appointmentReminders", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                    <div className="space-y-0.5">
                      <Label>Atualizações do Sistema</Label>
                      <p className="text-sm text-muted-foreground">Receba informações sobre atualizações e manutenções</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.systemUpdates ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "systemUpdates", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50/50 border border-orange-100">
                    <div className="space-y-0.5">
                      <Label>Comunicações de Marketing</Label>
                      <p className="text-sm text-muted-foreground">Receba ofertas e informações promocionais</p>
                    </div>
                    <Switch
                      checked={settingsForm.notifications?.marketing ?? false}
                      onCheckedChange={(checked) => handleSettingsChange("notifications", "marketing", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetSettings} className="border-gray-300">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                      <Shield className="h-5 w-5" />
                    </div>
                    Configurações de Privacidade
                  </CardTitle>
                  <CardDescription>Controle quem pode ver suas informações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                    <Label htmlFor="profileVisibility">Visibilidade do Perfil</Label>
                    <Select
                      value={settingsForm.privacy?.profileVisibility || "contacts"}
                      onValueChange={(value) => handleSettingsChange("privacy", "profileVisibility", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="contacts">Apenas Contatos</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Controle quem pode ver seu perfil
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                    <div className="space-y-0.5">
                      <Label>Mostrar Status Online</Label>
                      <p className="text-sm text-muted-foreground">Permitir que outros vejam quando você está online</p>
                    </div>
                    <Switch
                      checked={settingsForm.privacy?.showOnlineStatus ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("privacy", "showOnlineStatus", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-teal-50/50 border border-teal-100">
                    <div className="space-y-0.5">
                      <Label>Permitir Mensagens Diretas</Label>
                      <p className="text-sm text-muted-foreground">Permitir que provedores enviem mensagens diretas</p>
                    </div>
                    <Switch
                      checked={settingsForm.privacy?.allowDirectMessages ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("privacy", "allowDirectMessages", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50/50 border border-orange-100">
                    <div className="space-y-0.5">
                      <Label>Compartilhamento de Dados</Label>
                      <p className="text-sm text-muted-foreground">Permitir compartilhamento anonimizado de dados para pesquisa</p>
                    </div>
                    <Switch
                      checked={settingsForm.privacy?.dataSharing ?? false}
                      onCheckedChange={(checked) => handleSettingsChange("privacy", "dataSharing", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetSettings} className="border-gray-300">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="border-l-4 border-l-purple-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-600 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Palette className="h-5 w-5" />
                    </div>
                    Aparência e Preferências
                  </CardTitle>
                  <CardDescription>Personalize a aparência e comportamento do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={settingsForm.appearance?.theme || "system"}
                      onValueChange={(value) => handleSettingsChange("appearance", "theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="h-4 w-4 mr-2" />
                            Claro
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="h-4 w-4 mr-2" />
                            Escuro
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Monitor className="h-4 w-4 mr-2" />
                            Sistema
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={settingsForm.appearance?.language || "pt-BR"}
                      onValueChange={(value) => handleSettingsChange("appearance", "language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select
                      value={settingsForm.appearance?.timezone || "America/Sao_Paulo"}
                      onValueChange={(value) => handleSettingsChange("appearance", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFormat">Formato de Data</Label>
                    <Select
                      value={settingsForm.appearance?.dateFormat || "DD/MM/YYYY"}
                      onValueChange={(value) => handleSettingsChange("appearance", "dateFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Lock className="h-5 w-5" />
                    </div>
                    Segurança
                  </CardTitle>
                  <CardDescription>Configurações de segurança da conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50/50 border border-green-100">
                    <div className="space-y-0.5">
                      <Label>Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                    </div>
                    <Switch
                      checked={settingsForm.security?.twoFactorAuth ?? false}
                      onCheckedChange={(checked) => handleSettingsChange("security", "twoFactorAuth", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50/50 border border-green-100">
                    <div className="space-y-0.5">
                      <Label>Alertas de Login</Label>
                      <p className="text-sm text-muted-foreground">Receba notificações quando houver novo login</p>
                    </div>
                    <Switch
                      checked={settingsForm.security?.loginAlerts ?? true}
                      onCheckedChange={(checked) => handleSettingsChange("security", "loginAlerts", checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Tempo de Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="480"
                      value={settingsForm.security?.sessionTimeout || 30}
                      onChange={(e) => handleSettingsChange("security", "sessionTimeout", parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo até a sessão expirar automaticamente
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      min="30"
                      max="365"
                      value={settingsForm.security?.passwordExpiry || 90}
                      onChange={(e) => handleSettingsChange("security", "passwordExpiry", parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Dias até exigir troca de senha
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetSettings} className="border-gray-300">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={saveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

