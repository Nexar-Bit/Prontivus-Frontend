"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import { Appointment, Patient, AppointmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, Square, Settings, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface TranscriptionSegment {
  timestamp: number; // seconds
  text: string;
  speaker?: "doctor" | "patient";
}

export default function RecordConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = Number(params.appointmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [fullTranscription, setFullTranscription] = useState("");
  const [patientContext, setPatientContext] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Load appointment data and patient context
  useEffect(() => {
    if (appointmentId) {
      loadData();
      
      // Load patient context from sessionStorage
      const savedContext = sessionStorage.getItem(`patient_context_${appointmentId}`);
      if (savedContext) {
        setPatientContext(savedContext);
      }
    }
  }, [appointmentId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const appointmentData = await appointmentsApi.getById(appointmentId);
      setAppointment(appointmentData);

      const patientData = await patientsApi.getById(appointmentData.patient_id);
      setPatient(patientData);
    } catch (error: any) {
      toast.error("Erro ao carregar dados", {
        description: error.message || "Não foi possível carregar os dados do atendimento",
      });
      router.push(`/medico/atendimento/${appointmentId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Seu navegador não suporta gravação de áudio");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      if (!window.MediaRecorder) {
        toast.error("Seu navegador não suporta gravação de áudio");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const alternatives = ["audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/wav"];
        mimeType = alternatives.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Send chunk for transcription
          transcribeChunk(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        // Final transcription
        transcribeFinalAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Erro na gravação de áudio");
        stopRecording();
      };

      sessionStartTimeRef.current = Date.now();
      mediaRecorder.start(5000); // Collect data every 5 seconds for real-time transcription
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription([]);
      setFullTranscription("");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (error: any) {
      console.error("Error starting recording:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Permissão de microfone negada. Por favor, permita o acesso nas configurações do navegador.");
      } else {
        toast.error("Erro ao iniciar gravação");
      }
    }
  };

  // Transcribe audio chunk (real-time)
  const transcribeChunk = async (audioChunk: Blob) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const formData = new FormData();
      formData.append("audio_file", audioChunk, `chunk_${Date.now()}.webm`);
      formData.append("language", "pt-BR");
      formData.append("enhance_medical_terms", "true");
      formData.append("structure_soap", "false");
      formData.append("appointment_id", appointmentId.toString());

      const response = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.success && result.text) {
        const currentTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;

        const newSegment: TranscriptionSegment = {
          timestamp: currentTime,
          text: result.text,
        };

        setTranscription((prev) => [...prev, newSegment]);
        setFullTranscription((prev) => (prev ? `${prev} ${result.text}` : result.text));
      }
    } catch (error) {
      console.error("Error transcribing chunk:", error);
    }
  };

  // Final transcription
  const transcribeFinalAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      const token = getAccessToken();
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const formData = new FormData();
      formData.append("audio_file", audioBlob, `recording_${appointmentId}.webm`);
      formData.append("language", "pt-BR");
      formData.append("enhance_medical_terms", "true");
      formData.append("structure_soap", "false");
      formData.append("appointment_id", appointmentId.toString());

      const response = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro na transcrição");
      }

      const result = await response.json();
      if (result.success && result.text) {
        setFullTranscription(result.text);
        toast.success("Transcrição concluída");
      }
    } catch (error: any) {
      console.error("Error in final transcription:", error);
      toast.error("Erro na transcrição final");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success("Gravação finalizada");
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
      }
    };
  }, []);

  // Auto-start recording when page loads
  useEffect(() => {
    if (!isLoading && appointment && patient && !isRecording) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        startRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, appointment, patient]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!appointment || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Atendimento não encontrado</h2>
              <Button onClick={() => router.push("/medico/atendimento/fila")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a Fila
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/medico/atendimento/${appointmentId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Consulta</h1>
              <p className="text-sm text-muted-foreground">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Patient Context */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Contexto do paciente</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  placeholder="Preencha este campo com informações clínicas do paciente: medicamentos, prontuários anteriores ou exames. Isso ajuda a fornecer um documento clínico mais completo."
                  value={patientContext}
                  onChange={(e) => setPatientContext(e.target.value)}
                  className="flex-1 resize-none"
                />
              </CardContent>
            </Card>

            {/* Transcription */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transcrição da consulta</CardTitle>
                  <Badge variant="secondary">BETA</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {transcription.length === 0 && !fullTranscription && (
                    <div className="text-center text-muted-foreground py-8">
                      <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aguardando transcrição...</p>
                    </div>
                  )}
                  {fullTranscription && (
                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{fullTranscription}</p>
                    </div>
                  )}
                  {transcription.map((segment, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatTimestamp(segment.timestamp)}
                      </p>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Recording Controls */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"
              }`}
            >
              {isRecording ? (
                <Square className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{formatTime(recordingTime)}</p>
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Gravando..." : "Gravação parada"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRecording ? (
              <Button onClick={stopRecording} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Parar gravação
              </Button>
            ) : (
              <Button onClick={startRecording} disabled={isProcessing}>
                <Mic className="h-4 w-4 mr-2" />
                Iniciar gravação
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
