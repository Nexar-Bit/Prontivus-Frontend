"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Upload, Plus, Download, FileText, Search, Edit, Trash2, User, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { onlyDigits, validateCPF, validatePhone } from "@/lib/inputMasks";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  date_of_birth: string;
  gender?: string;
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

interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  allergies: string;
  active_problems: string;
  blood_type: string;
  notes: string;
}

export default function PacientesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    cpf: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    allergies: "",
    active_problems: "",
    blood_type: "",
    notes: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.get<Patient[]>("/api/patients");
      setPatients(data);
    } catch (error: any) {
      console.error("Failed to load patients:", error);
      toast.error("Erro ao carregar pacientes", {
        description: error?.message || error?.detail || "Não foi possível carregar os pacientes",
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower) ||
          patient.cpf?.includes(searchTerm) ||
          patient.email?.toLowerCase().includes(searchLower) ||
          patient.phone?.includes(searchTerm)
      );
    }

    setFilteredPatients(filtered);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "",
      cpf: "",
      phone: "",
      email: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      allergies: "",
      active_problems: "",
      blood_type: "",
      notes: "",
    });
    setEditingPatient(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (patient: Patient) => {
    setEditingPatient(patient);
    const birthDate = patient.date_of_birth ? parseISO(patient.date_of_birth).toISOString().split('T')[0] : "";
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: birthDate,
      gender: patient.gender || "",
      cpf: patient.cpf || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      emergency_contact_relationship: patient.emergency_contact_relationship || "",
      allergies: patient.allergies || "",
      active_problems: patient.active_problems || "",
      blood_type: patient.blood_type || "",
      notes: patient.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    try {
      setSaving(true);

      // Validate and clean CPF
      let cleanedCpf: string | undefined = undefined;
      if (formData.cpf && formData.cpf.trim()) {
        const cpfDigits = onlyDigits(formData.cpf.trim());
        if (cpfDigits.length === 11) {
          if (!validateCPF(cpfDigits)) {
            toast.error("CPF inválido. Verifique os dígitos informados.");
            setSaving(false);
            return;
          }
          cleanedCpf = cpfDigits;
        } else if (cpfDigits.length > 0) {
          toast.error("CPF deve ter 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      // Validate and clean phone
      let cleanedPhone: string | undefined = undefined;
      if (formData.phone && formData.phone.trim()) {
        const phoneDigits = onlyDigits(formData.phone.trim());
        if (phoneDigits.length >= 10 && phoneDigits.length <= 11) {
          // Add country code for Brazil if not present
          if (!phoneDigits.startsWith('55')) {
            cleanedPhone = `+55${phoneDigits}`;
          } else if (phoneDigits.startsWith('55')) {
            cleanedPhone = `+${phoneDigits}`;
          } else {
            cleanedPhone = phoneDigits;
          }
        } else if (phoneDigits.length > 0) {
          toast.error("Telefone deve ter 10 ou 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      // Validate and clean emergency contact phone
      let cleanedEmergencyPhone: string | undefined = undefined;
      if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
        const emergencyPhoneDigits = onlyDigits(formData.emergency_contact_phone.trim());
        if (emergencyPhoneDigits.length >= 10 && emergencyPhoneDigits.length <= 11) {
          if (!emergencyPhoneDigits.startsWith('55')) {
            cleanedEmergencyPhone = `+55${emergencyPhoneDigits}`;
          } else if (emergencyPhoneDigits.startsWith('55')) {
            cleanedEmergencyPhone = `+${emergencyPhoneDigits}`;
          } else {
            cleanedEmergencyPhone = emergencyPhoneDigits;
          }
        } else if (emergencyPhoneDigits.length > 0) {
          toast.error("Telefone de emergência deve ter 10 ou 11 dígitos.");
          setSaving(false);
          return;
        }
      }

      const patientData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender || undefined,
        cpf: cleanedCpf,
        phone: cleanedPhone,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: cleanedEmergencyPhone,
        emergency_contact_relationship: formData.emergency_contact_relationship.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        active_problems: formData.active_problems.trim() || undefined,
        blood_type: formData.blood_type.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingPatient) {
        // Update existing patient
        await api.put(`/api/patients/${editingPatient.id}`, patientData);
        toast.success("Paciente atualizado com sucesso!");
      } else {
        // Create new patient
        patientData.clinic_id = user.clinic_id;
        await api.post("/api/patients", patientData);
        toast.success("Paciente cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      await loadPatients();
    } catch (error: any) {
      console.error("Failed to save patient:", error);
      toast.error(editingPatient ? "Erro ao atualizar paciente" : "Erro ao cadastrar paciente", {
        description: error?.message || error?.detail || "Não foi possível salvar o paciente",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/api/patients/${patientToDelete.id}`);
      toast.success("Paciente excluído com sucesso!");
      await loadPatients();
      setPatientToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete patient:", error);
      toast.error("Erro ao excluir paciente", {
        description: error?.message || error?.detail || "Não foi possível excluir o paciente",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return "-";
    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV");
        return;
      }
      setUploadFile(file);
      setUploadResults(null);
      toast.success("Arquivo selecionado com sucesso");
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Parse data rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    if (!user?.clinic_id) {
      toast.error("Erro ao identificar a clínica");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const fileText = await uploadFile.text();
      const csvData = parseCSV(fileText);
      
      if (csvData.length === 0) {
        toast.error("O arquivo CSV está vazio ou em formato inválido");
        setIsUploading(false);
        return;
      }

      if (csvData.length > 1000) {
        toast.error("O arquivo contém mais de 1000 linhas. Por favor, divida o arquivo.");
        setIsUploading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process patients in batches
      const batchSize = 10;
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // Map CSV columns to patient data
            const patientData: any = {
              clinic_id: user.clinic_id,
              first_name: (row.nome || row.first_name || "").trim(),
              last_name: (row.sobrenome || row.last_name || "").trim(),
              date_of_birth: row.data_nascimento || row.date_of_birth || "",
              gender: (row.genero || row.gender || "").toLowerCase(),
              cpf: (row.cpf || "").replace(/\D/g, ""),
              phone: (row.telefone || row.phone || "").replace(/\D/g, ""),
              email: (row.email || "").trim(),
              address: (row.endereco || row.address || "").trim(),
              emergency_contact_name: (row.contato_emergencia_nome || row.emergency_contact_name || "").trim(),
              emergency_contact_phone: (row.contato_emergencia_telefone || row.emergency_contact_phone || "").replace(/\D/g, ""),
              emergency_contact_relationship: (row.contato_emergencia_parentesco || row.emergency_contact_relationship || "").trim(),
              allergies: (row.alergias || row.allergies || "").trim(),
              active_problems: (row.problemas_ativos || row.active_problems || "").trim(),
              blood_type: (row.tipo_sanguineo || row.blood_type || "").trim(),
              notes: (row.observacoes || row.notes || "").trim(),
            };

            // Validate required fields
            if (!patientData.first_name || !patientData.last_name || !patientData.date_of_birth) {
              failed++;
              errors.push(`Linha ${i + batch.indexOf(row) + 2}: Campos obrigatórios faltando (nome, sobrenome, data de nascimento)`);
              continue;
            }

            // Format date if needed
            if (patientData.date_of_birth) {
              // Try to parse different date formats
              const dateStr = patientData.date_of_birth;
              let date: Date | null = null;
              
              // Try DD/MM/YYYY format
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
              }
              
              // Try YYYY-MM-DD format
              if (!date || isNaN(date.getTime())) {
                date = new Date(dateStr);
              }
              
              if (date && !isNaN(date.getTime())) {
                patientData.date_of_birth = date.toISOString().split('T')[0];
              } else {
                failed++;
                errors.push(`Linha ${i + batch.indexOf(row) + 2}: Data de nascimento inválida`);
                continue;
              }
            }

            await api.post("/api/patients", patientData);
            success++;
          } catch (error: any) {
            failed++;
            const errorMsg = error?.message || error?.detail || "Erro desconhecido";
            errors.push(`Linha ${i + batch.indexOf(row) + 2}: ${errorMsg}`);
          }
        }

        // Update progress
        const progress = Math.min(90, ((i + batch.length) / csvData.length) * 90);
        setUploadProgress(progress);
      }

      setUploadProgress(100);
      setUploadResults({ success, failed, errors: errors.slice(0, 20) }); // Limit to 20 errors

      if (success > 0) {
        toast.success(`${success} paciente(s) importado(s) com sucesso!`);
        await loadPatients();
      }
      
      if (failed > 0) {
        toast.error(`${failed} paciente(s) falharam ao importar`);
      }
    } catch (error: any) {
      console.error("Failed to upload CSV:", error);
      toast.error("Erro ao processar arquivo CSV", {
        description: error?.message || error?.detail || "Não foi possível processar o arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = "nome,sobrenome,email,telefone,cpf,data_nascimento,genero,endereco,contato_emergencia_nome,contato_emergencia_telefone,contato_emergencia_parentesco,alergias,problemas_ativos,tipo_sanguineo,observacoes\nJoão,Silva,joao@example.com,11999999999,12345678900,01/01/1990,male,Rua Exemplo 123,São Paulo SP,Maria Silva,11988888888,Mãe,Nenhuma,Hipertensão,A+,Paciente regular";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_pacientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          Cadastro de Pacientes
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie o cadastro de pacientes da clínica
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Pacientes</TabsTrigger>
          <TabsTrigger value="bulk">Upload em Massa</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pacientes Cadastrados</CardTitle>
                  <CardDescription>
                    Lista de todos os pacientes ({filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar paciente..."
                      className="pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadPatients}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Paciente
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPatients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Data de Nascimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => {
                      const birthDate = patient.date_of_birth ? format(parseISO(patient.date_of_birth), "dd/MM/yyyy", { locale: ptBR }) : "-";
                      return (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {patient.first_name} {patient.last_name}
                            </div>
                          </TableCell>
                          <TableCell>{formatCPF(patient.cpf)}</TableCell>
                          <TableCell>{formatPhone(patient.phone)}</TableCell>
                          <TableCell>{patient.email || "-"}</TableCell>
                          <TableCell>{birthDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditForm(patient)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(patient)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload em Massa de Pacientes</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV para cadastrar múltiplos pacientes de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="mb-4">
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Clique para selecionar um arquivo CSV
                    </span>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </Label>
                </div>
                {uploadFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(uploadFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress.toFixed(0)}% concluído</p>
                  </div>
                )}
                {uploadResults && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">{uploadResults.success} importado(s)</span>
                      </div>
                      {uploadResults.failed > 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          <span className="font-semibold">{uploadResults.failed} falhou(ram)</span>
                        </div>
                      )}
                    </div>
                    {uploadResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold mb-2">Erros encontrados:</p>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {uploadResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                        {uploadResults.errors.length >= 20 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Mostrando apenas os primeiros 20 erros...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template CSV
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Fazer Upload
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Instruções:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>O arquivo CSV deve conter as colunas: nome, sobrenome, email, telefone, cpf, data_nascimento, genero, endereco</li>
                  <li>Use o template fornecido para garantir o formato correto</li>
                  <li>O arquivo deve ter no máximo 1000 linhas</li>
                  <li>Certifique-se de que todos os dados obrigatórios estão preenchidos (nome, sobrenome, data de nascimento)</li>
                  <li>Data de nascimento pode estar no formato DD/MM/YYYY ou YYYY-MM-DD</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Patient Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Editar Paciente" : "Cadastrar Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              {editingPatient ? "Atualize os dados do paciente" : "Preencha os dados do paciente"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Data de Nascimento *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefere não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
                <Select
                  value={formData.blood_type}
                  onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Contato de Emergência</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Nome</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Telefone</Label>
                  <Input
                    id="emergency_contact_phone"
                    placeholder="(00) 00000-0000"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Parentesco</Label>
                  <Input
                    id="emergency_contact_relationship"
                    placeholder="Ex: Pai, Mãe, Cônjuge"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Informações Médicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Liste as alergias do paciente..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active_problems">Problemas Ativos</Label>
                  <Textarea
                    id="active_problems"
                    placeholder="Liste os problemas de saúde ativos..."
                    value={formData.active_problems}
                    onChange={(e) => setFormData({ ...formData, active_problems: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais sobre o paciente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : editingPatient ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir Paciente"
        description={patientToDelete ? `Tem certeza que deseja excluir o paciente ${patientToDelete.first_name} ${patientToDelete.last_name}? Esta ação não pode ser desfeita.` : ""}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
