"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Bell, Search, User, Settings, LogOut, Shield, Stethoscope, Users, UserCheck, HelpCircle, ChevronDown } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface AppHeaderProps {
  pageTitle?: string;
  pageIcon?: React.ComponentType<{ className?: string }>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function AppHeader({
  pageTitle,
  pageIcon: PageIcon,
  showSearch = false,
  searchPlaceholder = "Buscar...",
  onSearch,
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { getRoleDisplayName, isAdmin, isSecretary, isDoctor, isPatient } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get role icon
  const getRoleIcon = () => {
    if (isAdmin()) return Shield;
    if (isSecretary()) return Users;
    if (isDoctor()) return Stethoscope;
    if (isPatient()) return UserCheck;
    return User;
  };

  // Get role color
  const getRoleColor = () => {
    if (isAdmin()) return "text-red-500";
    if (isSecretary()) return "text-blue-500";
    if (isDoctor()) return "text-green-500";
    if (isPatient()) return "text-purple-500";
    return "text-gray-500";
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

  // Get page title from pathname if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    
    const pathMap: Record<string, string> = {
      '/': 'Início',
      '/dashboard': 'Dashboard',
      '/secretaria': 'Secretaria',
      '/medico': 'Médico',
      '/admin': 'Administração',
      '/portal': 'Portal do Paciente',
      '/financeiro': 'Financeiro',
      '/estoque': 'Estoque',
      '/procedimentos': 'Procedimentos',
      '/relatorios': 'Relatórios',
    };

    for (const [path, title] of Object.entries(pathMap)) {
      if (pathname?.startsWith(path)) return title;
    }

    return 'Prontivus';
  };

  const displayTitle = getPageTitle();
  const DisplayIcon = PageIcon || RoleIcon;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200/80 shadow-sm backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Left: Page Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {DisplayIcon && (
            <div className={cn(
              "p-2 rounded-lg bg-[#0F4C75]/5",
              getRoleColor().replace('text-', 'text-')
            )}>
              <DisplayIcon className={cn("h-5 w-5", getRoleColor())} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{displayTitle}</h1>
          </div>
        </div>

        {/* Center: Search Bar */}
        {showSearch && (
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md mx-auto hidden md:block"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#0F4C75]"
              />
            </div>
          </form>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search button for mobile */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                // TODO: Open mobile search modal
              }}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-auto p-1.5 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#0F4C75] focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-2 px-1">
                  <Avatar className="h-8 w-8 border-2 border-gray-200">
                    <AvatarImage src={(user as any)?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75] font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <RoleIcon className={cn("h-3 w-3", getRoleColor())} />
                      {getRoleDisplayName()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white shadow-lg border border-gray-200"
            >
              {/* User Info Header */}
              <DropdownMenuLabel className="p-0">
                <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-100">
                  <Avatar className="h-10 w-10 border-2 border-[#0F4C75]/20">
                    <AvatarImage src={(user as any)?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-[#0F4C75]/10 text-[#0F4C75] font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email || user?.username}
                    </span>
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit text-xs bg-[#0F4C75]/10 text-[#0F4C75] border-[#0F4C75]/20"
                    >
                      <RoleIcon className={cn("h-3 w-3 mr-1", getRoleColor())} />
                      {getRoleDisplayName()}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Quick Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push('/portal/profile')}
                  className="cursor-pointer focus:bg-[#0F4C75]/5"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="cursor-pointer focus:bg-[#0F4C75]/5"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                {isAdmin() && (
                  <DropdownMenuItem
                    onClick={() => router.push('/admin/settings')}
                    className="cursor-pointer focus:bg-[#0F4C75]/5"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Settings
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push('/help')}
                  className="cursor-pointer focus:bg-[#0F4C75]/5"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ajuda e Suporte
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Logout */}
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
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

