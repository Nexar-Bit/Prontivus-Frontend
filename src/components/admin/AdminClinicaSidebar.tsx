"use client";

import * as React from "react";
import {
  Settings2,
  Building,
  Users,
  UserCog2,
  ShoppingCart,
  Package2,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  UserRound,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserSettings } from "@/lib/settings-api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// AdminClinica menu structure
const ADMIN_CLINICA_MENU = [
  {
    group: "Configurações",
    icon: Settings2,
    items: [
      {
        title: "Clínica",
        icon: Building,
        url: "/admin/configuracoes/clinica",
      },
    ],
  },
  {
    group: "Cadastros",
    icon: Users,
    items: [
      {
        title: "Usuários",
        icon: Users,
        url: "/admin/cadastros/usuarios",
      },
      {
        title: "Pacientes",
        icon: Users,
        url: "/admin/cadastros/pacientes",
      },
      {
        title: "Médicos",
        icon: UserCog2,
        url: "/admin/cadastros/medicos",
      },
      {
        title: "Produtos",
        icon: ShoppingCart,
        url: "/admin/cadastros/produtos",
      },
      {
        title: "Exames",
        icon: Package2,
        url: "/admin/cadastros/exames",
      },
      {
        title: "Formas de Pagamento",
        icon: CreditCard,
        url: "/admin/cadastros/formas-pagamento",
      },
    ],
  },
  {
    group: "Relatórios",
    icon: FileText,
    items: [
      {
        title: "Configurações",
        icon: FileText,
        url: "/admin/relatorios/configuracoes",
      },
    ],
  },
];

export function AdminClinicaSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    Configurações: true,
    Cadastros: true,
    Relatórios: true,
  });

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
        // Avatar loading is non-critical - fail silently
        if (process.env.NODE_ENV === 'development') {
          console.debug('Avatar not available:', error instanceof Error ? error.message : 'Unknown error');
        }
        setAvatarUrl(null);
      }
    };

    loadAvatar();
  }, [user]);

  if (!user) {
    return null;
  }

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const renderNavItem = (item: { title: string; icon: any; url: string }, groupName: string) => {
    const active = pathname === item.url || pathname?.startsWith(item.url + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.url}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group ml-4",
          active
            ? "bg-white text-blue-700 font-semibold shadow-sm"
            : "text-white/90 hover:text-white hover:bg-white/10"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
        )}
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            active ? "text-blue-700" : "text-white/90 group-hover:text-white"
          )}
        />
        <span className="text-sm font-medium">{item.title}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center w-full">
          <Image
            src={"/Logo/Logotipo em Fundo Transparente.png"}
            alt="Prontivus"
            width={240}
            height={240}
            loading="lazy"
            className="w-full h-auto object-contain"
          />
        </Link>
        <div className="mt-4 px-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/30 rounded-lg border border-blue-400/30">
            <ShieldCheck className="h-4 w-4 text-blue-200" />
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
              Administrador
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scrollbar">
        {ADMIN_CLINICA_MENU.map((menuGroup) => {
          const GroupIcon = menuGroup.icon;
          const isOpen = openGroups[menuGroup.group] ?? true;

          return (
            <div key={menuGroup.group} className="space-y-1">
              <button
                onClick={() => toggleGroup(menuGroup.group)}
                className="w-full flex items-center justify-between px-4 py-2 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-4 w-4" />
                  <span>{menuGroup.group}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {isOpen && (
                <div className="space-y-0.5 ml-2 border-l border-white/10 pl-2">
                  {menuGroup.items.map((item) => (
                    <div key={item.url}>
                      {renderNavItem(item, menuGroup.group)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="px-4 py-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-blue-300/30">
            <AvatarImage src={avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="bg-blue-400/20 text-blue-200 border-blue-300/30 font-semibold">
              {avatarUrl ? (
                <UserRound className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </div>
            <div className="text-white/70 text-xs truncate">
              Administrador da Clínica
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
        onConfirm={async () => {
          try {
            setLoggingOut(true);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('prontivus_access_token');
              localStorage.removeItem('refresh_token');
            }
            await logout();
            router.push('/login');
          } catch (e) {
            router.push('/login');
          } finally {
            setLoggingOut(false);
          }
        }}
      />
    </div>
  );

  // Mobile sidebar with slide-over
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
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-blue-700 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Image
                src={"/Logo/Logotipo em Fundo Transparente.png"}
                alt="Prontivus"
                width={200}
                height={200}
                className="h-10 w-auto"
                style={{ height: 40, width: "auto" }}
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
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-blue-700 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}

