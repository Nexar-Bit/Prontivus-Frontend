"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getUserSettings, updateUserSettings, updateUserProfile, changePassword, type UserSettings as ApiUserSettings } from "@/lib/settings-api";
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
  Monitor,
  CheckCircle2,
  Clock,
  Lock,
  Key,
  AlertCircle,
  Loader2,
  RefreshCw,
  Upload,
  X,
  Image as ImageIcon,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { setTheme: setCurrentTheme } = useTheme();
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    qrImage: string | null;
    secret: string | null;
    verifying: boolean;
    verificationCode: string;
  }>({
    qrImage: null,
    secret: null,
    verifying: false,
    verificationCode: '',
  });
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

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
      
      // Sync theme with ThemeContext if available
      if (response.appearance.theme && setCurrentTheme) {
        setCurrentTheme(response.appearance.theme as 'light' | 'dark' | 'system');
      }
      
      // Load avatar preview if exists
      if (response.profile.avatar) {
        // Construct full URL if needed
        let avatarUrl = response.profile.avatar;
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          avatarUrl = `${base}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
        }
        setAvatarPreview(avatarUrl);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('prontivus_access_token') || localStorage.getItem('clinicore_access_token') : null;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${base}/api/settings/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer upload do avatar');
      }

      const data = await response.json();
      // Construct full URL if needed
      let avatarUrl = data.avatar_url || data.avatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        avatarUrl = `${base}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
      }
      
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: avatarUrl
        }
      }));
      setAvatarPreview(avatarUrl);
      toast.success('Avatar atualizado com sucesso');
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.message || 'Erro ao fazer upload do avatar');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('prontivus_access_token') || localStorage.getItem('clinicore_access_token') : null;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${base}/api/settings/me/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover avatar');
      }

      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: undefined
        }
      }));
      setAvatarPreview(null);
      toast.success('Avatar removido com sucesso');
    } catch (error: any) {
      console.error('Failed to remove avatar:', error);
      toast.error(error.message || 'Erro ao remover avatar');
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!settings.profile.firstName.trim()) {
      errors.firstName = 'Nome é obrigatório';
    }
    
    if (!settings.profile.lastName.trim()) {
      errors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!settings.profile.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.profile.email)) {
      errors.email = 'E-mail inválido';
    }
    
    if (settings.profile.phone && !/^[\d\s\(\)\-\+]+$/.test(settings.profile.phone)) {
      errors.phone = 'Telefone inválido';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Only validate if user is trying to change password (at least one field is filled)
    const isChangingPassword = passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword;
    
    if (!isChangingPassword) {
      // No password change attempted, validation passes
      setPasswordErrors({});
      return true;
    }
    
    // If any field is filled, all fields are required
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'A senha deve ter pelo menos 8 caracteres';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSettings = async () => {
    if (!validateProfile()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

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
      
      // Refresh user data in auth context
      if (refreshUser) {
        await refreshUser();
      }
      // Also reload settings to get updated data
      await loadSettings();
      
      toast.success("Configurações salvas com sucesso");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Falha ao salvar configurações";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Check if user is actually trying to change password
    const isChangingPassword = passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmPassword;
    
    if (!isChangingPassword) {
      // No password change attempted, just clear the form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      return;
    }
    
    if (!validatePassword()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(passwordForm);
      toast.success("Senha alterada com sucesso");
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Falha ao alterar senha";
      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
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
    
    // Apply theme change immediately if theme is being changed
    if (section === 'appearance' && key === 'theme' && setCurrentTheme) {
      setCurrentTheme(value as 'light' | 'dark' | 'system');
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              Configurações
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie suas informações de perfil, segurança e preferências do sistema em um só lugar.
            </p>
          </div>
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList>
          <TabsTrigger value="profile">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notificações
          </TabsTrigger>
          <TabsTrigger value="privacy">
            Privacidade
          </TabsTrigger>
          <TabsTrigger value="appearance">
            Aparência
          </TabsTrigger>
          <TabsTrigger value="security">
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Informações do Perfil
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-gray-600">
                      Atualize suas informações pessoais e dados de contato
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Perfil
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pb-8">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-6 pb-8 border-b border-gray-200">
                <div className="relative group">
                  <div className="w-36 h-36 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300 group-hover:scale-105">
                    {avatarPreview || settings.profile.avatar ? (
                      <img
                        src={avatarPreview || settings.profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {(avatarPreview || settings.profile.avatar) && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 ring-2 ring-white"
                      type="button"
                      aria-label="Remover avatar"
                      title="Remover avatar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105">
                      <Camera className="h-4 w-4" />
                      {avatarPreview || settings.profile.avatar ? 'Alterar Avatar' : 'Adicionar Avatar'}
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                    aria-label="Upload avatar"
                    title="Upload avatar"
                  />
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    JPG, PNG ou GIF. Máximo 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Nome</Label>
                  <Input
                    id="firstName"
                    value={settings.profile.firstName}
                    onChange={(e) => {
                      handleSettingChange('profile', 'firstName', e.target.value);
                      if (profileErrors.firstName) {
                        setProfileErrors(prev => ({ ...prev, firstName: '' }));
                      }
                    }}
                    className={profileErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}
                  />
                  {profileErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {profileErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={settings.profile.lastName}
                    onChange={(e) => {
                      handleSettingChange('profile', 'lastName', e.target.value);
                      if (profileErrors.lastName) {
                        setProfileErrors(prev => ({ ...prev, lastName: '' }));
                      }
                    }}
                    className={profileErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}
                  />
                  {profileErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {profileErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => {
                      handleSettingChange('profile', 'email', e.target.value);
                      if (profileErrors.email) {
                        setProfileErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={profileErrors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}
                  />
                  {profileErrors.email && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {profileErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Telefone</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone}
                    onChange={(e) => {
                      handleSettingChange('profile', 'phone', e.target.value);
                      if (profileErrors.phone) {
                        setProfileErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    className={profileErrors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}
                  />
                  {profileErrors.phone && (
                    <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {profileErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Preferências de Notificações
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-gray-600">
                      Configure como e quando receber notificações
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  Notificações
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canais de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Mail className="h-5 w-5 text-white" />
                    </div>
                      <div className="flex flex-col">
                        <Label htmlFor="emailNotifications" className="font-semibold text-gray-900">Notificações por E-mail</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receba notificações importantes por e-mail
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                    />
                  </div>
                    </div>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="pushNotifications" className="font-semibold text-gray-900">Notificações Push</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receba notificações no navegador mesmo quando o site estiver fechado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Switch
                      id="pushNotifications"
                      checked={settings.notifications.push}
                        onCheckedChange={async (checked) => {
                          handleSettingChange('notifications', 'push', checked);
                          // If enabling, request permission and subscribe
                          if (checked) {
                            try {
                              const { requestPushPermissionAndSubscribe, isPushNotificationSupported } = await import('@/lib/push-notifications');
                              if (isPushNotificationSupported()) {
                                await requestPushPermissionAndSubscribe();
                                toast.success('Notificações push ativadas com sucesso');
                              } else {
                                toast.warning('Notificações push não são suportadas neste navegador');
                                // Revert the toggle if not supported
                                handleSettingChange('notifications', 'push', false);
                              }
                            } catch (error: any) {
                              console.error('Failed to subscribe to push notifications:', error);
                              toast.error(error?.message || 'Falha ao ativar notificações push');
                              // Revert the toggle on error
                              handleSettingChange('notifications', 'push', false);
                            }
                          } else {
                            // If disabling, unsubscribe from push notifications
                            try {
                              const { unsubscribeFromPushNotifications } = await import('@/lib/push-notifications');
                              // Get current subscription endpoint
                              if ('serviceWorker' in navigator && 'PushManager' in window) {
                                const registration = await navigator.serviceWorker.ready;
                                const subscription = await registration.pushManager.getSubscription();
                                if (subscription) {
                                  await unsubscribeFromPushNotifications(subscription.endpoint);
                                  await subscription.unsubscribe();
                                  toast.success('Notificações push desativadas');
                                }
                              }
                            } catch (error: any) {
                              console.error('Failed to unsubscribe from push notifications:', error);
                              // Don't show error toast, just log it
                            }
                          }
                        }}
                    />
                  </div>
                    </div>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <Label htmlFor="smsNotifications" className="font-semibold text-gray-900">Notificações SMS</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receba notificações importantes por SMS no seu telefone
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Switch
                      id="smsNotifications"
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'sms', checked)}
                    />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Test Notifications */}
              <div className="space-y-3">
                {/* Test Email Button */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Testar Notificações por E-mail</h4>
                      <p className="text-xs text-muted-foreground">
                        Envie um email de teste para verificar se suas configurações estão funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testEmailNotification } = await import('@/lib/settings-api');
                          const result = await testEmailNotification();
                          if (result.email_sent) {
                            toast.success(`Email de teste enviado para ${result.email_address}`);
                          } else if (!result.email_enabled) {
                            toast.warning('Notificações por e-mail estão desabilitadas');
                          } else {
                            toast.error('Falha ao enviar email de teste');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test email:', error);
                          toast.error(error?.response?.data?.detail || 'Falha ao enviar email de teste');
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>

                {/* Test Push Button */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Testar Notificações Push</h4>
                      <p className="text-xs text-muted-foreground">
                        Envie uma notificação push de teste para verificar se suas configurações estão funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testPushNotification } = await import('@/lib/settings-api');
                          const result = await testPushNotification();
                          if (result.push_sent) {
                            toast.success(`Notificação push enviada para ${result.devices_notified} dispositivo(s)`);
                          } else if (!result.push_enabled) {
                            toast.warning('Notificações push estão desabilitadas');
                          } else {
                            toast.error('Falha ao enviar notificação push. Verifique se você permitiu notificações no navegador.');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test push:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar notificação push';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>

                {/* Test SMS Button */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Testar Notificações SMS</h4>
                      <p className="text-xs text-muted-foreground">
                        Envie um SMS de teste para verificar se suas configurações estão funcionando. Certifique-se de ter um número de telefone cadastrado.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testSmsNotification } = await import('@/lib/settings-api');
                          const result = await testSmsNotification();
                          if (result.sms_sent) {
                            toast.success(`SMS de teste enviado para ${result.phone_number}`);
                          } else if (!result.sms_enabled) {
                            toast.warning('Notificações SMS estão desabilitadas');
                          } else {
                            toast.error('Falha ao enviar SMS de teste');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test SMS:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar SMS de teste';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <Label htmlFor="appointmentReminders" className="font-medium">Lembretes de Consultas</Label>
                    </div>
                    <Switch
                      id="appointmentReminders"
                      checked={settings.notifications.appointmentReminders}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'appointmentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                      <Label htmlFor="systemUpdates" className="font-medium">Atualizações do Sistema</Label>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'systemUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/40">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <Label htmlFor="marketingNotifications" className="font-medium">Notificações de Marketing</Label>
                    </div>
                    <Switch
                      id="marketingNotifications"
                      checked={settings.notifications.marketing}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'marketing', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Test Notification Types */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Testar Tipos de Notificação</h3>
                
                {/* Test Appointment Reminder */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Testar Lembretes de Consultas
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Envie um lembrete de consulta de teste para verificar se as notificações estão funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testAppointmentReminder } = await import('@/lib/settings-api');
                          const result = await testAppointmentReminder();
                          if (result.sent) {
                            toast.success(`Lembrete de consulta enviado via: ${result.channels?.join(', ')}`);
                          } else if (!result.enabled) {
                            toast.warning('Lembretes de consultas estão desabilitados');
                          } else {
                            toast.warning('Nenhum canal de notificação ativo. Verifique suas configurações.');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test appointment reminder:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar lembrete de teste';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>
                
                {/* Test System Update */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        Testar Atualizações do Sistema
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Envie uma notificação de atualização do sistema de teste
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testSystemUpdate } = await import('@/lib/settings-api');
                          const result = await testSystemUpdate();
                          if (result.sent) {
                            toast.success(`Atualização do sistema enviada via: ${result.channels?.join(', ')}`);
                          } else if (!result.enabled) {
                            toast.warning('Atualizações do sistema estão desabilitadas');
                          } else {
                            toast.warning('Nenhum canal de notificação ativo. Verifique suas configurações.');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test system update:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar atualização de teste';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>
                
                {/* Test Marketing Notification */}
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                        Testar Notificações de Marketing
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Envie uma notificação de marketing de teste para verificar se as notificações estão funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testMarketingNotification } = await import('@/lib/settings-api');
                          const result = await testMarketingNotification();
                          if (result.sent) {
                            toast.success(`Notificação de marketing enviada via: ${result.channels?.join(', ')}`);
                          } else if (!result.enabled) {
                            toast.warning('Notificações de marketing estão desabilitadas');
                          } else {
                            toast.warning('Nenhum canal de notificação ativo. Verifique suas configurações.');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test marketing notification:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar notificação de marketing de teste';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Privacidade e Dados
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-gray-600">
                      Gerencie suas configurações de privacidade e compartilhamento de dados
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Privacidade
                </Badge>
              </div>
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
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <Label htmlFor="showOnlineStatus" className="font-semibold text-gray-900">Mostrar Status Online</Label>
                    <Switch
                      id="showOnlineStatus"
                      checked={settings.privacy.showOnlineStatus}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'showOnlineStatus', checked)}
                      className="data-[state=checked]:from-green-600 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-green-500/50"
                    />
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <Label htmlFor="allowDirectMessages" className="font-semibold text-gray-900">Permitir Mensagens Diretas</Label>
                    <Switch
                      id="allowDirectMessages"
                      checked={settings.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'allowDirectMessages', checked)}
                      className="data-[state=checked]:from-green-600 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-green-500/50"
                    />
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                    <Label htmlFor="dataSharing" className="font-semibold text-gray-900">Permitir Compartilhamento de Dados</Label>
                    <Switch
                      id="dataSharing"
                      checked={settings.privacy.dataSharing}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'dataSharing', checked)}
                      className="data-[state=checked]:from-green-600 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-green-500/50"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Test Privacy Settings */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Testar Configurações de Privacidade</h3>
                <div className="p-4 rounded-lg bg-muted/40 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Verificar Configurações de Privacidade
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Teste suas configurações de privacidade e veja como elas afetam sua experiência
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testPrivacySettings } = await import('@/lib/settings-api');
                          const result = await testPrivacySettings();
                          
                          // Show detailed results
                          const results = result.test_results;
                          let message = "Configurações de Privacidade:\n\n";
                          
                          message += `• Status Online: ${results.showOnlineStatus.enabled ? '✅ Ativado' : '❌ Desativado'}\n`;
                          message += `  ${results.showOnlineStatus.effect}\n\n`;
                          
                          message += `• Mensagens Diretas: ${results.allowDirectMessages.enabled ? '✅ Permitido' : '❌ Bloqueado'}\n`;
                          message += `  ${results.allowDirectMessages.effect}\n\n`;
                          
                          message += `• Compartilhamento de Dados: ${results.dataSharing.enabled ? '✅ Permitido' : '❌ Bloqueado'}\n`;
                          message += `  ${results.dataSharing.effect}\n\n`;
                          
                          message += `• Visibilidade do Perfil: ${results.profileVisibility.value}\n`;
                          message += `  ${results.profileVisibility.effect}`;
                          
                          toast.success(message, {
                            duration: 8000,
                          });
                        } catch (error: any) {
                          console.error('Failed to test privacy settings:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao testar configurações de privacidade';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Testar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Palette className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Aparência e Idioma
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-gray-600">
                      Personalize a aparência e idioma da interface
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Palette className="h-3.5 w-3.5 mr-1.5" />
                  Aparência
                </Badge>
              </div>
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
          <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Segurança e Autenticação
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-gray-600">
                      Gerencie sua senha e configurações de segurança
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1.5">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Segurança
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                  <div>
                      <Label htmlFor="twoFactorAuth" className="font-semibold text-gray-900">Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-gray-600 mt-1">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                    </div>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.security.twoFactorAuth}
                    className="data-[state=checked]:from-red-600 data-[state=checked]:to-rose-600 data-[state=checked]:shadow-red-500/50"
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        // Enable 2FA - start setup process
                        try {
                          const { setup2FA } = await import('@/lib/settings-api');
                          const result = await setup2FA();
                          setTwoFactorSetup({
                            qrImage: result.qr_image,
                            secret: result.secret,
                            verifying: false,
                            verificationCode: '',
                          });
                          setShow2FADialog(true);
                        } catch (error: any) {
                          console.error('Failed to setup 2FA:', error);
                          toast.error(error?.response?.data?.detail || 'Falha ao configurar autenticação de dois fatores');
                          // Revert toggle
                          handleSettingChange('security', 'twoFactorAuth', false);
                        }
                      } else {
                        // Disable 2FA
                        try {
                          const { disable2FA } = await import('@/lib/settings-api');
                          await disable2FA();
                          handleSettingChange('security', 'twoFactorAuth', false);
                          toast.success('Autenticação de dois fatores desativada');
                        } catch (error: any) {
                          console.error('Failed to disable 2FA:', error);
                          toast.error(error?.response?.data?.detail || 'Falha ao desativar autenticação de dois fatores');
                          // Revert toggle
                          handleSettingChange('security', 'twoFactorAuth', true);
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border/50 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                  <div>
                      <Label htmlFor="loginAlerts" className="font-semibold text-gray-900">Alertas de Login</Label>
                      <p className="text-sm text-gray-600 mt-1">
                      Seja notificado quando alguém fizer login na sua conta
                    </p>
                    </div>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={settings.security.loginAlerts}
                    onCheckedChange={(checked) => handleSettingChange('security', 'loginAlerts', checked)}
                    className="data-[state=checked]:from-red-600 data-[state=checked]:to-rose-600 data-[state=checked]:shadow-red-500/50"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Test Login Alert */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Testar Alertas de Login</h3>
                <div className="p-4 rounded-lg bg-blue-50/30 border border-blue-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        Testar Alerta de Login
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Envie um alerta de login de teste para verificar se as notificações estão funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const { testLoginAlert } = await import('@/lib/settings-api');
                          const result = await testLoginAlert();
                          if (result.sent) {
                            toast.success('Alerta de login de teste enviado com sucesso');
                          } else if (!result.enabled) {
                            toast.warning('Alertas de login estão desabilitados');
                          } else {
                            toast.error('Falha ao enviar alerta de login de teste');
                          }
                        } catch (error: any) {
                          console.error('Failed to send test login alert:', error);
                          const errorMessage = error?.response?.data?.detail || error?.message || 'Falha ao enviar alerta de login de teste';
                          toast.error(errorMessage);
                        }
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deixe os campos em branco se não desejar alterar a senha. Se preencher qualquer campo, todos serão obrigatórios.
                  </p>
                  <div className="space-y-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div>
                      <Label htmlFor="currentPassword">Senha Atual (opcional)</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => {
                            setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
                            if (passwordErrors.currentPassword) {
                              setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                            }
                          }}
                          className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword">Nova Senha (opcional)</Label>
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
                          if (passwordErrors.newPassword) {
                            setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                          }
                        }}
                        className={passwordErrors.newPassword ? 'border-red-500' : ''}
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Mínimo de 8 caracteres
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha (opcional)</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }
                        }}
                        className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <Button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="w-full"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Alterar Senha
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações de Sessão</h3>
                <div>
                  <Label htmlFor="sessionTimeout">Tempo Limite de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                    min="5"
                    max="480"
                  />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tempo de inatividade antes do logout automático (5-480 minutos)
                    </p>
                </div>
                
                <div>
                  <Label htmlFor="passwordExpiry">Expiração de Senha (dias)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.security.passwordExpiry}
                      onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value) || 90)}
                    min="30"
                    max="365"
                  />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dias até a senha expirar e precisar ser alterada (30-365 dias)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Escaneie o QR code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {twoFactorSetup.qrImage && (
              <div className="flex justify-center">
                <img 
                  src={twoFactorSetup.qrImage} 
                  alt="QR Code for 2FA" 
                  className="border rounded-lg p-2 bg-white"
                />
              </div>
            )}
            {twoFactorSetup.secret && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ou insira este código manualmente:</p>
                <code className="text-sm font-mono break-all">{twoFactorSetup.secret}</code>
              </div>
            )}
            <div>
              <Label htmlFor="verificationCode">Código de Verificação (6 dígitos)</Label>
              <Input
                id="verificationCode"
                type="text"
                maxLength={6}
                value={twoFactorSetup.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only numbers
                  setTwoFactorSetup(prev => ({ ...prev, verificationCode: value }));
                }}
                placeholder="000000"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (twoFactorSetup.verificationCode.length !== 6) {
                    toast.error('Por favor, insira um código de 6 dígitos');
                    return;
                  }
                  
                  setTwoFactorSetup(prev => ({ ...prev, verifying: true }));
                  try {
                    const { verify2FA } = await import('@/lib/settings-api');
                    const result = await verify2FA(twoFactorSetup.verificationCode);
                    if (result.enabled) {
                      toast.success('Autenticação de dois fatores ativada com sucesso!');
                      setShow2FADialog(false);
                      handleSettingChange('security', 'twoFactorAuth', true);
                      // Reload settings to get updated 2FA status
                      window.location.reload();
                    }
                  } catch (error: any) {
                    console.error('Failed to verify 2FA:', error);
                    toast.error(error?.response?.data?.detail || 'Código inválido. Por favor, tente novamente.');
                  } finally {
                    setTwoFactorSetup(prev => ({ ...prev, verifying: false }));
                  }
                }}
                disabled={twoFactorSetup.verificationCode.length !== 6 || twoFactorSetup.verifying}
                className="flex-1"
              >
                {twoFactorSetup.verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar e Ativar'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShow2FADialog(false);
                  setTwoFactorSetup({
                    qrImage: null,
                    secret: null,
                    verifying: false,
                    verificationCode: '',
                  });
                  handleSettingChange('security', 'twoFactorAuth', false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
