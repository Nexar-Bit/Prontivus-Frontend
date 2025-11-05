"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getUserSettings, updateUserSettings, updateUserProfile, type UserSettings as ApiUserSettings } from "@/lib/settings-api";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Monitor
} from "lucide-react";

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
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
    profileVisibility: 'public' | 'private' | 'contacts';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
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

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      appointmentReminders: true,
      systemUpdates: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'contacts',
      showOnlineStatus: true,
      allowDirectMessages: true,
      dataSharing: false,
    },
    appearance: {
      theme: 'system',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getUserSettings();
      setSettings(response);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Update profile first (name, email, phone)
      await updateUserProfile({
        firstName: settings.profile.firstName,
        lastName: settings.profile.lastName,
        email: settings.profile.email,
        phone: settings.profile.phone,
      });
      
      // Then update other settings
      await updateUserSettings({
        phone: settings.profile.phone,
        notifications: settings.notifications,
        privacy: settings.privacy,
        appearance: settings.appearance,
        security: settings.security,
      });
      
      toast.success("Configurações salvas com sucesso");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Falha ao salvar configurações";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas configurações e preferências da conta
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e dados de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={settings.profile.firstName}
                    onChange={(e) => handleSettingChange('profile', 'firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={settings.profile.lastName}
                    onChange={(e) => handleSettingChange('profile', 'lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone}
                    onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificações
              </CardTitle>
              <CardDescription>
                Escolha como deseja ser notificado sobre diferentes atividades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canais de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="emailNotifications">Notificações por E-mail</Label>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <Label htmlFor="pushNotifications">Notificações Push</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="smsNotifications">Notificações SMS</Label>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'sms', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointmentReminders">Lembretes de Consultas</Label>
                    <Switch
                      id="appointmentReminders"
                      checked={settings.notifications.appointmentReminders}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'appointmentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemUpdates">Atualizações do Sistema</Label>
                    <Switch
                      id="systemUpdates"
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'systemUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketingNotifications">Notificações de Marketing</Label>
                    <Switch
                      id="marketingNotifications"
                      checked={settings.notifications.marketing}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'marketing', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade e Dados
              </CardTitle>
              <CardDescription>
                Controle suas configurações de privacidade e preferências de compartilhamento de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profileVisibility">Visibilidade do Perfil</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => handleSettingChange('privacy', 'profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="contacts">Apenas Contatos</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showOnlineStatus">Mostrar Status Online</Label>
                    <Switch
                      id="showOnlineStatus"
                      checked={settings.privacy.showOnlineStatus}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'showOnlineStatus', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowDirectMessages">Permitir Mensagens Diretas</Label>
                    <Switch
                      id="allowDirectMessages"
                      checked={settings.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'allowDirectMessages', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dataSharing">Permitir Compartilhamento de Dados</Label>
                    <Switch
                      id="dataSharing"
                      checked={settings.privacy.dataSharing}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'dataSharing', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência e Idioma
              </CardTitle>
              <CardDescription>
                Personalize a aparência e o idioma da sua interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value) => handleSettingChange('appearance', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Escuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={settings.appearance.language}
                    onValueChange={(value) => handleSettingChange('appearance', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={settings.appearance.timezone}
                    onValueChange={(value) => handleSettingChange('appearance', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select
                    value={settings.appearance.dateFormat}
                    onValueChange={(value) => handleSettingChange('appearance', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança e Autenticação
              </CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança e autenticação da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="loginAlerts">Alertas de Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja notificado quando alguém fizer login na sua conta
                    </p>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={settings.security.loginAlerts}
                    onCheckedChange={(checked) => handleSettingChange('security', 'loginAlerts', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">Tempo Limite de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                
                <div>
                  <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
