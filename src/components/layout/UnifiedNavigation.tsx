"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserMenu, MenuGroup, MenuItem } from "@/lib/menu-api";
import { getIconFromName } from "@/lib/icon-mapper";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserSettings } from "@/lib/settings-api";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleLandingPage } from "@/lib/route-protection";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Unified Navigation Component
 * Single navigation component that adapts to all user roles
 * Provides consistent user experience across all roles
 */
export function UnifiedNavigation({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [menuGroups, setMenuGroups] = React.useState<MenuGroup[]>([]);
  const [menuLoading, setMenuLoading] = React.useState(true);
  const [openGroups, setOpenGroups] = React.useState<Record<number, boolean>>({});
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Get role-specific styling
  const getRoleStyles = () => {
    if (!user) return { sidebar: "bg-blue-700", accent: "text-blue-700" };
    
    const roleId = user.role_id;
    switch (roleId) {
      case 1: // SuperAdmin
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
      case 2: // AdminClinica
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
      case 3: // Medico
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
      case 4: // Secretaria
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
      case 5: // Paciente
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
      default:
        return { sidebar: "bg-blue-700", accent: "text-blue-700" };
    }
  };

  const roleStyles = getRoleStyles();

  // Load menu from API
  React.useEffect(() => {
    const loadMenu = async () => {
      if (!user) {
        setMenuLoading(false);
        return;
      }

      try {
        const menuData = await getUserMenu();
        if (menuData.groups && menuData.groups.length > 0) {
          setMenuGroups(menuData.groups);
          
          // Initialize open groups (all open by default)
          const initialOpen: Record<number, boolean> = {};
          menuData.groups.forEach((group: MenuGroup) => {
            initialOpen[group.id] = true;
          });
          setOpenGroups(initialOpen);
        }
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenu();
  }, [user]);

  // Load user avatar
  React.useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;

      try {
        const settings = await getUserSettings();
        if (settings.profile.avatar) {
          let url = settings.profile.avatar;
          if (url && !url.startsWith('http')) {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          setAvatarUrl(url);
        }
      } catch (error) {
        // Avatar loading is non-critical - fail silently
        if (process.env.NODE_ENV === 'development') {
          console.debug('Avatar not available:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    loadAvatar();
  }, [user]);

  if (!user) {
    return null;
  }

  const toggleGroup = (groupId: number) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavigation = (route: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(route, '_blank');
    } else {
      router.push(route);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prontivus_access_token');
        localStorage.removeItem('clinicore_access_token');
        localStorage.removeItem('refresh_token');
      }
      await logout();
      router.push('/login');
    } catch (e) {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const renderNavItem = (item: MenuItem) => {
    const active = pathname === item.route || pathname?.startsWith(item.route + '/');
    const IconComponent = item.icon ? getIconFromName(item.icon) : null;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.route, item.is_external)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative ml-4 text-left",
          active
            ? `bg-white ${roleStyles.accent} font-semibold shadow-sm`
            : "text-white/90 hover:text-white hover:bg-white/10"
        )}
      >
        {active && (
          <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full", roleStyles.sidebar.replace('700', '600'))} />
        )}
        {IconComponent && (
          <IconComponent
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              active ? roleStyles.accent : "text-white/90"
            )}
          />
        )}
        <span className="text-sm font-medium flex-1">{item.name}</span>
        {item.badge && (
          <span className={cn("px-2 py-0.5 text-xs rounded-full", roleStyles.accent.replace('text-', 'bg-').replace('-700', '-100'))}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href={getRoleLandingPage(user)} className="flex items-center w-full">
          <Image
            src={"/Logo/Logotipo em Fundo Transparente.png"}
            alt="Prontivus"
            width={240}
            height={240}
            loading="lazy"
            className="w-full h-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuLoading ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : menuGroups.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-white/70 text-sm">Nenhum item de menu disponível</p>
          </div>
        ) : (
          menuGroups.map((group) => {
            const GroupIcon = group.icon ? getIconFromName(group.icon) : null;
            const isOpen = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1">
                {group.items.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-4 py-2 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {GroupIcon && <GroupIcon className="h-4 w-4" />}
                        <span>{group.name}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="space-y-0.5 ml-2 border-l border-white/10 pl-2">
                        {group.items.map((item) => renderNavItem(item))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Footer */}
      <div className={cn("px-4 py-4 border-t border-white/10 bg-white/5", roleStyles.sidebar)}>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="bg-white/20 text-white border-white/20 font-semibold">
              {user.first_name && user.last_name
                ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                : user.username[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </div>
            <div className="text-white/70 text-xs truncate">
              {user.role_name || user.role}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  // Mobile sidebar
  const MobileSidebar = () => (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-700 text-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className={cn("lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transform transition-transform duration-300 ease-in-out", roleStyles.sidebar)}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Image
                src={"/Logo/Logotipo em Fundo Transparente.png"}
                alt="Prontivus"
                width={200}
                height={200}
                className="h-10 w-auto"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      <MobileSidebar />
      <aside className={cn("hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] z-30", roleStyles.sidebar, className)}>
        <SidebarContent />
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Confirmar Saída"
        description="Tem certeza que deseja sair da aplicação? Você precisará fazer login novamente para acessar o sistema."
        confirmText="Sair"
        cancelText="Cancelar"
        variant="destructive"
        loading={loggingOut}
        onConfirm={confirmLogout}
      />
    </>
  );
}

