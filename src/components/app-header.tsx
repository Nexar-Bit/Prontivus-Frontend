"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { BellRing, Search, UserRound, Settings2, LogOut, ShieldCheck, HeartPulse, UsersRound, UserRoundCheck, HelpCircle, ChevronDown, Home, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { getUserSettings } from "@/lib/settings-api";
import { useOperationProgress } from "@/contexts/OperationProgressContext";
import { Loader2 } from "lucide-react";

interface AppHeaderProps {
  pageTitle?: string;
  pageIcon?: React.ComponentType<{ className?: string }>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    loading?: boolean;
  };
}

export function AppHeader({
  pageTitle,
  pageIcon: PageIcon,
  showSearch = true,
  searchPlaceholder = "Buscar pacientes, consultas, procedimentos...",
  onSearch,
  primaryAction,
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { getRoleDisplayName, isAdmin, isSecretary, isDoctor, isPatient } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  
  // Get operation progress state
  let operationProgress: ReturnType<typeof useOperationProgress> | null = null;
  try {
    operationProgress = useOperationProgress();
  } catch {
    // OperationProgressContext not available, continue without it
  }

  // Load user avatar
  React.useEffect(() => {
    const loadAvatar = async () => {
      if (!user) {
        setAvatarUrl(null);
        return;
      }

      try {
        const settings = await getUserSettings();
        if (settings.profile.avatar) {
          let url = settings.profile.avatar;
          if (url && !url.startsWith('http')) {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error('Failed to load avatar:', error);
        setAvatarUrl(null);
      }
    };

    loadAvatar();
  }, [user]);

  // Get role icon
  const getRoleIcon = () => {
    if (isAdmin()) return ShieldCheck;
    if (isSecretary()) return UsersRound;
    if (isDoctor()) return HeartPulse;
    if (isPatient()) return UserRoundCheck;
    return UserRound;
  };

  // Get role color
  const getRoleColor = () => {
    if (isAdmin()) return "text-red-500";
    if (isSecretary()) return "text-blue-500";
    if (isDoctor()) return "text-green-500";
    if (isPatient()) return "text-purple-500";
    return "text-gray-500";
  };

  // Get role-based avatar fallback styling - Softer blue tones
  const getRoleAvatarStyle = () => {
    if (isAdmin()) return "bg-blue-100 text-blue-700 border-blue-200";
    if (isSecretary()) return "bg-blue-100 text-blue-600 border-blue-200";
    if (isDoctor()) return "bg-blue-100 text-blue-600 border-blue-200";
    if (isPatient()) return "bg-blue-100 text-blue-600 border-blue-200";
    return "bg-blue-100 text-blue-600 border-blue-200";
  };

  const RoleIcon = getRoleIcon();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username[0]?.toUpperCase() || 'U';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Build breadcrumb navigation
  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: 'Início', href: '/' }];
    
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Início', href: '/' }];
    
    let currentPath = '';
    const pathLabels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'secretaria': 'Secretaria',
      'medico': 'Médico',
      'admin': 'Administração',
      'portal': 'Portal do Paciente',
      'financeiro': 'Financeiro',
      'estoque': 'Estoque',
      'procedimentos': 'Procedimentos',
      'relatorios': 'Relatórios',
      'settings': 'Configurações',
      'cadastros': 'Cadastros',
      'clinico': 'Clínico',
      'operacional': 'Operacional',
      'custom': 'Personalizado',
    };
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      if (index < segments.length - 1) {
        breadcrumbs.push({ label, href: currentPath });
      } else {
        breadcrumbs.push({ label: pageTitle || label, href: currentPath });
      }
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const DisplayIcon = PageIcon || RoleIcon;
  const PrimaryActionIcon = primaryAction?.icon || Save;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-blue-100/50 shadow-sm">
      {/* Progress Indicator */}
      {operationProgress?.isOperating && (
        <div className="h-1 bg-blue-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse" style={{ width: '100%' }} />
          <div className="absolute inset-0 bg-blue-500 animate-[shimmer_2s_infinite] opacity-50" style={{ 
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            width: '50%',
            animation: 'shimmer 2s infinite'
          }} />
        </div>
      )}
      {operationProgress?.isOperating && operationProgress.operationMessage && (
        <div className="px-6 lg:px-8 py-2 bg-blue-50/50 border-b border-blue-100/50 flex items-center gap-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{operationProgress.operationMessage}</span>
        </div>
      )}
      <div className="flex h-20 items-center gap-6 px-6 lg:px-8">
        {/* Center: Breadcrumb Navigation */}
        <nav className="flex-1 hidden lg:flex items-center gap-2 min-w-0">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-2 min-w-0">
                {index > 0 && (
                  <ChevronDown className="h-4 w-4 text-blue-300 rotate-[-90deg] flex-shrink-0" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-blue-700 font-semibold truncate flex items-center gap-2">
          {DisplayIcon && (
                      <DisplayIcon className="h-4 w-4 flex-shrink-0" />
                    )}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-blue-600/70 hover:text-blue-700 transition-colors truncate flex items-center gap-2"
                  >
                    {index === 0 && <Home className="h-4 w-4 flex-shrink-0" />}
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Right Section: Search, Notifications, User, Primary Action */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Global Search Bar */}
        {showSearch && (
          <form
            onSubmit={handleSearch}
              className="hidden md:block"
          >
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 w-64 bg-blue-50/50 border-blue-200/50 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-blue-400/60"
              />
            </div>
          </form>
        )}

          {/* Mobile Search Button */}
          {showSearch && (
            <>
            <Button
              variant="ghost"
              size="icon"
                className="md:hidden h-10 w-10 rounded-lg hover:bg-blue-50"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5 text-blue-600" />
              </Button>
              <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 gap-0">
                  <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl font-bold text-blue-700">Buscar</DialogTitle>
                    <DialogDescription>
                      Digite sua busca abaixo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-6 pb-6">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (onSearch) {
                          onSearch(searchQuery);
                        }
                        setMobileSearchOpen(false);
                      }}
                    >
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                        <Input
                          type="search"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 h-12 bg-blue-50/50 border-blue-200/50 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:text-blue-400/60"
                          autoFocus
                        />
                      </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Buscar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMobileSearchOpen(false)}
                          >
                            Cancelar
            </Button>
                        </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* Primary Action Button */}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.loading}
              className="hidden sm:flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 font-medium"
            >
              {primaryAction.loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <PrimaryActionIcon className="h-4 w-4" />
                  <span>{primaryAction.label}</span>
                </>
              )}
            </Button>
          )}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-auto p-2 hover:bg-blue-50/50 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar className={cn("h-10 w-10 border-2 border-blue-200 shadow-sm", getRoleAvatarStyle().split(' ')[2])}>
                    <AvatarImage src={avatarUrl || undefined} alt={user?.username} />
                    <AvatarFallback className={cn(getRoleAvatarStyle(), "font-semibold text-sm")}>
                      {avatarUrl ? (
                        <UserRound className="h-5 w-5" />
                      ) : (
                        <RoleIcon className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </span>
                    <span className="text-xs text-blue-600/70 flex items-center gap-1.5">
                      <RoleIcon className={cn("h-3 w-3", getRoleColor())} />
                      {getRoleDisplayName()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-blue-400 hidden lg:block" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 bg-white shadow-xl border border-blue-100/50 rounded-xl mt-2"
            >
              {/* User Info Header */}
              <DropdownMenuLabel className="p-0">
                <div className="flex items-center gap-4 px-4 py-4 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/30 to-transparent">
                  <Avatar className={cn("h-14 w-14 border-2 border-blue-200 shadow-md", getRoleAvatarStyle().split(' ')[2])}>
                    <AvatarImage src={avatarUrl || undefined} alt={user?.username} />
                    <AvatarFallback className={cn(getRoleAvatarStyle(), "font-semibold text-base")}>
                      {avatarUrl ? (
                        <UserRound className="h-6 w-6" />
                      ) : (
                        <RoleIcon className="h-6 w-6" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-base font-semibold text-gray-900 truncate">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </span>
                    <span className="text-sm text-blue-600/70 truncate mt-0.5">
                      {user?.email || user?.username}
                    </span>
                    <Badge
                      variant="secondary"
                      className="mt-2 w-fit text-xs bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                    >
                      <RoleIcon className={cn("h-3 w-3 mr-1.5", getRoleColor())} />
                      {getRoleDisplayName()}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-blue-100/50" />

              {/* Quick Actions */}
              <DropdownMenuGroup className="p-2">
                <DropdownMenuItem
                  onClick={() => {
                    // Always redirect to settings page when in dashboard (AppHeader context)
                    router.push('/settings');
                  }}
                  className="cursor-pointer focus:bg-blue-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <UserRound className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="cursor-pointer focus:bg-blue-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <Settings2 className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Configurações</span>
                </DropdownMenuItem>
                {isAdmin() && (
                  <DropdownMenuItem
                    onClick={() => router.push('/admin/settings')}
                    className="cursor-pointer focus:bg-blue-50 rounded-lg px-3 py-2.5 transition-colors"
                  >
                    <ShieldCheck className="mr-3 h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Admin Settings</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-blue-100/50" />

              <DropdownMenuGroup className="p-2">
                <DropdownMenuItem
                  onClick={() => router.push('/help')}
                  className="cursor-pointer focus:bg-blue-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <HelpCircle className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Ajuda e Suporte</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-blue-100/50" />

              {/* Logout */}
              <div className="p-2">
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Deseja sair da aplicação?')) {
                    (async () => {
                      try {
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('prontivus_access_token');
                          localStorage.removeItem('refresh_token');
                        }
                        await logout();
                        router.push('/login');
                      } catch (e) {
                        router.push('/login');
                      }
                    })();
                  }
                }}
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg px-3 py-2.5 transition-colors"
              >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Sair</span>
              </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

