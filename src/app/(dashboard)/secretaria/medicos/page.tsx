"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  RefreshCw, 
  Stethoscope, 
  Mail, 
  Phone, 
  Building2, 
  ArrowRight, 
  Loader2,
  UserCheck,
  Calendar,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      // Use the correct endpoint for doctors
      const data = await api.get<Doctor[]>("/api/users/doctors");
      setItems(data || []);
    } catch (e: any) {
      console.error("Failed to load doctors:", e);
      toast.error("Erro ao carregar médicos", { 
        description: e?.message || "Não foi possível carregar a lista de médicos" 
      });
      setItems([]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-blue-600/10 rounded-2xl blur-3xl" />
          <div className="relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                      Médicos
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      Cadastro e consulta de profissionais médicos da clínica
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-700">{filtered.length}</span>
                    <span>profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={load} 
                disabled={loading}
                className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && 'animate-spin')} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Filtros de Busca</CardTitle>
                <CardDescription className="mt-1">Refine a lista por especialidade e dados do médico</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nome, CRM, email..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-9 h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400" 
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Especialidade</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-11 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Todas as especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as especialidades</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctors Grid */}
        <div>
          {loading ? (
            <Card className="border-blue-100 shadow-md">
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-base font-medium">Carregando médicos...</p>
                </div>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-blue-100 shadow-md">
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                    <Stethoscope className="h-12 w-12 text-blue-400" />
                  </div>
                  {items.length === 0 ? (
                    <>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Nenhum médico cadastrado</p>
                      <p className="text-sm text-gray-600">Adicione médicos através do menu de usuários.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Nenhum médico encontrado</p>
                      <p className="text-sm text-gray-600">Tente ajustar os filtros de busca.</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((d) => (
                <Card 
                  key={d.id} 
                  className="group relative overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-xl bg-white"
                >
                  {/* Medical pattern background */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(135deg,transparent_25%,rgba(15,76,117,0.1)_25%,rgba(15,76,117,0.1)_50%,transparent_50%,transparent_75%,rgba(15,76,117,0.1)_75%)] bg-[length:20px_20px]" />
                  
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600" />
                  
                  <CardContent className="p-6 relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-blue-200 shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-teal-600 text-white text-lg font-semibold">
                            {(d.first_name?.[0] || 'M')}{(d.last_name?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-md border-2 border-blue-100">
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              Dr(a). {d.first_name || ''} {d.last_name || ''}
                            </h3>
                          </div>
                        </div>
                        {d.crm && (
                          <Badge 
                            variant="secondary" 
                            className="mb-3 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 font-semibold"
                          >
                            CRM {d.crm}
                          </Badge>
                        )}
                        {d.specialty && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                            <div className="p-1.5 bg-teal-50 rounded-lg">
                              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                            </div>
                            <span className="font-medium">{d.specialty}</span>
                          </div>
                        )}
                        {d.clinic_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{d.clinic_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4 bg-blue-100" />

                    <div className="space-y-2.5 mb-4">
                      {d.email && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600 group/contact">
                          <div className="p-1.5 bg-blue-50 rounded-lg group-hover/contact:bg-blue-100 transition-colors">
                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="truncate flex-1">{d.email}</span>
                        </div>
                      )}
                      {d.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600 group/contact">
                          <div className="p-1.5 bg-teal-50 rounded-lg group-hover/contact:bg-teal-100 transition-colors">
                            <Phone className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <span>{d.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-blue-100">
                      <div className="text-xs text-gray-500 font-medium">
                        ID #{d.id}
                      </div>
                      <Link href={`/secretaria/agendamentos?doctor_id=${d.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all gap-2"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Agendar
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


