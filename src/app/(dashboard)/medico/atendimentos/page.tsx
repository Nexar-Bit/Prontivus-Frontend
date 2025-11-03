"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const statusOrder: Record<AppointmentStatus, number> = {
  checked_in: 0,
  scheduled: 1,
  in_consultation: 2,
  completed: 3,
  cancelled: 4,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Atendimentos de Hoje</h1>
          <p className="text-sm text-muted-foreground">Lista de pacientes agendados e em espera</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum atendimento hoje.</div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const dt = new Date(a.scheduled_datetime);
                const canStart = (a.status as AppointmentStatus) === 'scheduled' || (a.status as AppointmentStatus) === 'checked_in';
                const inProgress = (a.status as AppointmentStatus) === 'in_consultation';
                return (
                  <div key={a.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {format(dt, 'HH:mm')}
                      </div>
                      <div className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground"/> {a.patient_name || `Paciente #${a.patient_id}`}
                      </div>
                      {a.reason && <div className="text-sm text-muted-foreground truncate">{a.reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/medico/atendimento/${a.id}`}>
                        <Button size="sm">{inProgress ? 'Continuar' : canStart ? 'Iniciar' : 'Abrir'}</Button>
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


