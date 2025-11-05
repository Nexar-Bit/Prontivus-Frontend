"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { appointmentsApi } from "@/lib/appointments-api";
import { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, RefreshCw, Search, User, Loader2, CheckCircle, XCircle, Play } from "lucide-react";
import { toast } from "sonner";

export default function SecretariaConsultasPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const data = await appointmentsApi.getAll({
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        status: status === "all" ? undefined : (status as AppointmentStatus),
      });
      setItems(data);
    } catch (e: any) {
      toast.error("Erro ao carregar consultas", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, status]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter((a) =>
      (a.patient_name || "").toLowerCase().includes(term) ||
      String(a.patient_id).includes(term) ||
      (a.reason || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground">Agenda da clínica por dia, com filtros e busca</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Data</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground"/>
              <Input
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => setDate(new Date(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="checked_in">Aguardando</SelectItem>
                <SelectItem value="in_consultation">Em atendimento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[220px]">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Paciente, ID, motivo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma consulta encontrada.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Hora</th>
                    <th className="py-2 pr-4">Paciente</th>
                    <th className="py-2 pr-4">Médico</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice()
                    .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime())
                    .map((a) => {
                      const dt = new Date(a.scheduled_datetime);
                      return (
                        <tr key={a.id} className="border-b hover:bg-accent/50">
                          <td className="py-2 pr-4 whitespace-nowrap flex items-center gap-2"><Clock className="h-3 w-3" /> {format(dt, 'HH:mm')}</td>
                          <td className="py-2 pr-4 whitespace-nowrap"><span className="inline-flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {a.patient_name || `Paciente #${a.patient_id}`}</span></td>
                          <td className="py-2 pr-4 whitespace-nowrap">{a.doctor_name || `#${a.doctor_id}`}</td>
                          <td className="py-2 pr-4 whitespace-nowrap capitalize">{String(a.status).replaceAll('_', ' ')}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link href={`/secretaria/agendamentos/new?id=${a.id}`}>
                                <Button size="sm" variant="outline">Editar</Button>
                              </Link>
                              <Link href={`/medico/atendimento/${a.id}`}>
                                <Button size="sm">Abrir</Button>
                              </Link>
                              {/* Inline status actions */}
                              {a.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await appointmentsApi.updateStatus(a.id, 'checked_in');
                                      toast.success('Check-in realizado');
                                      load();
                                    } catch (e: any) {
                                      toast.error('Falha ao atualizar', { description: e?.message });
                                    }
                                  }}
                                  className="text-orange-600"
                                >
                                  <Play className="h-3 w-3 mr-1" /> Check-in
                                </Button>
                              )}
                              {a.status === 'checked_in' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await appointmentsApi.updateStatus(a.id, 'in_consultation');
                                      toast.success('Atendimento iniciado');
                                      load();
                                    } catch (e: any) {
                                      toast.error('Falha ao atualizar', { description: e?.message });
                                    }
                                  }}
                                  className="text-yellow-700"
                                >
                                  <Play className="h-3 w-3 mr-1" /> Iniciar
                                </Button>
                              )}
                              {(a.status === 'in_consultation' || a.status === 'checked_in') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await appointmentsApi.updateStatus(a.id, 'completed');
                                      toast.success('Consulta concluída');
                                      load();
                                    } catch (e: any) {
                                      toast.error('Falha ao atualizar', { description: e?.message });
                                    }
                                  }}
                                  className="text-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                                </Button>
                              )}
                              {a.status !== 'cancelled' && a.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await appointmentsApi.updateStatus(a.id, 'cancelled');
                                      toast.success('Consulta cancelada');
                                      load();
                                    } catch (e: any) {
                                      toast.error('Falha ao cancelar', { description: e?.message });
                                    }
                                  }}
                                  className="text-red-700"
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Cancelar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


