"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  XCircle,
  Settings,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
  RefreshCw,
  Loader2,
  Calendar,
  Shield,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationsApi, NotificationItem } from "@/lib/notifications-api";

type Notification = NotificationItem;

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'Todos os Tipos', icon: Bell },
  { value: 'appointment', label: 'Agendamentos', icon: Calendar },
  { value: 'system', label: 'Sistema', icon: Settings },
  { value: 'info', label: 'Informação', icon: Info },
  { value: 'success', label: 'Sucesso', icon: CheckCircle },
  { value: 'warning', label: 'Avisos', icon: AlertTriangle },
  { value: 'error', label: 'Erros', icon: XCircle },
];

const PRIORITY_LEVELS = [
  { value: 'all', label: 'Todas as Prioridades' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "08:00",
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const n = notifications.find(x => x.id === notificationId);
      if (n?.kind && typeof n.source_id === 'number') {
        await notificationsApi.markRead(n.kind, n.source_id);
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const n = notifications.find(x => x.id === notificationId);
      if (n?.kind && typeof n.source_id === 'number') {
        await notificationsApi.delete(n.kind, n.source_id);
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'appointment':
        return <Clock className={cn(iconClass, "text-blue-600")} />;
      case 'system':
        return <Settings className={cn(iconClass, "text-gray-600")} />;
      case 'info':
        return <Info className={cn(iconClass, "text-blue-600")} />;
      case 'success':
        return <CheckCircle className={cn(iconClass, "text-green-600")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-600")} />;
      case 'error':
        return <XCircle className={cn(iconClass, "text-red-600")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-600")} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'system':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-blue-600/10 rounded-2xl blur-3xl" />
          <div className="relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                      Notificações
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white border-0 shadow-md animate-pulse">
                          {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      Mantenha-se atualizado com notificações e alertas importantes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-700">{filteredNotifications.length}</span>
                    <span>notificação{filteredNotifications.length !== 1 ? 'ões' : ''} encontrada{filteredNotifications.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={markAllAsRead}
                    className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Marcar Todas como Lidas
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={loadNotifications}
                  disabled={loading}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        {showSettings && (
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Configurações de Notificações</CardTitle>
                  <CardDescription className="mt-1">Configure como você recebe notificações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Canais de Notificação
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <Label htmlFor="emailNotifications" className="font-medium cursor-pointer">Notificações por Email</Label>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Smartphone className="h-4 w-4 text-teal-600" />
                        </div>
                        <Label htmlFor="pushNotifications" className="font-medium cursor-pointer">Notificações Push</Label>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Bell className="h-4 w-4 text-yellow-600" />
                        </div>
                        <Label htmlFor="smsNotifications" className="font-medium cursor-pointer">Notificações SMS</Label>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-teal-600" />
                    Tipos de Notificação
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <Label htmlFor="appointmentReminders" className="font-medium cursor-pointer flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Lembretes de Agendamento
                      </Label>
                      <Switch
                        id="appointmentReminders"
                        checked={settings.appointmentReminders}
                        onCheckedChange={(checked) => handleSettingChange("appointmentReminders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <Label htmlFor="systemUpdates" className="font-medium cursor-pointer flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        Atualizações do Sistema
                      </Label>
                      <Switch
                        id="systemUpdates"
                        checked={settings.systemUpdates}
                        onCheckedChange={(checked) => handleSettingChange("systemUpdates", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <Label htmlFor="securityAlerts" className="font-medium cursor-pointer flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        Alertas de Segurança
                      </Label>
                      <Switch
                        id="securityAlerts"
                        checked={settings.securityAlerts}
                        onCheckedChange={(checked) => handleSettingChange("securityAlerts", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
                      <Label htmlFor="marketingEmails" className="font-medium cursor-pointer flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-600" />
                        Emails de Marketing
                      </Label>
                      <Switch
                        id="marketingEmails"
                        checked={settings.marketingEmails}
                        onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-blue-100" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {settings.quietHours ? (
                    <VolumeX className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-blue-600" />
                  )}
                  Horário Silencioso
                </h3>
                <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="quietHours" className="font-medium cursor-pointer">Ativar Horário Silencioso</Label>
                    <Switch
                      id="quietHours"
                      checked={settings.quietHours}
                      onCheckedChange={(checked) => handleSettingChange("quietHours", checked)}
                    />
                  </div>
                  {settings.quietHours && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quietStart" className="text-sm font-medium text-gray-700 mb-2 block">Horário de Início</Label>
                        <Input
                          id="quietStart"
                          type="time"
                          value={settings.quietStart}
                          onChange={(e) => handleSettingChange("quietStart", e.target.value)}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quietEnd" className="text-sm font-medium text-gray-700 mb-2 block">Horário de Término</Label>
                        <Input
                          id="quietEnd"
                          type="time"
                          value={settings.quietEnd}
                          onChange={(e) => handleSettingChange("quietEnd", e.target.value)}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Filtros de Busca</CardTitle>
                <CardDescription className="mt-1">Filtre notificações por tipo e prioridade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar notificações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="w-full md:w-56">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon && <type.icon className="h-4 w-4" />}
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-56">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Prioridade</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Notificações ({filteredNotifications.length})
                </CardTitle>
                <CardDescription className="mt-1">
                  Notificações e alertas recentes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando notificações...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                  <Bell className="h-12 w-12 text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Nenhuma notificação encontrada</p>
                <p className="text-sm text-gray-600">Tente ajustar os filtros de busca.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative overflow-hidden border-2 rounded-xl p-5 transition-all duration-300",
                      notification.read
                        ? "bg-white border-blue-100 hover:border-blue-200 hover:shadow-md"
                        : "bg-gradient-to-r from-blue-50/50 to-white border-blue-300 hover:border-blue-400 hover:shadow-lg border-l-4 border-l-blue-600"
                    )}
                  >
                    {/* Medical pattern background */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                    
                    <div className="relative flex items-start gap-4">
                      {/* Icon Container */}
                      <div className={cn(
                        "flex-shrink-0 p-3 rounded-xl border-2 shadow-sm",
                        getTypeColor(notification.type)
                      )}>
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className={cn(
                                "text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors",
                                !notification.read && "font-bold"
                              )}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                {notification.source}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(notification.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Priority Badge */}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={cn(
                            "text-xs font-semibold border",
                            getPriorityColor(notification.priority)
                          )}>
                            {notification.priority === 'urgent' ? 'Urgente' :
                             notification.priority === 'high' ? 'Alta' :
                             notification.priority === 'medium' ? 'Média' :
                             notification.priority === 'low' ? 'Baixa' : notification.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-2 flex-shrink-0">
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(notification.actionUrl!)}
                            className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700"
                          >
                            {notification.actionText || 'Ver'}
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
