"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Save, X, NotebookText, Calendar, User, Stethoscope, RefreshCw, Search, MessageCircle, Send, Download, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type PatientProfile = {
  id: number;
  notes?: string | null;
};

type PersonalNote = {
  id: string; // uuid
  title: string;
  content: string;
  created_at: string; // ISO
  updated_at?: string; // ISO
};

type HistoryItem = {
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  appointment_type?: string;
  clinical_record?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    plan_soap?: string;
  };
};

export default function PatientNotesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editing, setEditing] = useState<PersonalNote | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'personal' | 'clinical' | 'messages'>('personal');
  const [messageThreads, setMessageThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Helper function to reload all data
  const reloadData = async () => {
    try {
      setLoading(true);
      const [p, messages] = await Promise.all([
        api.get<PatientProfile>(`/api/v1/patients/me`),
        api.get<any[]>(`/api/v1/messages/threads`).catch(() => []), // Get message threads
      ]);
      setProfile(p);
      try {
        const parsed = p.notes ? JSON.parse(p.notes) : [];
        setNotes(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn("Error parsing notes:", error);
        setNotes([]);
      }
      setMessageThreads(messages);
      
      // Try to get clinical history from appointments
      try {
        const appts = await api.get<any[]>(`/api/v1/appointments/patient-appointments`);
        // Build history from appointments
        const historyItems: HistoryItem[] = [];
        
        // Try to get clinical records for each appointment
        const clinicalPromises = appts.map(async (apt) => {
          try {
            const record = await api.get<any>(`/api/v1/clinical/appointments/${apt.id}/clinical-record`).catch(() => null);
            return { appointment: apt, record };
          } catch {
            return { appointment: apt, record: null };
          }
        });
        
        const clinicalData = await Promise.all(clinicalPromises);
        
        clinicalData.forEach(({ appointment, record }) => {
          if (record) {
            historyItems.push({
              appointment_id: appointment.id,
              appointment_date: appointment.scheduled_datetime,
              doctor_name: appointment.doctor_name,
              appointment_type: appointment.appointment_type,
              clinical_record: {
                subjective: record.subjective,
                objective: record.objective,
                assessment: record.assessment,
                plan: record.plan,
                plan_soap: record.plan_soap,
              },
            });
          }
        });
        
        setHistory(historyItems.sort((a, b) => 
          new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        ));
      } catch (error) {
        console.warn("Could not load clinical history:", error);
        setHistory([]);
      }
    } catch (error: any) {
      console.error("Error loading notes data:", error);
      toast.error("Erro ao carregar notas", {
        description: error?.message || error?.detail || "Não foi possível carregar suas notas",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await reloadData();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const saveNotes = async (nextNotes: PersonalNote[]) => {
    if (!profile) {
      toast.error("Perfil não encontrado");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put<PatientProfile>(`/api/v1/patients/me`, { notes: JSON.stringify(nextNotes) });
      setProfile(updated as PatientProfile);
      setNotes(nextNotes);
      toast.success("Notas salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast.error("Erro ao salvar notas", {
        description: error?.message || "Não foi possível salvar suas notas",
      });
      throw error; // Re-throw to allow caller to handle
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      toast.error("Por favor, preencha pelo menos o título ou o conteúdo da nota");
      return;
    }
    try {
      const now = new Date().toISOString();
      const note: PersonalNote = {
        id: crypto.randomUUID(),
        title: newTitle.trim() || "Sem título",
        content: newContent.trim(),
        created_at: now,
        updated_at: now,
      };
      await saveNotes([note, ...notes]);
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      // Error already handled in saveNotes
    }
  };

  const updateNote = async (updated: PersonalNote) => {
    try {
      const next = notes.map(n => (n.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : n));
      await saveNotes(next);
      setEditing(null);
    } catch (error) {
      // Error already handled in saveNotes
    }
  };

  const deleteNote = (id: string) => {
    setNoteToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      setDeleting(true);
      const next = notes.filter(n => n.id !== noteToDelete);
      await saveNotes(next);
      setNoteToDelete(null);
    } catch (error) {
      // Error already handled in saveNotes
    } finally {
      setDeleting(false);
    }
  };

  // Filter notes based on search query
  const filteredPersonalNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const filteredClinicalNotes = useMemo(() => {
    let filtered = history;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.doctor_name.toLowerCase().includes(query) ||
        item.clinical_record?.subjective?.toLowerCase().includes(query) ||
        item.clinical_record?.objective?.toLowerCase().includes(query) ||
        item.clinical_record?.assessment?.toLowerCase().includes(query) ||
        item.clinical_record?.plan?.toLowerCase().includes(query) ||
        item.clinical_record?.plan_soap?.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
  }, [history, searchQuery]);

  const recentClinicalNotes = useMemo(() => {
    return filteredClinicalNotes.slice(0, 5);
  }, [filteredClinicalNotes]);

  // Load thread details
  const loadThreadDetails = async (threadId: number) => {
    try {
      const thread = await api.get<any>(`/api/v1/messages/threads/${threadId}`);
      setSelectedThread(thread);
    } catch (error: any) {
      console.error("Error loading thread:", error);
      toast.error("Erro ao carregar conversa", {
        description: error?.message || error?.detail || "Não foi possível carregar a conversa",
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) {
      return;
    }
    
    try {
      setSendingMessage(true);
      await api.post(`/api/v1/messages/threads/${selectedThread.id}/send`, {
        content: newMessage.trim(),
      });
      setNewMessage('');
      await loadThreadDetails(selectedThread.id);
      setRefreshKey(prev => prev + 1);
      toast.success('Mensagem enviada!');
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem", {
        description: error?.message || error?.detail || "Não foi possível enviar a mensagem",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Create new message thread
  const createThread = async (providerId: number, topic: string) => {
    try {
      const thread = await api.post<any>(`/api/v1/messages/threads`, {
        provider_id: providerId,
        topic: topic,
        is_urgent: false,
      });
      setSelectedThread(thread);
      setRefreshKey(prev => prev + 1);
      toast.success('Conversa criada!');
    } catch (error: any) {
      console.error("Error creating thread:", error);
      toast.error("Erro ao criar conversa", {
        description: error?.message || error?.detail || "Não foi possível criar a conversa",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
        <PatientHeader showSearch={false} notificationCount={3} />
        <PatientMobileNav />
        <div className="flex">
          <div className="hidden lg:block">
            <PatientSidebar />
          </div>
          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
            <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">Carregando suas notas...</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      <PatientHeader showSearch={false} notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Modern Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <NotebookText className="h-7 w-7 text-blue-600" />
              </div>
              Notas
            </h1>
            <p className="text-muted-foreground text-sm">Anote informações pessoais e reveja notas clínicas das suas consultas</p>
          </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  await reloadData();
                  setRefreshKey(prev => prev + 1);
                  toast.success('Dados atualizados!');
                }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    // Export all notes as CSV
                    const csvRows = [];
                    csvRows.push('Tipo,Título/Data,Conteúdo,Data');
                    
                    // Add personal notes
                    notes.forEach(n => {
                      csvRows.push([
                        'Nota Pessoal',
                        n.title,
                        n.content.replace(/,/g, ';').replace(/\n/g, ' '),
                        format(parseISO(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      ].join(','));
                    });
                    
                    // Add clinical notes
                    history.forEach(h => {
                      const content = [
                        h.clinical_record?.subjective,
                        h.clinical_record?.objective,
                        h.clinical_record?.assessment,
                        h.clinical_record?.plan || h.clinical_record?.plan_soap
                      ].filter(Boolean).join('; ').replace(/,/g, ';').replace(/\n/g, ' ');
                      
                      csvRows.push([
                        'Nota Clínica',
                        `${h.doctor_name} - ${format(parseISO(h.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}`,
                        content,
                        format(parseISO(h.appointment_date), 'dd/MM/yyyy', { locale: ptBR })
                      ].join(','));
                    });
                    
                    const csvContent = csvRows.join('\n');
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `notas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Notas exportadas com sucesso!');
                  } catch (error: any) {
                    toast.error('Erro ao exportar notas', {
                      description: error?.message || error?.detail || 'Não foi possível exportar as notas',
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card className="border-l-4 border-l-blue-500 mb-6 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar em notas pessoais, clínicas e mensagens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'personal' | 'clinical' | 'messages')} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">
                Notas Pessoais ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="clinical">
                Notas Clínicas ({history.length})
              </TabsTrigger>
              <TabsTrigger value="messages">
                Mensagens ({messageThreads.length})
              </TabsTrigger>
            </TabsList>

            {/* Personal Notes Tab */}
            <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create personal note */}
            <Card className="lg:col-span-2 border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <NotebookText className="h-5 w-5" />
                      </div>
                      Minhas notas
                    </CardTitle>
                    <CardDescription>Crie e gerencie suas notas pessoais</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Input placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                  <div className="md:col-span-2">
                    <Textarea placeholder="Sua nota" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} />
                  </div>
                </div>
                <Button 
                  disabled={saving || (!newTitle.trim() && !newContent.trim())} 
                  onClick={addNote} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar nota
                    </>
                  )}
                </Button>

                <div className="mt-6">
                  {filteredPersonalNotes.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota adicionada'}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Conteúdo</TableHead>
                          <TableHead>Atualizada</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPersonalNotes.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell className="font-medium">{n.title}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate text-sm text-gray-600">
                                {n.content.substring(0, 100)}{n.content.length > 100 ? '...' : ''}
                              </div>
                            </TableCell>
                            <TableCell>{n.updated_at ? format(parseISO(n.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : format(parseISO(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditing(n)}
                                disabled={saving}
                              >
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                                onClick={() => deleteNote(n.id)}
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent clinical notes (read-only) */}
            <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                      <div className="p-1.5 bg-teal-100 rounded-lg">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      Notas clínicas recentes
                    </CardTitle>
                    <CardDescription>Registros de suas últimas consultas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentClinicalNotes.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sem histórico clínico</div>
                ) : (
                  <div className="space-y-4">
                    {recentClinicalNotes.map(item => (
                      <div key={item.appointment_id} className="p-3 rounded-lg border border-teal-200 bg-teal-50/30 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 text-sm text-gray-700 mb-2">
                          <Calendar className="h-4 w-4" />
                          {format(parseISO(item.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          <User className="h-4 w-4 ml-3" /> {item.doctor_name}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {item.clinical_record?.subjective && (
                            <div>
                              <div className="font-semibold">Subjetivo</div>
                              <div className="text-gray-700 whitespace-pre-wrap">{item.clinical_record.subjective}</div>
                            </div>
                          )}
                          {item.clinical_record?.objective && (
                            <div>
                              <div className="font-semibold">Objetivo</div>
                              <div className="text-gray-700 whitespace-pre-wrap">{item.clinical_record.objective}</div>
                            </div>
                          )}
                          {item.clinical_record?.assessment && (
                            <div>
                              <div className="font-semibold">Avaliação</div>
                              <div className="text-gray-700 whitespace-pre-wrap">{item.clinical_record.assessment}</div>
                            </div>
                          )}
                          {(item.clinical_record?.plan_soap || item.clinical_record?.plan) && (
                            <div>
                              <div className="font-semibold">Plano</div>
                              <div className="text-gray-700 whitespace-pre-wrap">{item.clinical_record.plan_soap || item.clinical_record?.plan}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            {/* Clinical Notes Tab */}
            <TabsContent value="clinical" className="space-y-4">
              {filteredClinicalNotes.length === 0 ? (
                <Card className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <div className="p-4 bg-teal-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Stethoscope className="h-10 w-10 text-teal-600" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      {searchQuery ? 'Nenhuma nota clínica encontrada' : 'Sem histórico clínico'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredClinicalNotes.map(item => (
                  <Card key={item.appointment_id} className="border-l-4 border-l-teal-500 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-teal-600 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {format(parseISO(item.appointment_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <User className="h-4 w-4 inline mr-1" />
                            {item.doctor_name} {item.appointment_type && `• ${item.appointment_type}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item.clinical_record?.subjective && (
                          <div>
                            <div className="font-semibold text-gray-700 mb-2">Subjetivo</div>
                            <div className="text-gray-900 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200">
                              {item.clinical_record.subjective}
                            </div>
                          </div>
                        )}
                        {item.clinical_record?.objective && (
                          <div>
                            <div className="font-semibold text-gray-700 mb-2">Objetivo</div>
                            <div className="text-gray-900 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200">
                              {item.clinical_record.objective}
                            </div>
                          </div>
                        )}
                        {item.clinical_record?.assessment && (
                          <div>
                            <div className="font-semibold text-gray-700 mb-2">Avaliação</div>
                            <div className="text-gray-900 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200">
                              {item.clinical_record.assessment}
                            </div>
                          </div>
                        )}
                        {(item.clinical_record?.plan_soap || item.clinical_record?.plan) && (
                          <div>
                            <div className="font-semibold text-gray-700 mb-2">Plano</div>
                            <div className="text-gray-900 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg border border-gray-200">
                              {item.clinical_record.plan_soap || item.clinical_record?.plan}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message Threads List */}
                <Card className="lg:col-span-1 border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Conversas
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Get list of doctors
                            const doctors = await api.get<any[]>(`/api/v1/users/doctors`);
                            if (doctors.length === 0) {
                              toast.info('Nenhum médico disponível');
                              return;
                            }
                            
                            // For now, create a thread with the first doctor
                            // In a full implementation, you'd show a dialog to select doctor and topic
                            const topic = prompt('Digite o assunto da conversa:');
                            if (!topic) return;
                            
                            await createThread(doctors[0].id, topic);
                          } catch (error: any) {
                            console.error("Error creating thread:", error);
                            toast.error("Erro ao criar conversa", {
                              description: error?.message || error?.detail || "Não foi possível criar a conversa",
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Conversa
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {messageThreads.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma conversa</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-4"
                          onClick={async () => {
                            try {
                              const doctors = await api.get<any[]>(`/api/v1/users/doctors`);
                              if (doctors.length === 0) {
                                toast.info('Nenhum médico disponível');
                                return;
                              }
                              
                              const topic = prompt('Digite o assunto da conversa:');
                              if (!topic) return;
                              
                              await createThread(doctors[0].id, topic);
                            } catch (error: any) {
                              toast.error("Erro ao criar conversa", {
                                description: error?.message || error?.detail || "Não foi possível criar a conversa",
                              });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Conversa
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messageThreads.map(thread => (
                          <div
                            key={thread.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedThread?.id === thread.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white'
                            }`}
                            onClick={() => loadThreadDetails(thread.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-gray-900">{thread.provider_name}</div>
                              {thread.unread_count > 0 && (
                                <Badge className="bg-blue-600 text-white">
                                  {thread.unread_count}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">{thread.topic}</div>
                            {thread.last_message && (
                              <div className="text-xs text-gray-500 truncate">
                                {thread.last_message}
                              </div>
                            )}
                            {thread.last_message_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                {format(parseISO(thread.last_message_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Message Thread View */}
                <Card className="lg:col-span-2 border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">
                      {selectedThread ? selectedThread.topic : 'Selecione uma conversa'}
                    </CardTitle>
                    {selectedThread && (
                      <CardDescription>
                        Conversa com {selectedThread.provider_name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {selectedThread ? (
                      <div className="space-y-4">
                        {/* Messages */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {selectedThread.messages && selectedThread.messages.length > 0 ? (
                            selectedThread.messages.map((msg: any) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    msg.sender_type === 'patient'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                  <div className={`text-xs mt-1 ${
                                    msg.sender_type === 'patient' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {format(parseISO(msg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    {msg.status === 'read' && msg.sender_type === 'patient' && (
                                      <Eye className="h-3 w-3 inline ml-1" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                              Nenhuma mensagem ainda
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Send Message */}
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={3}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {sendingMessage ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" /> Enviar Mensagem
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Selecione uma conversa para ver as mensagens</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Nota</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
              <Textarea
                placeholder="Conteúdo da nota"
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={8}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button
                  onClick={() => updateNote(editing)}
                  disabled={saving || (!editing.title.trim() && !editing.content.trim())}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Nota"
        description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteNote}
      />
    </div>
  );
}

function cryptoRandomUUIDFallback() {
  // Basic fallback in environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Polyfill assignment if needed
// @ts-ignore
if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.crypto = { randomUUID: cryptoRandomUUIDFallback } as any;
}


