"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar as RBCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAccessToken, verifyToken } from "@/lib/auth";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type EventType = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  status: AppointmentStatus;
};

const statusColor: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500",
  checked_in: "bg-orange-500",
  in_consultation: "bg-yellow-500",
  completed: "bg-green-600",
  cancelled: "bg-gray-400",
};

export default function SecretariaLancamentoPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [waiting, setWaiting] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const appts = await appointmentsApi.getAll({
        // Backend expects YYYY-MM-DD for start_date/end_date
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
      });

      const mapped: EventType[] = appts.map((a) => ({
        id: a.id,
        title: `${(a as any).patient?.first_name ?? "Paciente"} ${(a as any).patient?.last_name ?? ""}`.trim(),
        start: new Date(a.scheduled_datetime),
        end: new Date(new Date(a.scheduled_datetime).getTime() + ((a as any).duration_minutes || 30) * 60000),
        resource: a,
        status: a.status as AppointmentStatus,
      }));
      setEvents(mapped);
      setWaiting(appts.filter((a) => (a.status as AppointmentStatus) === "checked_in"));
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  // Basic WS subscription if available (optional)
  useEffect(() => {
    let ws: WebSocket | null = null;
    (async () => {
      try {
        const token = getAccessToken?.();
        if (!token) return;
        const ok = await verifyToken();
        if (!ok) return;
        const url = `ws://localhost:8000/api/appointments/ws/appointments?token=${encodeURIComponent(token)}`;
        ws = new WebSocket(url);
        ws.onopen = () => {
          console.log('WebSocket connected');
        };
        ws.onmessage = (event) => {
          console.log('WebSocket message:', event.data);
          fetchData();
        };
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
        };
      } catch (error) {
        console.error('WebSocket setup error:', error);
      }
    })();
    return () => {
      try { ws?.close(); } catch {}
    };
  }, []);

  const components = useMemo(
    () => ({
      event: ({ event }: { event: EventType }) => (
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${statusColor[event.status]}`} />
          <span>{event.title}</span>
        </div>
      ),
    }),
    []
  );

  const onSelectEvent = (event: EventType) => {
    const a = event.resource;
    const actions = [
      { key: "docs", label: "Upload Docs" },
      { key: "start", label: "Start Consultation" },
      { key: "cancel", label: "Cancel" },
    ];
    console.log("Quick actions", a.id, actions);
  };

  const reschedule = async (event: EventType, start: Date) => {
    const duration = (event.resource as any).duration_minutes || 30;
    try {
      await appointmentsApi.update(event.id, {
        scheduled_datetime: start.toISOString(),
        duration_minutes: duration,
      } as any);
      toast.success("Reagendado");
      fetchData();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao reagendar");
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-sky-700">Secretaria • Lançamento Diário</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="bg-sky-600 hover:bg-sky-700 text-white">Guia Convênio</Button>
          <Button variant="secondary" className="bg-emerald-600 hover:bg-emerald-700 text-white">Scanner</Button>
          <Button variant="default" className="bg-sky-700 hover:bg-sky-800 text-white">Check-in em Massa</Button>
          <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-700 hover:bg-emerald-800">Novo Check-in</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Check-in do Paciente</DialogTitle>
                <DialogDescription>
                  Preencha os dados do paciente para realizar o check-in
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Paciente</Label>
                  <Input placeholder="Buscar por nome ou CPF" />
                </div>
                <div>
                  <Label>Convênio</Label>
                  <Input placeholder="Plano / Nº Carteirinha" />
                </div>
                <div className="md:col-span-2">
                  <Label>Documentos</Label>
                  <div className="mt-1 h-24 border border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground">
                    Arraste e solte documentos aqui
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div>
                    <Label>PA</Label>
                    <Input placeholder="120/80" />
                  </div>
                  <div>
                    <Label>Temp</Label>
                    <Input placeholder="36.5" />
                  </div>
                  <div>
                    <Label>Peso</Label>
                    <Input placeholder="70kg" />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button variant="secondary">Verificar Cobertura</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Confirmar Check-in</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Agenda do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <RBCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              components={components}
              views={[Views.DAY]}
              defaultView={Views.DAY}
              onSelectEvent={onSelectEvent}
              selectable
              onSelectSlot={(slot) => {
                if (!slot?.start) return;
                // Quick reschedule via selecting a new slot for the first selected event
                // In real use, open a modal with details
                const e = events[0];
                if (e) reschedule(e, slot.start as Date);
              }}
            />
            <Separator className="my-3" />
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" />Agendado</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" />Check-in</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-500" />Em atendimento</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-600" />Concluído</div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fila de Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
              {waiting.map((w) => (
                <div key={w.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">
                      {(w as any).patient?.first_name?.[0] ?? "P"}
                    </div>
                    <div>
                      <div className="font-medium">{`${(w as any).patient?.first_name ?? "Paciente"} ${(w as any).patient?.last_name ?? ""}`}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(w.scheduled_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" • "}espera ~{Math.max(0, Math.floor((Date.now() - new Date(w.scheduled_datetime).getTime())/60000))}m
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary">Docs</Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Atender</Button>
                    <Button size="sm" variant="destructive">Cancelar</Button>
                  </div>
                </div>
              ))}
              {waiting.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum paciente em espera.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


