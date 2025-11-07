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
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";

interface ActivityItem {
  id: string;
  type: 'patient' | 'appointment' | 'result' | 'payment' | 'system';
  message: string;
  timestamp: Date;
  user?: string;
}

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
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Fetch recent appointments, patients, and system logs
        const [appointmentsRes, patientsRes, logsRes] = await Promise.allSettled([
          api.get<any[]>("/api/appointments?limit=5&order_by=created_at&order=desc"),
          api.get<any[]>("/api/patients?limit=5&order_by=created_at&order=desc"),
          api.get<any[]>("/api/admin/logs?limit=5").catch(() => ({ data: [] })),
        ]);

        const activitiesList: ActivityItem[] = [];

        // Process appointments
        if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value) {
          const appointments = Array.isArray(appointmentsRes.value) 
            ? appointmentsRes.value 
            : (appointmentsRes.value as any)?.data || [];
          appointments.slice(0, 3).forEach((apt: any) => {
            activitiesList.push({
              id: `appt-${apt.id}`,
              type: 'appointment',
              message: `Agendamento ${apt.status === 'completed' ? 'concluído' : 'agendado'}`,
              user: apt.patient?.name || apt.patient?.first_name || 'Paciente',
              timestamp: new Date(apt.created_at || apt.scheduled_datetime),
            });
          });
        }

        // Process patients
        if (patientsRes.status === 'fulfilled' && patientsRes.value) {
          const patients = Array.isArray(patientsRes.value) 
            ? patientsRes.value 
            : (patientsRes.value as any)?.data || [];
          patients.slice(0, 2).forEach((patient: any) => {
            activitiesList.push({
              id: `patient-${patient.id}`,
              type: 'patient',
              message: 'Novo paciente cadastrado',
              user: patient.name || `${patient.first_name} ${patient.last_name}`.trim() || 'Paciente',
              timestamp: new Date(patient.created_at),
            });
          });
        }

        // Process system logs
        if (logsRes.status === 'fulfilled' && logsRes.value) {
          const logs = Array.isArray(logsRes.value) 
            ? logsRes.value 
            : (logsRes.value as any)?.data || [];
          logs.slice(0, 2).forEach((log: any) => {
            activitiesList.push({
              id: `log-${log.id}`,
              type: 'system',
              message: log.message || 'Atividade do sistema',
              timestamp: new Date(log.timestamp),
            });
          });
        }

        // Sort by timestamp (newest first) and limit to 5
        activitiesList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(activitiesList.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        // Fallback to empty array
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando atividades...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Nenhuma atividade recente
      </div>
    );
  }

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
              "p-2 rounded-lg bg-white/80 shrink-0",
              colors.split(' ')[0]
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.message}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {activity.user && (
                  <>
                    <span className="text-xs text-gray-600">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                  </>
                )}
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

