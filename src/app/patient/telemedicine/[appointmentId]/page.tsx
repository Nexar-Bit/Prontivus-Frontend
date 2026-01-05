"use client";

/* eslint-disable react/forbid-dom-props */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Settings,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  FileText,
  X,
  Maximize2,
  Minimize2,
  MessageCircle,
  Share2,
  Monitor,
  Wifi,
  WifiOff,
  Calendar,
  Star,
  Download,
  MapPin,
  ShoppingCart,
  ChevronRight,
  Loader2,
  Shield,
  CheckCircle,
  Camera,
  Volume2,
  FileCheck,
  HelpCircle,
  Send,
} from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PatientHeader } from "@/components/patient/Navigation/PatientHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

// Types
interface Appointment {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  reason?: string;
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    specialty?: string;
    photo?: string;
  };
}

interface PreConsultQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  value?: string | string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface Vitals {
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenSaturation?: number;
}

type ConsultationPhase = 'waiting' | 'preparation' | 'active' | 'ended' | 'summary';

export default function TelemedicinePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [phase, setPhase] = useState<ConsultationPhase>('waiting');
  const [waitTime, setWaitTime] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video/Audio states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('good');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'patient' | 'doctor'; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Preparation states
  const [preparationChecks, setPreparationChecks] = useState({
    camera: false,
    microphone: false,
    documents: false,
    questions: false,
  });
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [preConsultQuestions, setPreConsultQuestions] = useState<PreConsultQuestion[]>([
    { id: '1', question: 'Você está em jejum?', type: 'select', required: true, options: ['Sim', 'Não', 'Não se aplica'] },
    { id: '2', question: 'Liste os medicamentos que você está tomando atualmente', type: 'textarea', required: false },
    { id: '3', question: 'Você tem alguma alergia conhecida?', type: 'text', required: false },
    { id: '4', question: 'Descreva seus sintomas atuais', type: 'textarea', required: true },
  ]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  
  // Post-consultation states
  const [visitSummary, setVisitSummary] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<Array<{ id: string; medication: string; dosage: string }>>([]);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Vitals
  const [vitals, setVitals] = useState<Vitals | null>(null);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch appointment data from API
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setIsLoading(true);
        // Fetch appointment data from API
        const data = await api.get<Appointment>(`/api/v1/appointments/${appointmentId}`);
        setAppointment(data);
      } catch (error) {
        console.error('Error loading appointment:', error);
        // Fallback to mock data on error (for development/testing)
        const mockAppointment: Appointment = {
          id: Number(appointmentId),
          scheduled_datetime: new Date().toISOString(),
          duration_minutes: 30,
          status: 'scheduled',
          appointment_type: 'telemedicine',
          reason: 'Consulta de rotina',
          doctor: {
            id: 1,
            first_name: 'Maria',
            last_name: 'Silva',
            specialty: 'Cardiologia',
          },
        };
        setAppointment(mockAppointment);
      } finally {
        setIsLoading(false);
      }
    };
    loadAppointment();

    // Simulate waiting time countdown
    const interval = setInterval(() => {
      setWaitTime(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [appointmentId]);

  // Check camera and microphone
  useEffect(() => {
    const checkMediaDevices = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('MediaDevices API not available');
          return;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (mediaError: any) {
          console.error('Error accessing media devices:', mediaError);
          
          // Handle specific errors gracefully
          if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            // Device not found - set both to false
            setPreparationChecks(prev => ({
              ...prev,
              camera: false,
              microphone: false,
            }));
          } else if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            // Permission denied - set both to false
            setPreparationChecks(prev => ({
              ...prev,
              camera: false,
              microphone: false,
            }));
          }
          return;
        }

        setPreparationChecks(prev => ({
          ...prev,
          camera: !!stream.getVideoTracks()[0],
          microphone: !!stream.getAudioTracks()[0],
        }));
        stream.getTracks().forEach(track => track.stop());
      } catch (error: any) {
        console.error('Error checking media devices:', error);
        // Set both to false on any error
        setPreparationChecks(prev => ({
          ...prev,
          camera: false,
          microphone: false,
        }));
      }
    };
    checkMediaDevices();
  }, []);

  // Mock vitals
  useEffect(() => {
    if (phase === 'active') {
      const vitalsInterval = setInterval(() => {
        setVitals({
          heartRate: Math.floor(Math.random() * 20) + 65,
          bloodPressure: {
            systolic: Math.floor(Math.random() * 20) + 110,
            diastolic: Math.floor(Math.random() * 10) + 70,
          },
          temperature: Number((Math.random() * 0.5 + 36.5).toFixed(1)),
          oxygenSaturation: Math.floor(Math.random() * 5) + 95,
        });
      }, 3000);
      return () => clearInterval(vitalsInterval);
    }
  }, [phase]);

  // Connection quality simulation
  useEffect(() => {
    if (phase === 'active') {
      const qualityInterval = setInterval(() => {
        const rand = Math.random();
        if (rand > 0.8) {
          setConnectionQuality('excellent');
        } else if (rand > 0.5) {
          setConnectionQuality('good');
        } else if (rand > 0.2) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('offline');
        }
      }, 5000);
      return () => clearInterval(qualityInterval);
    }
  }, [phase]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
      };
      setUploadedDocs(prev => [...prev, newDoc]);
    });

    setPreparationChecks(prev => ({ ...prev, documents: true }));
  };

  const removeDocument = (id: string) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== id));
    if (uploadedDocs.length === 1) {
      setPreparationChecks(prev => ({ ...prev, documents: false }));
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setQuestionAnswers(prev => ({ ...prev, [questionId]: value }));
    const question = preConsultQuestions.find(q => q.id === questionId);
    if (question?.required && value) {
      // Check if all required questions are answered
      const allRequiredAnswered = preConsultQuestions
        .filter(q => q.required)
        .every(q => questionAnswers[q.id] || q.id === questionId && value);
      if (allRequiredAnswered) {
        setPreparationChecks(prev => ({ ...prev, questions: true }));
      }
    }
  };

  const startConsultation = () => {
    setPhase('active');
    setIsConnected(true);
    // Initialize WebRTC connection here
  };

  const endConsultation = () => {
    setPhase('ended');
    setIsConnected(false);
    setTimeout(() => {
      setPhase('summary');
      setShowRatingModal(true);
    }, 2000);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: 'patient' as const,
      message: chatInput,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'poor':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return <Wifi className="h-4 w-4" />;
      case 'poor':
      case 'offline':
        return <WifiOff className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C75]" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Card className="medical-card">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">Consulta não encontrada</p>
            <Button onClick={() => router.push('/patient/appointments')} className="mt-4">
              Voltar para Agendamentos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting Room
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <PatientHeader showSearch={false} notificationCount={3} />
        <main className="max-w-4xl mx-auto p-4 lg:p-6 pt-20">
          <Card className="medical-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-2xl text-[#0F4C75]">
                Sala de Espera
              </CardTitle>
              <CardDescription>
                Sua consulta começará em breve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Doctor Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 rounded-lg">
                <Avatar className="h-16 w-16 border-2 border-purple-200">
                  <AvatarImage src={appointment.doctor.photo} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {appointment.doctor.first_name[0]}{appointment.doctor.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900">
                    Dr(a). {appointment.doctor.first_name} {appointment.doctor.last_name}
                  </div>
                  <div className="text-sm text-gray-600">{appointment.doctor.specialty || 'Clínico Geral'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Consulta agendada para {format(parseISO(appointment.scheduled_datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>

              {/* Wait Time */}
              <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-sm text-blue-700 mb-2">Tempo estimado de espera</div>
                <div className="text-4xl font-bold text-[#0F4C75] mb-1">
                  {waitTime} {waitTime === 1 ? 'minuto' : 'minutos'}
                </div>
                <div className="text-xs text-blue-600">O médico entrará em breve</div>
              </div>

              {/* Preparation Checklist */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Checklist de Preparação</h3>
                <div className="space-y-3">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                    preparationChecks.camera ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {preparationChecks.camera ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Camera className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={preparationChecks.camera ? "text-green-700" : "text-gray-600"}>
                      Câmera verificada
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                    preparationChecks.microphone ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {preparationChecks.microphone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Mic className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={preparationChecks.microphone ? "text-green-700" : "text-gray-600"}>
                      Microfone verificado
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                    preparationChecks.documents ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {preparationChecks.documents ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileCheck className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={preparationChecks.documents ? "text-green-700" : "text-gray-600"}>
                      Documentos preparados
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                    preparationChecks.questions ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {preparationChecks.questions ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={preparationChecks.questions ? "text-green-700" : "text-gray-600"}>
                      Questionário respondido
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Documentos Médicos</h3>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0F4C75] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-1">
                    Clique para fazer upload ou arraste arquivos aqui
                  </div>
                  <div className="text-xs text-gray-500">
                    PDF, imagens ou documentos (máx. 10MB)
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload documentos médicos"
                  />
                </div>
                {uploadedDocs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pre-Consult Questions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Questionário Pré-Consulta</h3>
                <div className="space-y-4">
                  {preConsultQuestions.map(question => (
                    <div key={question.id}>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {question.type === 'text' && (
                        <Input
                          value={questionAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Digite sua resposta"
                        />
                      )}
                      {question.type === 'textarea' && (
                        <Textarea
                          value={questionAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Digite sua resposta"
                          rows={3}
                        />
                      )}
                      {question.type === 'select' && question.options && (
                        <select
                          value={questionAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                          aria-label={question.question}
                          title={question.question}
                        >
                          <option value="">Selecione uma opção</option>
                          {question.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready Button */}
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (preparationChecks.camera && preparationChecks.microphone) {
                    setPhase('preparation');
                  }
                }}
                disabled={!preparationChecks.camera || !preparationChecks.microphone}
              >
                {preparationChecks.camera && preparationChecks.microphone ? 'Aguardar Médico' : 'Complete o checklist para continuar'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Preparation Phase (Doctor connecting)
  if (phase === 'preparation') {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
        <Card className="medical-card max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Conectando com o médico...
            </h3>
            <p className="text-gray-600 mb-6">
              Por favor, aguarde enquanto estabelecemos a conexão
            </p>
            <Progress value={75} className="mb-4" />
            <div className="text-sm text-gray-500">
              Configurando áudio e vídeo...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Consultation
  if (phase === 'active') {
    return (
      <div className={cn("min-h-screen bg-gray-900", isFullscreen && "fixed inset-0 z-50")}>
        {/* Main Video Container */}
        <div className="relative h-screen flex flex-col">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={appointment.doctor.photo} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {appointment.doctor.first_name[0]}{appointment.doctor.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-white font-semibold">
                  Dr(a). {appointment.doctor.first_name} {appointment.doctor.last_name}
                </div>
                <div className="text-xs text-white/70">{appointment.doctor.specialty}</div>
              </div>
              <Badge className={cn("ml-2", getConnectionQualityColor())}>
                {getConnectionQualityIcon()}
                <span className="ml-1">
                  {connectionQuality === 'excellent' && 'Excelente'}
                  {connectionQuality === 'good' && 'Bom'}
                  {connectionQuality === 'poor' && 'Ruim'}
                  {connectionQuality === 'offline' && 'Offline'}
                </span>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white text-sm">
                {format(new Date(), 'HH:mm', { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            {/* Remote Video (Doctor) - Main */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full max-w-6xl">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-lg bg-gray-800"
                />
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                      <p className="text-white">Conectando...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Local Video (Patient) - Picture-in-Picture */}
            <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  !isVideoEnabled && "bg-gray-800"
                )}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Vitals Panel */}
            {vitals && (
              <div className="absolute top-20 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white z-10">
                <div className="text-xs text-white/70 mb-2">Sinais Vitais</div>
                <div className="space-y-1 text-sm">
                  {vitals.heartRate && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/70">FC:</span>
                      <span className="font-semibold">{vitals.heartRate} bpm</span>
                    </div>
                  )}
                  {vitals.bloodPressure && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/70">PA:</span>
                      <span className="font-semibold">
                        {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg
                      </span>
                    </div>
                  )}
                  {vitals.temperature && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/70">Temp:</span>
                      <span className="font-semibold">{vitals.temperature}°C</span>
                    </div>
                  )}
                  {vitals.oxygenSaturation && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/70">SpO2:</span>
                      <span className="font-semibold">{vitals.oxygenSaturation}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Records Quick Access */}
            <div className="absolute top-20 right-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white"
                onClick={() => setShowChat(!showChat)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Registros
              </Button>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="absolute right-0 top-0 bottom-24 w-80 bg-white border-l border-gray-200 z-30 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="font-semibold text-gray-900">Chat Seguro</div>
                <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === 'patient' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-lg p-2 text-sm",
                        msg.sender === 'patient'
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button size="icon" onClick={sendChatMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className="rounded-full"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="rounded-full"
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setShowChat(!showChat)}
                  className="rounded-full"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full"
                  title="Compartilhar tela (em breve)"
                >
                  <Monitor className="h-5 w-5" />
                </Button>
              </div>
              <Button
                size="lg"
                variant="destructive"
                onClick={endConsultation}
                className="rounded-full bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Encerrar Consulta
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Summary Phase
  if (phase === 'summary') {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <PatientHeader showSearch={false} notificationCount={3} />
        <main className="max-w-4xl mx-auto p-4 lg:p-6 pt-20">
          <Card className="medical-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-[#0F4C75]">
                    Consulta Finalizada
                  </CardTitle>
                  <CardDescription>
                    Resumo da sua consulta de telemedicina
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visit Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Resumo da Consulta</h3>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {visitSummary || 'Consulta realizada com sucesso. O médico revisou seus sintomas e atualizou seu plano de tratamento.'}
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Próximos Passos</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Seguir prescrição médica</div>
                      <div className="text-sm text-gray-600">Tome os medicamentos conforme orientado</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Agendar retorno se necessário</div>
                      <div className="text-sm text-gray-600">Retorne em 30 dias ou conforme orientado</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescriptions */}
              {prescriptions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Prescrições</h3>
                  <div className="space-y-3">
                    {prescriptions.map(script => (
                      <Card key={script.id} className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{script.medication}</div>
                              <div className="text-sm text-gray-600">{script.dosage}</div>
                            </div>
                            <Button variant="outline" size="sm">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Encontrar Farmácia
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Follow-up */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Agendar Retorno</h3>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/patient/appointments')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Próxima Consulta
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Resumo
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Prescrição
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Rating Modal */}
        <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avalie sua Consulta</DialogTitle>
              <DialogDescription>
                Sua opinião nos ajuda a melhorar nosso serviço
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Como você avalia esta consulta?</div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-all hover:scale-110"
                      aria-label={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                      title={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8",
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Comentários (opcional)</div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Compartilhe sua experiência..."
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-[#0F4C75] hover:bg-[#1B9AAA]"
                onClick={() => {
                  setShowRatingModal(false);
                  router.push('/patient/appointments');
                }}
              >
                Enviar Avaliação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}

