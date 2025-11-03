"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { appointmentsApi } from "@/lib/appointments-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, RefreshCw, Stethoscope, Mail, Phone, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Doctor = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  crm?: string;
  clinic_name?: string;
};

export default function SecretariaMedicosPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const data = await appointmentsApi.getDoctors();
      setItems(data as any);
    } catch (e: any) {
      toast.error("Erro ao carregar médicos", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    items.forEach((d) => { if (d.specialty) set.add(d.specialty); });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((d) => {
      if (specialty !== "all" && (d.specialty || "") !== specialty) return false;
      if (!search) return true;
      const t = search.toLowerCase();
      return (
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(t) ||
        (d.email || "").toLowerCase().includes(t) ||
        (d.crm || "").toLowerCase().includes(t)
      );
    });
  }, [items, specialty, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Médicos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e consulta de profissionais médicos da clínica</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Refine a lista por especialidade e dados do médico</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Nome, CRM, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <Label>Especialidade</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profissionais ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Nenhum médico encontrado.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((d) => (
                <div key={d.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{(d.first_name?.[0] || 'M')}{(d.last_name?.[0] || '')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">Dr(a). {d.first_name} {d.last_name}</h3>
                        {d.crm && <Badge variant="secondary">CRM {d.crm}</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        {d.specialty && <><Stethoscope className="h-3 w-3"/> {d.specialty}</>}
                        {d.clinic_name && <><Separator orientation="vertical" className="h-4"/> <Building2 className="h-3 w-3"/> {d.clinic_name}</>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-4">
                        {d.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3"/> {d.email}</span>}
                        {d.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3"/> {d.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">ID #{d.id}</div>
                    <Link href={`/secretaria/agendamentos?doctor_id=${d.id}`}>
                      <Button size="sm" variant="outline">Agendar <ArrowRight className="h-3 w-3 ml-2"/></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


