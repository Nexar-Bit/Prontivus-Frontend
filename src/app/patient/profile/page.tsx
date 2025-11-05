"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { PatientSidebar } from "@/components/patient/Navigation/PatientSidebar";
import { PatientMobileNav } from "@/components/patient/Navigation/PatientMobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clinicalRecordsApi } from "@/lib/clinical-api";
import { format, parseISO } from "date-fns";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Phone,
  UserPlus,
  Users,
  ShieldCheck,
  Lock,
  Globe,
  Bell,
  Languages,
  Image as ImageIcon,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Heart,
  Pill,
  Stethoscope,
  FileText,
} from "lucide-react";

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active: boolean;
}

interface ClinicalHistoryItem {
  appointment: {
    id: number;
    scheduled_datetime: string;
    status: string;
  };
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
  };
  clinical_record?: {
    id: number;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    diagnoses?: Array<{
      id: number;
      code: string;
      description: string;
    }>;
    prescriptions?: Array<{
      id: number;
      medication: string;
      dosage: string;
      frequency: string;
      instructions?: string;
    }>;
    exam_requests?: Array<{
      id: number;
      exam_type: string;
      description?: string;
      status: string;
    }>;
  };
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<PatientProfile>>({});
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistoryItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientData, historyData] = await Promise.all([
        api.get<PatientProfile>("/api/patients/me"),
        clinicalRecordsApi.getPatientHistory().catch(() => []),
      ]);
      
      setProfile(patientData);
      setProfileForm(patientData);
      setClinicalHistory(historyData || []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Erro ao carregar perfil", {
        description: error.message || "Não foi possível carregar seu perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (): number => {
    if (!profile) return 0;
    
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.date_of_birth,
      profile.gender,
      profile.email,
      profile.phone,
      profile.cpf,
      profile.address,
      profile.blood_type,
      profile.emergency_contact_name,
      profile.emergency_contact_phone,
      profile.allergies,
      profile.active_problems,
    ];
    
    const filledFields = fields.filter(f => f && f.toString().trim() !== "").length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const getMedicalSummary = () => {
    const conditions = new Set<string>();
    const allergies = new Set<string>();
    const medications = new Set<string>();

    // Extract from active_problems
    if (profile?.active_problems) {
      profile.active_problems.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed) conditions.add(trimmed);
      });
    }

    // Extract from allergies
    if (profile?.allergies) {
      profile.allergies.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed) allergies.add(trimmed);
      });
    }

    // Extract from clinical history
    clinicalHistory.forEach(item => {
      if (item.clinical_record) {
        // Diagnoses
        item.clinical_record.diagnoses?.forEach(d => {
          conditions.add(d.description || d.code);
        });

        // Prescriptions
        item.clinical_record.prescriptions?.forEach(p => {
          medications.add(`${p.medication} ${p.dosage}`);
        });
      }
    });

    return {
      conditions: Array.from(conditions),
      allergies: Array.from(allergies),
      medications: Array.from(medications),
    };
  };

  const handleProfileChange = (field: keyof PatientProfile, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const updated = await api.put<PatientProfile>("/api/patients/me", profileForm);
      setProfile(updated);
      setProfileForm(updated);
      setIsEditing(false);
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error("Erro ao salvar perfil", {
        description: error.message || "Não foi possível atualizar seu perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setProfileForm(profile || {});
    setIsEditing(false);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({ name: "", phone: "", relationship: "" });
    setIsContactDialogOpen(true);
  };

  const handleEditContact = () => {
    if (!profile) return;
    setEditingContact({
      name: profile.emergency_contact_name || "",
      phone: profile.emergency_contact_phone || "",
      relationship: profile.emergency_contact_relationship || "",
    });
    setContactForm({
      name: profile.emergency_contact_name || "",
      phone: profile.emergency_contact_phone || "",
      relationship: profile.emergency_contact_relationship || "",
    });
    setIsContactDialogOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const updated = await api.put<PatientProfile>("/api/patients/me", {
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relationship: null,
      });
      setProfile(updated);
      setProfileForm(updated);
      toast.success("Contato de emergência removido");
    } catch (error: any) {
      console.error("Failed to delete contact:", error);
      toast.error("Erro ao remover contato", {
        description: error.message || "Não foi possível remover o contato",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      const updated = await api.put<PatientProfile>("/api/patients/me", {
        emergency_contact_name: contactForm.name,
        emergency_contact_phone: contactForm.phone,
        emergency_contact_relationship: contactForm.relationship,
      });
      setProfile(updated);
      setProfileForm(updated);
      setIsContactDialogOpen(false);
      toast.success("Contato de emergência salvo");
    } catch (error: any) {
      console.error("Failed to save contact:", error);
      toast.error("Erro ao salvar contato", {
        description: error.message || "Não foi possível salvar o contato",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();
  const medicalSummary = getMedicalSummary();
  const hasEmergencyContact = profile.emergency_contact_name && profile.emergency_contact_phone;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} notificationCount={0} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={`${profile.first_name} ${profile.last_name}`} />
                <AvatarFallback>{initials(`${profile.first_name} ${profile.last_name}`)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-[#0F4C75]">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-muted-foreground">Gerencie suas informações e perfil médico</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={profileCompletion} className="w-44" />
              <span className="text-sm text-muted-foreground">{profileCompletion}% completo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Personal Information */}
              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-[#0F4C75]">Informações Pessoais</CardTitle>
                    <CardDescription>Detalhes básicos e informações de contato</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.is_active ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertTriangle className="h-4 w-4" /> Inativo
                      </Badge>
                    )}
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nome</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name || ""}
                        onChange={(e) => handleProfileChange("first_name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name || ""}
                        onChange={(e) => handleProfileChange("last_name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email || ""}
                        onChange={(e) => handleProfileChange("email", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone || ""}
                        onChange={(e) => handleProfileChange("phone", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={profileForm.cpf || ""}
                        onChange={(e) => handleProfileChange("cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Data de Nascimento</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={profileForm.date_of_birth 
                          ? (typeof profileForm.date_of_birth === 'string'
                              ? (profileForm.date_of_birth.includes('T') 
                                  ? format(parseISO(profileForm.date_of_birth), "yyyy-MM-dd")
                                  : profileForm.date_of_birth)
                              : format(new Date(profileForm.date_of_birth), "yyyy-MM-dd"))
                          : ""}
                        onChange={(e) => handleProfileChange("date_of_birth", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={profileForm.gender || ""}
                        onValueChange={(value) => handleProfileChange("gender", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger id="gender" title="Selecione o gênero">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
                      <Select
                        value={profileForm.blood_type || ""}
                        onValueChange={(value) => handleProfileChange("blood_type", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger id="blood_type" title="Selecione o tipo sanguíneo">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Textarea
                        id="address"
                        value={profileForm.address || ""}
                        onChange={(e) => handleProfileChange("address", e.target.value)}
                        disabled={!isEditing}
                        rows={2}
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4 flex gap-2">
                      <Button onClick={saveProfile} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical Profile */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="text-xl text-[#0F4C75]">Perfil Médico</CardTitle>
                  <CardDescription>Resumo de condições, alergias e medicamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" /> Condições
                      </h3>
                      {medicalSummary.conditions.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {medicalSummary.conditions.map((condition, idx) => (
                            <li key={idx}>{condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma condição registrada</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Alergias
                      </h3>
                      {medicalSummary.allergies.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {medicalSummary.allergies.map((allergy, idx) => (
                            <li key={idx}>{allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma alergia registrada</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Pill className="h-4 w-4" /> Medicamentos
                      </h3>
                      {medicalSummary.medications.length > 0 ? (
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {medicalSummary.medications.map((med, idx) => (
                            <li key={idx}>{med}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum medicamento ativo</p>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="allergies">Alergias</Label>
                        <Textarea
                          id="allergies"
                          value={profileForm.allergies || ""}
                          onChange={(e) => handleProfileChange("allergies", e.target.value)}
                          placeholder="Liste suas alergias conhecidas"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="active_problems">Problemas de Saúde Ativos</Label>
                        <Textarea
                          id="active_problems"
                          value={profileForm.active_problems || ""}
                          onChange={(e) => handleProfileChange("active_problems", e.target.value)}
                          placeholder="Condições médicas atuais ou crônicas"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Emergency Contacts */}
              <Card className="medical-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-[#0F4C75]">Contato de Emergência</CardTitle>
                    <CardDescription>Pessoas que devemos contatar em caso de emergência</CardDescription>
                  </div>
                  {hasEmergencyContact ? (
                    <Button variant="outline" size="sm" onClick={handleEditContact}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleAddContact}>
                      <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {hasEmergencyContact ? (
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium">
                          {profile.emergency_contact_name}
                          <span className="text-muted-foreground font-normal">
                            {" "}· {profile.emergency_contact_relationship}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3" />
                          {profile.emergency_contact_phone}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={handleEditContact}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={handleDeleteContact} disabled={saving}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum contato de emergência cadastrado</p>
                      <Button variant="outline" className="mt-4" onClick={handleAddContact}>
                        <UserPlus className="h-4 w-4 mr-2" /> Adicionar Contato
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Emergency Contact Dialog */}
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Editar" : "Adicionar"} Contato de Emergência
                </DialogTitle>
                <DialogDescription>
                  Informações de contato para emergências
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact_name">Nome do Contato</Label>
                  <Input
                    id="contact_name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefone do Contato</Label>
                  <Input
                    id="contact_phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_relationship">Relacionamento</Label>
                  <Input
                    id="contact_relationship"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="Ex: Pai, Mãe, Cônjuge, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveContact} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
