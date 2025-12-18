"use client";

import * as React from "react";
import {
  Calendar,
  Pill,
  FlaskConical,
  HeartPulse,
  ClipboardList,
  MessageCircle,
  Wallet,
  UserCircle,
  Menu,
  X,
  LogOut,
  UserRound,
  Home,
  HelpCircle,
  Sparkles,
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

// Patient menu structure - Modernized with healthcare-appropriate icons
const PACIENTE_MENU = [
  {
    title: "Início",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Agendamentos",
    icon: Calendar,
    url: "/pacient/agendamentos",
  },
  {
    title: "Histórico de Medicações",
    icon: Pill,
    url: "/pacient/medicacoes",
  },
  {
    title: "Resultados Exames",
    icon: FlaskConical,
    url: "/pacient/exames",
  },
  {
    title: "Resumo de Saúde",
    icon: HeartPulse,
    url: "/pacient/saude",
  },
  {
    title: "Notas da Clínica",
    icon: ClipboardList,
    url: "/pacient/notas",
  },
  {
    title: "Mensagens",
    icon: MessageCircle,
    url: "/pacient/mensagens",
  },
  {
    title: "Pagamentos",
    icon: Wallet,
    url: "/pacient/pagamentos",
  },
  {
    title: "Perfil",
    icon: UserCircle,
    url: "/pacient/perfil",
  },
];

export function PacienteSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

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

  const renderNavItem = (item: { title: string; icon: any; url: string }) => {
    const active = pathname === item.url || pathname?.startsWith(item.url + '/');
    const Icon = item.icon;

    return (
      <Link
        href={item.url}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group",
          "hover:scale-[1.02] active:scale-[0.98]",
          active
            ? "bg-white text-teal-700 font-semibold shadow-lg shadow-teal-200/30"
            : "text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 hover:shadow-md"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {active && (
          <>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-teal-400 to-teal-500 rounded-r-full shadow-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-50/20 to-transparent rounded-xl" />
          </>
        )}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-300",
            active
              ? "bg-teal-100 shadow-sm"
              : "bg-teal-50/40 group-hover:bg-teal-100/60"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-all duration-300",
              active 
                ? "text-teal-600 scale-110" 
                : "text-slate-600 group-hover:text-teal-600 group-hover:scale-105"
            )}
          />
        </div>
        <span className={cn(
          "text-sm font-medium relative z-10 transition-all duration-300",
          active ? "text-teal-700" : "text-slate-700 group-hover:text-teal-700"
        )}>
          {item.title}
        </span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-teal-200/20 bg-gradient-to-b from-teal-50/30 to-transparent">
        <Link href="/" className="flex items-center w-full group">
          <Image
            src={"/Logo/Logotipo em Fundo Transparente.png"}
            alt="Prontivus"
            width={240}
            height={240}
            priority
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="mt-4 px-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-teal-100/40 backdrop-blur-sm rounded-xl border border-teal-200/30 shadow-lg">
            <div className="h-8 w-8 rounded-lg bg-teal-200/40 flex items-center justify-center">
              <HeartPulse className="h-4 w-4 text-teal-700" />
            </div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Paciente
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 sidebar-scrollbar">
        {PACIENTE_MENU.map((item) => (
          <div key={item.url} className="animate-in fade-in slide-in-from-left-2 duration-300">
            {renderNavItem(item)}
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="px-3 py-2 border-t border-teal-200/20 bg-gradient-to-t from-teal-50/40 to-transparent">
        <Link
          href="/pacient/ajuda"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
            "hover:scale-[1.02] active:scale-[0.98]",
            pathname === "/pacient/ajuda"
              ? "bg-white text-teal-700 font-semibold shadow-lg shadow-teal-200/30"
              : "text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 hover:shadow-md"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-300",
            pathname === "/pacient/ajuda"
              ? "bg-teal-100 shadow-sm"
              : "bg-teal-50/40 group-hover:bg-teal-100/60"
          )}>
            <HelpCircle className={cn(
              "h-5 w-5 shrink-0 transition-all duration-300",
              pathname === "/pacient/ajuda"
                ? "text-teal-600 scale-110"
                : "text-slate-600 group-hover:text-teal-600 group-hover:scale-105"
            )} />
          </div>
          <span className="text-sm font-medium">Precisa de Ajuda?</span>
        </Link>
      </div>

      {/* User Profile Footer */}
      <div className="px-4 py-4 border-t border-teal-200/20 bg-gradient-to-t from-teal-50/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-teal-50/40 hover:bg-teal-100/50 transition-all duration-300">
          <Avatar className="h-11 w-11 border-2 border-teal-200/50 shadow-lg ring-2 ring-teal-100/30">
            <AvatarImage src={avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="bg-gradient-to-br from-teal-200/50 to-teal-300/50 text-teal-700 border-teal-200/50 font-semibold backdrop-blur-sm">
              {avatarUrl ? (
                <UserRound className="h-5 w-5" />
              ) : (
                <HeartPulse className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-slate-700 font-semibold text-sm truncate">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </div>
            <div className="text-slate-500 text-xs truncate flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Paciente
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLogoutDialog(true)}
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-slate-700 hover:text-red-600 hover:bg-red-50/60 hover:border-red-200/50 border border-transparent rounded-xl transition-all duration-300 group"
        >
          <div className="h-8 w-8 rounded-lg bg-red-50/60 group-hover:bg-red-100/80 flex items-center justify-center transition-all duration-300">
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-sm font-medium">Sair</span>
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
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-xl shadow-teal-900/30 hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-teal-50 via-teal-50/95 to-teal-100 shadow-2xl shadow-teal-900/20 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-teal-200/30 bg-gradient-to-r from-teal-50/80 to-transparent">
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
                className="p-2.5 text-slate-700 hover:text-teal-700 hover:bg-teal-100/60 rounded-xl transition-all duration-300 hover:scale-110"
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
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-gradient-to-b from-teal-50 via-teal-50/95 to-teal-100 z-30 shadow-2xl shadow-teal-900/10 border-r border-teal-200/30">
        <SidebarContent />
      </aside>
    </>
  );
}

