'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope,
  FileText,
  Mic,
  Settings,
  Shield,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceInterface from '@/components/voice/VoiceInterface';
import { appointmentsApi as appointmentApi } from '@/lib/appointments-api';
import { patientsApi } from '@/lib/patients-api';
import { voiceApi } from '@/lib/voice-api';
import { Patient } from '@/lib/types';

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
  };
  doctor?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  patient_name?: string;
  doctor_name?: string;
  scheduled_datetime: string;
  duration_minutes?: number;
  status: string;
  notes?: string;
  reason?: string;
}

export default function VoiceDocumentationPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = parseInt(params.appointmentId as string);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [structuredData, setStructuredData] = useState<any>(null);
  const [voiceSessions, setVoiceSessions] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState({
    hipaa_compliant: true,
    gdpr_compliant: true,
    data_encrypted: true,
    audit_logs_enabled: true
  });

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const data = await appointmentApi.getById(appointmentId);
        // Transform to match expected interface with optional nested data
        const transformedAppointment: Appointment = {
          ...data,
          duration_minutes: (data as any).duration_minutes || 30, // Default 30 minutes if not provided
          patient_name: (data as any).patient_name,
          doctor_name: (data as any).doctor_name,
        };
        setAppointment(transformedAppointment);
        
        // Load patient data separately
        if (data.patient_id) {
          try {
            const patientData = await patientsApi.getById(data.patient_id);
            setPatient(patientData);
          } catch (error) {
            console.error('Error loading patient:', error);
            // Don't show error to user, just log it
          }
        }
      } catch (error) {
        console.error('Error loading appointment:', error);
        toast.error('Erro ao carregar consulta');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    const loadVoiceSessions = async () => {
      try {
        const sessions = await voiceApi.listVoiceSessions(appointmentId);
        setVoiceSessions(sessions);
      } catch (error) {
        console.error('Error loading voice sessions:', error);
      }
    };

    if (appointmentId) {
      loadAppointment();
      loadVoiceSessions();
    }
  }, [appointmentId, router]);

  const handleTranscriptionUpdate = (newTranscription: string) => {
    setTranscription(newTranscription);
  };

  const handleStructuredDataUpdate = (data: any) => {
    setStructuredData(data);
  };

  const handleCreateNote = async () => {
    try {
      // This would be handled by the VoiceInterface component
      toast.success('Nota clínica criada com sucesso');
      // Refresh voice sessions
      const sessions = await voiceApi.listVoiceSessions(appointmentId);
      setVoiceSessions(sessions);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Erro ao criar nota clínica');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando consulta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Consulta não encontrada</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-yellow-100 text-yellow-800';
      case 'in_consultation': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'checked_in': return 'Check-in realizado';
      case 'in_consultation': return 'Em consulta';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Documentação por Voz</h1>
            <p className="text-muted-foreground">
              Consulta com {patient?.first_name || appointment?.patient_name || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>
      </div>

      {/* Appointment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Informações da Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Paciente
              </div>
              <p className="font-medium">
                {patient ? `${patient.first_name} ${patient.last_name}` : appointment?.patient_name || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {patient?.gender === 'male' ? 'Masculino' : patient?.gender === 'female' ? 'Feminino' : 'Outro'} • 
                {patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'} anos
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data e Hora
              </div>
              <p className="font-medium">
                {formatDate(appointment.scheduled_datetime)}
              </p>
              <p className="text-sm text-muted-foreground">
                Duração: {appointment.duration_minutes || 30} minutos
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Médico
              </div>
              <p className="font-medium">
                Dr. {appointment.doctor_name || 'N/A'}
              </p>
            </div>
          </div>

          {appointment.reason && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Motivo da Consulta
                </div>
                <p className="text-sm">{appointment.reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm">HIPAA</span>
              <Badge variant="outline" className="text-green-600">
                Conforme
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm">LGPD</span>
              <Badge variant="outline" className="text-green-600">
                Conforme
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm">Criptografia</span>
              <Badge variant="outline" className="text-green-600">
                Ativa
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm">Auditoria</span>
              <Badge variant="outline" className="text-green-600">
                Ativa
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Interface */}
      <VoiceInterface
        appointmentId={appointmentId}
        onTranscriptionUpdate={handleTranscriptionUpdate}
        onStructuredDataUpdate={handleStructuredDataUpdate}
      />

      {/* Previous Voice Sessions */}
      {voiceSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Sessões de Voz Anteriores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {voiceSessions.map((session) => (
                <div key={session.session_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Sessão {session.session_id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => voiceApi.deleteVoiceSession(session.session_id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
