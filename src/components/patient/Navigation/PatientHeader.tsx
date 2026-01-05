"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notificationsApi, NotificationItem } from "@/lib/notifications-api";
import {
  BellRing,
  Search,
  HelpCircle,
  Phone,
  X,
  FileText,
  CalendarDays,
  FlaskConical,
  MessageCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOperationProgress } from "@/contexts/OperationProgressContext";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { patientCallingApi } from "@/lib/patient-calling-api";
import { toast } from "sonner";

interface PatientHeaderProps {
  className?: string;
  showSearch?: boolean;
  notificationCount?: number; // Deprecated - will be fetched from API
}

interface SearchResult {
  type: "record" | "appointment" | "test" | "message";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PatientHeader({
  className,
  showSearch = true,
  notificationCount: propNotificationCount,
}: PatientHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [callingSecretary, setCallingSecretary] = useState(false);
  
  // Get operation progress state
  let operationProgress: ReturnType<typeof useOperationProgress> | null = null;
  try {
    operationProgress = useOperationProgress();
  } catch {
    // OperationProgressContext not available, continue without it
  }

  // Fetch notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      // Only load notifications if user is authenticated
      if (!user) {
        setLoadingNotifications(false);
        return;
      }

      try {
        setLoadingNotifications(true);
        const data = await notificationsApi.getAll();
        setNotifications(data || []);
      } catch (error: any) {
        // Silently handle 401/403 errors (user not authenticated)
        if (error?.status === 401 || error?.status === 403) {
          console.warn("Not authenticated, skipping notifications load");
          setNotifications([]);
        } else {
          console.error("Failed to load notifications:", error);
          setNotifications([]);
        }
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Calculate unread notification count from database
  const unreadCount = notifications.filter(n => !n.read).length;
  // Always use the count from database (ignore deprecated prop)
  const notificationCount = unreadCount;

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "P";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          type: "record",
          title: "Consulta - 15 de Janeiro",
          description: "Consulta de rotina com Dr. Maria Silva",
          date: "15/01/2024",
          icon: FileText,
        },
        {
          type: "appointment",
          title: "Consulta Agendada - 20 de Janeiro",
          description: "14:00 - Cardiologia",
          date: "20/01/2024",
          icon: CalendarDays,
        },
        {
          type: "test",
          title: "Hemograma Completo",
          description: "Resultados disponíveis",
          date: "12/01/2024",
          icon: FlaskConical,
        },
      ];
      setSearchResults(
        mockResults.filter(
          (result) =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase())
        )
      );
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleEmergencyContact = () => {
    setShowHelpDialog(true);
  };

  const handleCallSecretary = async () => {
    try {
      setCallingSecretary(true);
      await patientCallingApi.callSecretary();
      toast.success("Chamada enviada! A secretária será notificada.");
      setShowHelpDialog(false);
    } catch (error: any) {
      console.error("Error calling secretary:", error);
      toast.error(error?.message || "Erro ao chamar secretária. Tente novamente.");
    } finally {
      setCallingSecretary(false);
    }
  };

  const handleEmergencyCall = () => {
    if (typeof window !== "undefined") {
      window.location.href = "tel:192";
    }
    setShowHelpDialog(false);
  };

  return (
    <header
      className={cn(
        "bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 border-b border-blue-800/50 z-50 backdrop-blur-md shadow-lg flex-shrink-0",
        className
      )}
    >
      {/* Progress Indicator */}
      {operationProgress?.isOperating && (
        <div className="h-1 bg-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-300 animate-pulse" style={{ width: '100%' }} />
          <div className="absolute inset-0 bg-blue-400 animate-[shimmer_2s_infinite] opacity-50" style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            width: '50%',
            animation: 'shimmer 2s infinite'
          }} />
        </div>
      )}
      {operationProgress?.isOperating && operationProgress.operationMessage && (
        <div className="px-4 lg:px-6 py-2 bg-blue-700/80 border-b border-blue-800/50 flex items-center gap-2 text-sm text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{operationProgress.operationMessage}</span>
        </div>
      )}
      <div className="px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/patient/dashboard" className="flex-shrink-0">
              <div className="relative h-36 w-auto">
                <Image
                  src="/Logo/Prontivus Horizontal Transparents.png"
                  alt="Prontivus"
                  width={540}
                  height={144}
                  className="h-36 w-auto object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center Section: Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300 z-10" />
                <Input
                  type="search"
                  placeholder="Buscar em registros médicos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-11 pr-11 h-11 border-2 border-blue-400/50 focus:border-blue-300 rounded-xl bg-white shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-300/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
                    aria-label="Limpar busca"
                    title="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-blue-100 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto backdrop-blur-sm">
                  <div className="p-2 space-y-1">
                    {searchResults.map((result, index) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            // Navigate to result
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50/50 transition-all duration-200 text-left border border-transparent hover:border-blue-100"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate mt-0.5">
                              {result.description}
                            </p>
                            <p className="text-xs text-blue-600/70 mt-1.5 font-medium">
                              {result.date}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Section: Patient Info, Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Patient Info & Greeting */}
            <div className="hidden lg:flex items-center gap-3 min-w-0">
              <div className="min-w-0 text-right">
                <h1 className="text-lg lg:text-xl font-bold text-white truncate flex items-center justify-end gap-2">
                  <span>{getGreeting()}, {user?.first_name || "Paciente"}! 👋</span>
                </h1>
                <p className="text-sm text-blue-100 truncate flex items-center justify-end gap-1.5 mt-0.5">
                  <span>{user?.email || "Seu painel de saúde"}</span>
                </p>
              </div>
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-blue-400 shadow-md shadow-blue-900/30 flex-shrink-0 ring-2 ring-blue-500/30">
                  <AvatarImage src={(user as any)?.avatar} alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Mobile Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-11 w-11 rounded-xl hover:bg-blue-500/30 hover:text-white text-blue-100 transition-colors"
                onClick={() => {
                  // Open mobile search
                }}
                aria-label="Buscar"
                title="Buscar"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-11 w-11 rounded-xl hover:bg-blue-500/30 hover:text-white text-blue-100 transition-colors"
                  aria-label={`Notificações${notificationCount > 0 ? ` (${notificationCount} novas)` : ''}`}
                  title="Notificações"
                >
                  <BellRing className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute top-0.5 right-0.5 h-5 min-w-[20px] px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-semibold border-2 border-white shadow-md">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-xl border-blue-100 shadow-xl" align="end">
                <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/50 to-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-blue-700 text-base flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-blue-600" />
                      Notificações
                    </h3>
                    {notificationCount > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs font-semibold">
                        {notificationCount} nova{notificationCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">
                      Carregando...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {notifications.slice(0, 10).map((notification) => {
                        const getIcon = () => {
                          switch (notification.kind) {
                            case "appointment":
                              return CalendarDays;
                            case "message":
                              return MessageCircle;
                            case "exam":
                            case "test":
                              return FlaskConical;
                            default:
                              return FileText;
                          }
                        };
                        const Icon = getIcon();
                        const getIconColor = () => {
                          switch (notification.kind) {
                            case "appointment":
                              return "text-blue-600 bg-blue-100";
                            case "message":
                              return "text-teal-600 bg-teal-100";
                            case "exam":
                            case "test":
                              return "text-green-600 bg-green-100";
                            default:
                              return "text-gray-600 bg-gray-100";
                          }
                        };

                        return (
                          <button
                            key={notification.id}
                            onClick={async () => {
                              if (!notification.read) {
                                try {
                                  await notificationsApi.markRead(notification.kind, notification.source_id);
                                  setNotifications(prev =>
                                    prev.map(n =>
                                      n.id === notification.id ? { ...n, read: true } : n
                                    )
                                  );
                                } catch (error) {
                                  console.error("Failed to mark notification as read:", error);
                                }
                              }
                              if (notification.actionUrl) {
                                router.push(notification.actionUrl);
                              }
                            }}
                            className={cn(
                              "w-full flex gap-3 p-3 rounded-xl hover:bg-blue-50/50 transition-all duration-200 text-left border border-transparent hover:border-blue-100",
                              !notification.read && "bg-blue-50/30 border-blue-100"
                            )}
                          >
                            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", getIconColor())}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", !notification.read && "font-bold text-gray-900")}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{notification.message}</p>
                              <p className="text-xs text-blue-600/70 mt-1.5 font-medium">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2.5 w-2.5 rounded-full bg-teal-500 flex-shrink-0 mt-1 shadow-sm ring-2 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-4 border-t border-blue-100 bg-blue-50/30">
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-xl font-medium shadow-sm"
                      onClick={() => router.push("/patient/notifications")}
                    >
                      Ver Todas as Notificações
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Emergency Help Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-2 border-2 border-red-400/50 text-white bg-red-500/20 hover:bg-red-500/30 hover:border-red-400 rounded-xl font-semibold shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={handleEmergencyContact}
            >
              <div className="h-7 w-7 rounded-lg bg-red-400/30 flex items-center justify-center">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <span>Precisa de Ajuda?</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 w-11 rounded-xl text-white hover:bg-red-500/30 transition-colors border-2 border-red-400/50"
              onClick={handleEmergencyContact}
              aria-label="Emergency help"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Precisa de Ajuda?</DialogTitle>
            <DialogDescription>
              Escolha como deseja receber ajuda
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={handleCallSecretary}
              disabled={callingSecretary}
              className="w-full justify-start h-auto py-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">Chamar Secretária</div>
                  <div className="text-sm text-muted-foreground">
                    Solicite ajuda da equipe da clínica
                  </div>
                </div>
                {callingSecretary && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </Button>
            <Button
              onClick={handleEmergencyCall}
              className="w-full justify-start h-auto py-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <HelpCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">Emergência (192)</div>
                  <div className="text-sm text-muted-foreground">
                    Ligue para serviços de emergência
                  </div>
                </div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHelpDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

