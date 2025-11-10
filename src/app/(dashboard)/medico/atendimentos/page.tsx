"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  User, 
  RefreshCw,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusOrder: Record<AppointmentStatus, number> = {
  checked_in: 0,
  scheduled: 1,
  in_consultation: 2,
  completed: 3,
  cancelled: 4,
};

const statusBadgeColor: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  checked_in: "bg-orange-100 text-orange-800 border-orange-200",
  in_consultation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  checked_in: "Aguardando",
  in_consultation: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function MedicoAtendimentosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const data = await appointmentsApi.getAll({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        doctor_id: user.id,
      });
      setItems(
        data.sort((a, b) => {
          const so = (statusOrder[a.status as AppointmentStatus] ?? 9) - (statusOrder[b.status as AppointmentStatus] ?? 9);
          if (so !== 0) return so;
          return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
        })
      );
    } catch (e: any) {
      toast.error("Erro ao carregar atendimentos", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  // Calculate statistics
  const stats = {
    total: items.length,
    waiting: items.filter(a => a.status === "checked_in" || a.status === "scheduled").length,
    inProgress: items.filter(a => a.status === "in_consultation").length,
    completed: items.filter(a => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="h-7 w-7 text-blue-600" />
            </div>
            Atendimentos de Hoje
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Lista de pacientes agendados e em espera para atendimento
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={load} 
          disabled={loading}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Atendimentos
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Para hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Na fila de espera
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Finalizados hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription className="mt-1">
                Lista completa de atendimentos do dia
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum atendimento hoje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const dt = new Date(a.scheduled_datetime);
                const status = a.status as AppointmentStatus;
                const canStart = status === 'scheduled' || status === 'checked_in';
                const inProgress = status === 'in_consultation';
                return (
                  <div 
                    key={a.id} 
                    className={cn(
                      "border-2 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all",
                      status === "completed" && "border-green-200 bg-green-50/30",
                      status === "in_consultation" && "border-yellow-200 bg-yellow-50/30",
                      status === "checked_in" && "border-orange-200 bg-orange-50/30",
                      status === "scheduled" && "border-blue-200 bg-blue-50/30",
                      status === "cancelled" && "border-gray-200 bg-gray-50/30"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          status === "completed" && "bg-green-100",
                          status === "in_consultation" && "bg-yellow-100",
                          status === "checked_in" && "bg-orange-100",
                          status === "scheduled" && "bg-blue-100",
                          status === "cancelled" && "bg-gray-100"
                        )}>
                          <Clock className={cn(
                            "h-4 w-4",
                            status === "completed" && "text-green-600",
                            status === "in_consultation" && "text-yellow-600",
                            status === "checked_in" && "text-orange-600",
                            status === "scheduled" && "text-blue-600",
                            status === "cancelled" && "text-gray-600"
                          )} />
                        </div>
                        <span className="font-semibold text-lg">{format(dt, 'HH:mm')}</span>
                        <Badge className={cn("border", statusBadgeColor[status])}>
                          {statusLabel[status]}
                        </Badge>
                      </div>
                      <div className="font-semibold text-base flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-blue-600"/> 
                        {a.patient_name || `Paciente #${a.patient_id}`}
                      </div>
                      {a.reason && (
                        <div className="text-sm text-muted-foreground truncate">
                          <span className="font-medium">Motivo:</span> {a.reason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/medico/atendimento/${a.id}`}>
                        <Button 
                          size="sm" 
                          className={cn(
                            inProgress && "bg-yellow-600 hover:bg-yellow-700",
                            canStart && "bg-blue-600 hover:bg-blue-700",
                            !inProgress && !canStart && "bg-gray-600 hover:bg-gray-700"
                          )}
                        >
                          {inProgress ? (
                            <>
                              <Activity className="h-3 w-3 mr-1" />
                              Continuar
                            </>
                          ) : canStart ? (
                            <>
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Iniciar
                            </>
                          ) : (
                            'Abrir'
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
