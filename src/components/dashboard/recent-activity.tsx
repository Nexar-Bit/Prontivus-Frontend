"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Activity,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: 'patient' | 'appointment' | 'result' | 'payment' | 'system';
  message: string;
  timestamp: Date;
  user?: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'patient',
    message: 'Novo paciente cadastrado',
    user: 'João Silva',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    type: 'appointment',
    message: 'Agendamento confirmado',
    user: 'Maria Santos',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '3',
    type: 'result',
    message: 'Resultados de exames disponíveis',
    user: 'Pedro Costa',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'payment',
    message: 'Pagamento registrado',
    user: 'Ana Oliveira',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'system',
    message: 'Backup automático concluído',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'patient':
      return UserPlus;
    case 'appointment':
      return Calendar;
    case 'result':
      return FileText;
    case 'payment':
      return CheckCircle2;
    case 'system':
      return Activity;
    default:
      return Clock;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'patient':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'appointment':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'result':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'payment':
      return 'text-teal-600 bg-teal-50 border-teal-200';
    case 'system':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function RecentActivity() {
  const formatTime = (timestamp: Date) => {
    try {
      return formatDistanceToNow(timestamp, {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'agora';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        const colors = getActivityColor(activity.type);

        return (
          <div
            key={activity.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
              colors
            )}
          >
            <div className={cn(
              "p-2 rounded-lg bg-white/80",
              colors.split(' ')[0]
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.message}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {activity.user && (
                  <span className="text-xs text-gray-600">{activity.user}</span>
                )}
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

