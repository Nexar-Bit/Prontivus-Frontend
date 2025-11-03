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

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
}

const getActionsByRole = (role?: string): QuickAction[] => {
  const baseActions: QuickAction[] = [
    {
      label: 'Novo Paciente',
      icon: UserPlus,
      route: '/secretaria/pacientes/new',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
    },
    {
      label: 'Agendar Consulta',
      icon: Calendar,
      route: '/secretaria/agendamentos/new',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200',
    },
  ];

  if (role === 'doctor') {
    return [
      {
        label: 'Iniciar Consulta',
        icon: Stethoscope,
        route: '/medico/atendimentos',
        color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
      },
      {
        label: 'Ver Prontuários',
        icon: FileText,
        route: '/medico/prontuarios',
        color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
      },
      ...baseActions,
    ];
  }

  if (role === 'secretary' || role === 'admin') {
    return [
      ...baseActions,
      {
        label: 'Ver Relatórios',
        icon: BarChart3,
        route: '/relatorios',
        color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
      },
      {
        label: 'Gerenciar Estoque',
        icon: Package,
        route: '/estoque',
        color: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
      },
    ];
  }

  if (role === 'admin') {
    return [
      ...baseActions,
      {
        label: 'Usuários',
        icon: Users,
        route: '/admin/usuarios',
        color: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
      },
      {
        label: 'Configurações',
        icon: Settings,
        route: '/admin/settings',
        color: 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200',
      },
    ];
  }

  return baseActions;
};

export function QuickActions({ role }: { role?: string }) {
  const router = useRouter();
  const actions = getActionsByRole(role);

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

