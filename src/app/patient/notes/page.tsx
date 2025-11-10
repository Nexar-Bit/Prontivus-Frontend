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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Save, X, NotebookText, Calendar, User, Stethoscope } from "lucide-react";

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

  useEffect(() => {
    const load = async () => {
      try {
        const [p, h] = await Promise.all([
          api.get<PatientProfile>(`/api/patients/me`),
          api.get<HistoryItem[]>(`/api/clinical/me/history`),
        ]);
        setProfile(p);
        try {
          const parsed = p.notes ? JSON.parse(p.notes) : [];
          setNotes(Array.isArray(parsed) ? parsed : []);
        } catch {
          setNotes([]);
        }
        setHistory(h);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveNotes = async (nextNotes: PersonalNote[]) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await api.put<PatientProfile>(`/api/patients/me`, { notes: JSON.stringify(nextNotes) });
      setProfile(updated as PatientProfile);
      setNotes(nextNotes);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
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
  };

  const updateNote = async (updated: PersonalNote) => {
    const next = notes.map(n => (n.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : n));
    await saveNotes(next);
    setEditing(null);
  };

  const deleteNote = async (id: string) => {
    const next = notes.filter(n => n.id !== id);
    await saveNotes(next);
  };

  const recentClinicalNotes = useMemo(() => {
    return history
      .slice()
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
      .slice(0, 5);
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <NotebookText className="h-7 w-7 text-blue-600" />
              </div>
              Notas
            </h1>
            <p className="text-muted-foreground text-sm">Anote informações pessoais e reveja notas clínicas das suas consultas</p>
          </div>

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
                <Button disabled={saving} onClick={addNote} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar nota
                </Button>

                <div className="mt-6">
                  {notes.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhuma nota adicionada</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Atualizada</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notes.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell className="font-medium">{n.title}</TableCell>
                            <TableCell>{n.updated_at ? format(parseISO(n.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="sm" variant="outline" onClick={() => setEditing(n)}>
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteNote(n.id)}>
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
        </main>
      </div>
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


