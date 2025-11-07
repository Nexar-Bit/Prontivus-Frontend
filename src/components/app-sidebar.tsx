"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Stethoscope,
  ClipboardList,
  DollarSign,
  Receipt,
  FileCode,
  Clock,
  Zap,
  Package,
  BarChart3,
  Shield,
  Building2,
  UserCheck,
  Activity,
  Microscope,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  Database,
  UserCog,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PatientProfileIcon,
  StethoscopeIcon,
  MedicalCalendarIcon,
  PrescriptionPadIcon,
  LaboratoryFlaskIcon,
  PharmacyBottleIcon,
  MedicalFinanceIcon,
  SecureLockIcon,
} from "@/components/icons";

// Define user roles and their permissions
const ROLES = {
  ADMIN: 'admin',
  SECRETARY: 'secretary', 
  DOCTOR: 'doctor',
  PATIENT: 'patient'
} as const;

// Helper function to get module display name
const getModuleName = (module: string | null): string => {
  const moduleNames: Record<string, string> = {
    'patients': 'Pacientes',
    'appointments': 'Agendamentos',
    'clinical': 'Clínico',
    'financial': 'Financeiro',
    'tiss': 'TISS',
    'stock': 'Estoque',
    'procedures': 'Procedimentos',
    'bi': 'Relatórios',
    null: 'Geral'
  };
  return moduleNames[module || 'null'] || module || 'Geral';
};

// Role-based menu items configuration
const getMenuItemsByRole = (role: string, activeModules: string[]) => {
  const baseItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR, ROLES.PATIENT],
      module: null,
    },
  ];

  const patientItems = [
    {
      title: "Meus Agendamentos",
      icon: Calendar,
      url: "/portal/appointments",
      roles: [ROLES.PATIENT],
      module: null,
    },
    {
      title: "Minhas Consultas",
      icon: FileText,
      url: "/portal/consultations",
      roles: [ROLES.PATIENT],
      module: null,
    },
    {
      title: "Meu Perfil",
      icon: UserCheck,
      url: "/portal/profile",
      roles: [ROLES.PATIENT],
      module: null,
    },
  ];

  const doctorItems = [
    {
      title: "Agenda do Dia",
      icon: Calendar,
      url: "/medico/agenda",
      roles: [ROLES.DOCTOR],
      module: "appointments",
    },
    {
      title: "Atendimentos",
      icon: Stethoscope,
      url: "/medico/atendimentos",
      roles: [ROLES.DOCTOR],
      module: "clinical",
    },
    {
      title: "Prontuários",
      icon: FileText,
      url: "/medico/prontuarios",
      roles: [ROLES.DOCTOR],
      module: "clinical",
    },
    {
      title: "Prescrições",
      icon: ClipboardList,
      url: "/medico/prescricoes",
      roles: [ROLES.DOCTOR],
      module: "clinical",
    },
    {
      title: "Exames",
      icon: Microscope,
      url: "/medico/exames",
      roles: [ROLES.DOCTOR],
      module: "clinical",
    },
  ];

  const secretaryItems = [
    {
      title: "Pacientes",
      icon: Users,
      url: "/secretaria/pacientes",
      roles: [ROLES.SECRETARY],
      module: "patients",
    },
    {
      title: "Agendamentos",
      icon: Calendar,
      url: "/secretaria/agendamentos",
      roles: [ROLES.SECRETARY],
      module: "appointments",
    },
    {
      title: "Recepção",
      icon: UserCheck,
      url: "/secretaria/recepcao",
      roles: [ROLES.SECRETARY],
      module: "appointments",
    },
    {
      title: "Cadastros",
      icon: Database,
      url: "/secretaria/cadastros",
      roles: [ROLES.SECRETARY],
      module: "patients",
    },
    {
      title: "Consultas",
      icon: FileText,
      url: "/secretaria/consultas",
      roles: [ROLES.SECRETARY],
      module: "clinical",
    },
    {
      title: "Médicos",
      icon: Stethoscope,
      url: "/secretaria/medicos",
      roles: [ROLES.SECRETARY],
      module: null,
    },
  ];

  const adminItems = [
    {
      title: "Usuários",
      icon: UserCog,
      url: "/admin/usuarios",
      roles: [ROLES.ADMIN],
      module: null,
    },
    {
      title: "Gestão de Clínicas",
      icon: Building2,
      url: "/admin/clinics",
      roles: [ROLES.ADMIN],
      module: null,
    },
    {
      title: "Configurações do Sistema",
      icon: Settings,
      url: "/admin/settings",
      roles: [ROLES.ADMIN],
      module: null,
    },
    {
      title: "Logs do Sistema",
      icon: Activity,
      url: "/admin/logs",
      roles: [ROLES.ADMIN],
      module: null,
    },
    {
      title: "Status da Migração",
      icon: BarChart3,
      url: "/migration",
      roles: [ROLES.ADMIN],
      module: null,
    },
  ];

  const sharedItems = [
    {
      title: "Procedimentos",
      icon: Stethoscope,
      url: "/procedimentos",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],
      module: "procedures",
    },
    {
      title: "Estoque",
      icon: Package,
      url: "/estoque",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "stock",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      url: "/relatorios",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],
      module: "bi",
    },
    {
      title: "Relatórios Clínicos",
      icon: Activity,
      url: "/relatorios/clinico",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],
      module: "bi",
    },
    {
      title: "Relatórios Financeiros",
      icon: TrendingUp,
      url: "/relatorios/financeiro",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "bi",
    },
    {
      title: "Relatórios Operacionais",
      icon: Clock,
      url: "/relatorios/operacional",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],
      module: "bi",
    },
    {
      title: "Construtor de Relatórios",
      icon: FileSpreadsheet,
      url: "/relatorios/custom",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "bi",
    },
    {
      title: "Notificações",
      icon: Bell,
      url: "/notificacoes",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR, ROLES.PATIENT],
      module: null,
    },
  ];

  // Combine all items based on role
  let allItems = [...baseItems];
  
  if (role === ROLES.PATIENT) {
    allItems = [...allItems, ...patientItems];
  } else if (role === ROLES.DOCTOR) {
    allItems = [...allItems, ...doctorItems, ...sharedItems] as any;
  } else if (role === ROLES.SECRETARY) {
    allItems = [...allItems, ...secretaryItems, ...sharedItems] as any;
  } else if (role === ROLES.ADMIN) {
    allItems = [...allItems, ...adminItems, ...sharedItems] as any;
  }

  // Filter by active modules
  return allItems.filter(item => {
    if (!item.module) return true;
    if (activeModules.length === 0) {
      const coreModules = ['patients', 'appointments', 'clinical'];
      if (coreModules.includes(item.module)) {
        return true;
      }
    }
    return activeModules.includes(item.module);
  });
};

// Financial items for admin and secretary roles
const getFinancialItems = (role: string, activeModules: string[]) => {
  const financialItems = [
    {
      title: "Faturamento Básico",
      icon: Receipt,
      url: "/financeiro/basico",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: null,
    },
    {
      title: "Faturamento",
      icon: Receipt,
      url: "/financeiro/faturamento",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "financial",
    },
    {
      title: "Pagamentos",
      icon: CreditCard,
      url: "/financeiro/pagamentos",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "financial",
    },
    {
      title: "Itens de Serviço",
      icon: DollarSign,
      url: "/financeiro/servicos",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "financial",
    },
    {
      title: "Códigos TUSS",
      icon: FileCode,
      url: "/financeiro/tuss-codes",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "financial",
    },
    {
      title: "Relatórios Financeiros",
      icon: TrendingUp,
      url: "/financeiro/relatorios",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "financial",
    },
  ];

  return financialItems.filter(item => {
    if (!item.roles.includes(role as any)) return false;
    if (!item.module) return true;
    if (activeModules.length === 0) {
      const basicFinancialModules = ['financial'];
      if (basicFinancialModules.includes(item.module)) {
        return true;
      }
    }
    return activeModules.includes(item.module);
  });
};

// TISS items grouped together
const getTissItems = (role: string, activeModules: string[]) => {
  const tissItems = [
    {
      title: "Validador TISS",
      icon: FileCode,
      url: "/financeiro/tiss-validator",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "tiss",
    },
    {
      title: "Histórico TISS",
      icon: Clock,
      url: "/financeiro/tiss-history",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "tiss",
    },
    {
      title: "Templates TISS",
      icon: FileCode,
      url: "/financeiro/tiss-templates",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "tiss",
    },
    {
      title: "Automação TISS",
      icon: Zap,
      url: "/financeiro/tiss-automation",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "tiss",
    },
    {
      title: "Configurações TISS",
      icon: Settings,
      url: "/financeiro/tiss-config",
      roles: [ROLES.ADMIN, ROLES.SECRETARY],
      module: "tiss",
    },
  ];

  return tissItems.filter(item => {
    if (!item.roles.includes(role as any)) return false;
    return activeModules.length === 0 || activeModules.includes(item.module);
  });
};

// Settings items
const getSettingsItems = (role: string) => {
  const baseSettings = [
    {
      title: "Configurações",
      icon: Settings,
      url: "/settings",
      roles: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR, ROLES.PATIENT],
    },
  ];

  const adminSettings = [
    {
      title: "Configurações do Sistema",
      icon: Shield,
      url: "/admin/settings",
      roles: [ROLES.ADMIN],
    },
  ];

  let settings = [...baseSettings];
  if (role === ROLES.ADMIN) {
    settings = [...settings, ...adminSettings];
  }

  return settings.filter(item => item.roles.includes(role as any));
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  if (!user) {
    return null;
  }
  
  // Get active modules from user's clinic
  const activeModules = user?.clinic?.active_modules || [];
  
  // Get menu items based on user role
  const menuItemsRaw = getMenuItemsByRole(user.role, activeModules)
    .filter((i: any) => i.roles?.includes(user.role));
  const menuItemsMap = new Map<string, any>();
  for (const item of menuItemsRaw) {
    if (!menuItemsMap.has(item.url)) menuItemsMap.set(item.url, item);
  }
  const menuItems = Array.from(menuItemsMap.values());
  const financialItems = getFinancialItems(user.role, activeModules);
  const tissItems = getTissItems(user.role, activeModules);
  const settingsItems = getSettingsItems(user.role);
  
  // Group items by module
  const itemsByModule = new Map<string | null, any[]>();
  const seenUrls = new Set<string>();
  
  menuItems.forEach(item => {
    if (item.url?.startsWith('/financeiro')) {
      return;
    }
    const module = item.module;
    if (!itemsByModule.has(module)) {
      itemsByModule.set(module, []);
    }
    if (!seenUrls.has(item.url)) {
      itemsByModule.get(module)!.push(item);
      seenUrls.add(item.url);
    }
  });
  
  if (financialItems.length > 0) {
    itemsByModule.set('financial', [...financialItems]);
  }
  
  if (tissItems.length > 0) {
    itemsByModule.set('tiss', tissItems);
  }
  
  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.SECRETARY]: 'Secretária',
      [ROLES.DOCTOR]: 'Médico',
      [ROLES.PATIENT]: 'Paciente'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };
  
  // State for collapsible groups
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    'patients': true,
    'appointments': true,
    'clinical': true,
    'financial': true,
    'tiss': true,
    'stock': true,
    'procedures': true,
    'bi': true,
    'null': true,
  });

  const toggleGroup = (module: string | null) => {
    const key = module || 'null';
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sort modules for display order
  const moduleOrder = ['null', 'patients', 'appointments', 'clinical', 'financial', 'tiss', 'stock', 'procedures', 'bi'];
  const sortedModules = Array.from(itemsByModule.keys()).sort((a, b) => {
    const aIdx = moduleOrder.indexOf(a || 'null');
    const bIdx = moduleOrder.indexOf(b || 'null');
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const renderNavItem = (item: any, module: string | null = null) => {
    const active = pathname === item.url || pathname?.startsWith(item.url + '/');
    const Icon = item.icon;
    
    return (
      <Link
        href={item.url}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group",
          active
            ? "bg-white text-[#0F4C75] font-semibold shadow-sm"
            : "text-white/90 hover:text-white hover:bg-white/10"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Left accent bar for active state */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0F4C75] rounded-r-full" />
        )}
        
        {/* Icon */}
        <Icon 
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            active ? "text-[#0F4C75]" : "text-white/90 group-hover:text-white"
          )} 
        />
        
        {/* Label */}
        <span className="text-sm font-medium">{item.title}</span>
      </Link>
    );
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username[0]?.toUpperCase() || 'U';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={"/Logo/Prontivus Horizontal Transparents.png"}
            alt="Prontivus"
            width={240}
            height={44}
            priority
            className="h-14 w-auto"
          />
        </Link>
        <p className="text-white/70 text-xs mt-2 ml-1">Cuidado Inteligente</p>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scrollbar">
        {/* Dashboard - Always visible */}
        {menuItems.filter(m => m.url === '/').map(item => (
          <div key={item.url}>{renderNavItem(item)}</div>
        ))}

        {/* Render grouped modules */}
        {sortedModules
          .filter(module => module !== null || (itemsByModule.get(module)?.length ?? 0) > 1 || itemsByModule.get(module)?.[0]?.url !== '/')
          .map(module => {
            const items = itemsByModule.get(module)!;
            if (!items || items.length === 0) return null;
            
            const moduleKey = module || 'null';
            const isOpen = openGroups[moduleKey] ?? true;
            const moduleName = getModuleName(module);
            
            // Single item modules - render directly
            if (items.length === 1 && module !== null) {
              return (
                <div key={moduleKey}>
                  {renderNavItem(items[0], module)}
                </div>
              );
            }
            
            // Multi-item modules - collapsible group
            if (items.length > 1) {
              return (
                <div key={moduleKey} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(module)}
                    className="w-full flex items-center justify-between px-4 py-2 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <span>{moduleName}</span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5 ml-2 border-l border-white/10 pl-2">
                      {items.map(item => (
                        <div key={item.url}>{renderNavItem(item, module)}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })}

        {/* System Settings */}
        {settingsItems.length > 0 && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="px-4 py-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
              Sistema
            </div>
            <div className="space-y-0.5 mt-1">
              {settingsItems.map(item => (
                <div key={item.url}>{renderNavItem(item)}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="px-4 py-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarFallback className="bg-white/10 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </div>
            <div className="text-white/70 text-xs truncate">
              {getRoleDisplayName(user.role)}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
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
          className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  // Mobile sidebar with slide-over
  const MobileSidebar = () => (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0F4C75] text-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Slide-over panel */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar panel */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0F4C75] shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Image
                src={"/Logo/Prontivus Horizontal Transparents.png"}
                alt="Prontivus"
                width={200}
                height={37}
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
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-[#0F4C75] z-30 medical-pattern">
        <SidebarContent />
      </aside>
    </>
  );
}
