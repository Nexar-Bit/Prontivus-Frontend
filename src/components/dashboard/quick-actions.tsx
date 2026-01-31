"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  Stethoscope,
  BarChart3,
  Package,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
  requiredRole?: string | string[];
  requiredModule?: string;
}

/**
 * Check if a route is accessible based on user permissions
 */
const canAccessRoute = (
  route: string,
  permissions: ReturnType<typeof usePermissions>
): boolean => {
  const {
    isAdmin,
    isSecretary,
    isDoctor,
    isPatient,
    canAccessFinancial,
    canAccessClinical,
    canAccessAppointments,
    canAccessPatients,
    canAccessReports,
    canAccessInventory,
  } = permissions;

  // Route-based access control
  const routeAccessMap: Record<string, () => boolean> = {
    // Patient routes
    '/patient': () => isPatient(),
    '/patient/appointments': () => isPatient() && canAccessAppointments(),
    '/patient/test-results': () => isPatient(),
    '/patient/messages': () => isPatient(),
    '/patient/prescriptions': () => isPatient(),
    '/patient/health': () => isPatient(),
    '/patient/billing': () => isPatient(),
    '/patient/profile': () => isPatient(),
    '/patient/help': () => isPatient(),
    '/patient/notes': () => isPatient(),
    '/patient/dashboard': () => isPatient(),
    
    // Doctor routes
    '/medico': () => isDoctor(),
    '/medico/dashboard': () => isDoctor(),
    '/medico/agendamentos': () => isDoctor() && canAccessAppointments(),
    '/medico/prontuarios': () => isDoctor() && canAccessClinical(),
    '/medico/atendimento/fila': () => isDoctor() && canAccessClinical(),
    '/medico/financeiro': () => isDoctor() && canAccessFinancial(),
    '/medico/estoque': () => isDoctor() && canAccessInventory(),
    
    // Secretary routes
    '/secretaria': () => isSecretary(),
    '/secretaria/dashboard': () => isSecretary(),
    '/secretaria/agendamentos': () => isSecretary() && canAccessAppointments(),
    '/secretaria/cadastros/pacientes': () => isSecretary() && canAccessPatients(),
    '/secretaria/cadastros': () => isSecretary(),
    '/secretaria/relatorios': () => isSecretary() && canAccessReports(),
    
    // Admin routes
    '/admin': () => isAdmin(),
    '/admin/dashboard': () => isAdmin(),
    '/admin/cadastros': () => isAdmin(),
    '/admin/cadastros/pacientes': () => isAdmin() && canAccessPatients(),
    '/admin/cadastros/medicos': () => isAdmin(),
    '/admin/cadastros/produtos': () => isAdmin() && canAccessInventory(),
    '/admin/cadastros/insumos': () => isAdmin() && canAccessInventory(),
    '/admin/configuracoes': () => isAdmin(),
    '/admin/configuracoes/clinica': () => isAdmin(),
    '/admin/relatorios': () => isAdmin() && canAccessReports(),
    
    // Super Admin routes
    '/super-admin': () => isAdmin(), // Assuming SuperAdmin is also admin role
    '/super-admin/configuracoes/clinica': () => isAdmin(),
    '/super-admin/integracoes': () => isAdmin(),
    
    // General routes
    '/relatorios': () => canAccessReports(),
    '/estoque': () => canAccessInventory(),
  };

  // Check exact route match first
  if (routeAccessMap[route]) {
    return routeAccessMap[route]();
  }

  // Check prefix matches
  for (const [routePrefix, checkAccess] of Object.entries(routeAccessMap)) {
    if (route.startsWith(routePrefix)) {
      return checkAccess();
    }
  }

  // Default: allow access if user is authenticated
  return true;
};

const getActionsByRole = (
  role?: string,
  permissions?: ReturnType<typeof usePermissions>
): QuickAction[] => {
  if (!permissions) {
    return [];
  }

  const {
    isAdmin,
    isSecretary,
    isDoctor,
    isPatient,
    canAccessFinancial,
    canAccessClinical,
    canAccessAppointments,
    canAccessPatients,
    canAccessReports,
    canAccessInventory,
  } = permissions;

  const allActions: QuickAction[] = [
    // Patient actions
    {
      label: 'Agendar Consulta',
      icon: Calendar,
      route: '/patient/appointments',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      requiredRole: 'patient',
      requiredModule: 'appointments',
    },
    {
      label: 'Ver Exames',
      icon: FileText,
      route: '/patient/test-results',
      color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
      requiredRole: 'patient',
    },
    {
      label: 'Mensagens',
      icon: FileText,
      route: '/patient/messages',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
      requiredRole: 'patient',
    },
    
    // Doctor actions
    {
      label: 'Fila de Atendimento',
      icon: Stethoscope,
      route: '/medico/atendimento/fila',
      color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
      requiredRole: 'doctor',
      requiredModule: 'clinical',
    },
    {
      label: 'Ver Prontuários',
      icon: FileText,
      route: '/medico/prontuarios',
      color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
      requiredRole: 'doctor',
      requiredModule: 'clinical',
    },
    {
      label: 'Agendamentos',
      icon: Calendar,
      route: '/medico/agendamentos',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      requiredRole: 'doctor',
      requiredModule: 'appointments',
    },
    {
      label: 'Financeiro',
      icon: BarChart3,
      route: '/medico/financeiro/dashboard',
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200',
      requiredRole: 'doctor',
      requiredModule: 'financial',
    },
    
    // Secretary/Admin actions
    {
      label: 'Novo Paciente',
      icon: UserPlus,
      route: '/secretaria/cadastros/pacientes',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      requiredRole: ['secretary', 'admin'],
      requiredModule: 'patients',
    },
    {
      label: 'Agendar Consulta',
      icon: Calendar,
      route: '/secretaria/agendamentos',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
      requiredRole: ['secretary', 'admin'],
      requiredModule: 'appointments',
    },
    {
      label: 'Ver Relatórios',
      icon: BarChart3,
      route: '/admin/relatorios',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
      requiredRole: ['secretary', 'admin'],
      requiredModule: 'bi',
    },
    {
      label: 'Gerenciar Estoque',
      icon: Package,
      route: '/admin/cadastros/insumos',
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
      requiredRole: ['secretary', 'admin'],
      requiredModule: 'stock',
    },
    
    // Admin-only actions
    {
      label: 'Gerenciar Médicos',
      icon: Users,
      route: '/admin/cadastros/medicos',
      color: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
      requiredRole: 'admin',
    },
    {
      label: 'Configurações',
      icon: Settings,
      route: '/admin/configuracoes/clinica',
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
      requiredRole: 'admin',
    },
  ];

  // Filter actions based on user permissions
  return allActions.filter((action) => {
    // Check role requirement
    if (action.requiredRole) {
      const requiredRoles = Array.isArray(action.requiredRole)
        ? action.requiredRole
        : [action.requiredRole];
      
      const hasRequiredRole = requiredRoles.some((r) => {
        if (r === 'patient') return isPatient();
        if (r === 'doctor') return isDoctor();
        if (r === 'secretary') return isSecretary();
        if (r === 'admin') return isAdmin();
        return false;
      });
      
      if (!hasRequiredRole) return false;
    }

    // Check module requirement
    if (action.requiredModule) {
      if (action.requiredModule === 'financial' && !canAccessFinancial()) return false;
      if (action.requiredModule === 'clinical' && !canAccessClinical()) return false;
      if (action.requiredModule === 'appointments' && !canAccessAppointments()) return false;
      if (action.requiredModule === 'patients' && !canAccessPatients()) return false;
      if (action.requiredModule === 'bi' && !canAccessReports()) return false;
      if (action.requiredModule === 'stock' && !canAccessInventory()) return false;
    }

    // Check route access
    return canAccessRoute(action.route, permissions);
  });
};

export function QuickActions({ role }: { role?: string }) {
  const router = useRouter();
  const permissions = usePermissions();
  const actions = getActionsByRole(role, permissions);

  if (actions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Nenhuma ação disponível
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-auto py-3 px-4 border-2 transition-all hover:shadow-sm",
              action.color
            )}
            onClick={() => router.push(action.route)}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

