"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import { Appointment, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Square,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TranscriptionSegment {
  timestamp: number;
  text: string;
}

interface ICDSuggestion {
  code: string;
  description: string;
  confidence: number;
  approved: boolean;
}

interface ExamSuggestion {
  name: string;
  reason: string;
  approved: boolean;
}

export default function TelemedicinePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = Number(params.appointmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientContext, setPatientContext] = useState("");

  // Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Transcription state
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [fullTranscription, setFullTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"voice" | "manual">("voice");

  // Manual mode fields
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [aiOpinion, setAiOpinion] = useState("");
  const [conduct, setConduct] = useState("");

  // AI Suggestions
  const [icdSuggestions, setIcdSuggestions] = useState<ICDSuggestion[]>([]);
  const [examSuggestions, setExamSuggestions] = useState<ExamSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Refs for media
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Load appointment data
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

  // Start video call
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCallActive(true);
      toast.success("Chamada iniciada");

      // In a real implementation, you would establish WebRTC connection here
      // For now, we just display the local video

    } catch (error: any) {
      console.error("Error starting video call:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Permissão de câmera/microfone negada");
      } else {
        toast.error("Erro ao iniciar chamada de vídeo");
      }
    }
  };

  // End video call
  const endVideoCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setIsCallActive(false);
    toast.info("Chamada encerrada");
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        toast.info(audioTrack.enabled ? "Microfone ligado" : "Microfone desligado");
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        toast.info(videoTrack.enabled ? "Câmera ligada" : "Câmera desligada");
      }
    }
  };

  // Start recording (audio + video + transcription)
  const startRecording = async () => {
    try {
      if (!localStreamRef.current) {
        toast.error("Inicie a chamada de vídeo primeiro");
        return;
      }

      // Create combined recorder for audio and video
      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        const alternatives = ["video/webm", "video/mp4"];
        mimeType = alternatives.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      }

      const mediaRecorder = new MediaRecorder(localStreamRef.current, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
          // Extract audio for transcription
          transcribeFromStream(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(videoChunksRef.current, {
          type: mimeType || "video/webm",
        });
        // Save recording
        await saveRecording(videoBlob);
      };

      sessionStartTimeRef.current = Date.now();
      mediaRecorder.start(5000); // Collect data every 5 seconds
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
      toast.error("Erro ao iniciar gravação");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success("Gravação finalizada");
      // Load AI suggestions after recording stops
      loadAISuggestions();
    }
  };

  // Transcribe from stream
  const transcribeFromStream = async (chunk: Blob) => {
    // In a real implementation, extract audio from video chunk and transcribe
    // For now, this is a placeholder
    try {
      const token = getAccessToken();
      if (!token) return;

      // Create audio-only blob from video chunk (simplified)
      const formData = new FormData();
      formData.append("audio_file", chunk, `chunk_${Date.now()}.webm`);
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
        const newSegment: TranscriptionSegment = {
          timestamp: currentTime,
          text: result.text,
        };

        setTranscription((prev) => [...prev, newSegment]);
        setFullTranscription((prev) => (prev ? `${prev} ${result.text}` : result.text));
      }
    } catch (error) {
      console.error("Error transcribing stream:", error);
    }
  };

  // Save recording (video/audio)
  const saveRecording = async (videoBlob: Blob) => {
    try {
      setIsProcessing(true);
      const token = getAccessToken();
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const formData = new FormData();
      formData.append("video_file", videoBlob, `telemedicine_${appointmentId}.webm`);
      formData.append("appointment_id", appointmentId.toString());

      const response = await fetch(`${API_URL}/api/v1/voice/save-telemedicine-recording`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar gravação");
      }

      toast.success("Gravação salva com sucesso");
    } catch (error: any) {
      console.error("Error saving recording:", error);
      toast.error("Erro ao salvar gravação");
    } finally {
      setIsProcessing(false);
    }
  };

  // Load AI suggestions
  const loadAISuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const token = getAccessToken();
      if (!token) return;

      const contentToAnalyze = recordingMode === "voice" ? fullTranscription : `${anamnesis}\n\n${physicalExam}`;

      if (!contentToAnalyze.trim()) {
        toast.error("Não há conteúdo para gerar sugestões");
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/ai/suggest-diagnosis`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: contentToAnalyze,
          patient_context: patientContext,
          appointment_id: appointmentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar sugestões");
      }

      const result = await response.json();

      if (result.icd_codes && Array.isArray(result.icd_codes)) {
        const suggestions = result.icd_codes.map((icd: any) => ({
          code: icd.code,
          description: icd.description,
          confidence: icd.confidence || 0.8,
          approved: false,
        }));
        setIcdSuggestions(suggestions);
      }

      if (result.recommended_exams && Array.isArray(result.recommended_exams)) {
        const exams = result.recommended_exams.map((exam: any) => ({
          name: exam.name || exam,
          reason: exam.reason || "Recomendado baseado no diagnóstico",
          approved: false,
        }));
        setExamSuggestions(exams);
      }

      toast.success("Sugestões da IA carregadas");
    } catch (error: any) {
      console.error("Error loading AI suggestions:", error);
      toast.error("Erro ao carregar sugestões da IA");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Toggle ICD approval
  const toggleICDApproval = (index: number) => {
    setIcdSuggestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, approved: !item.approved } : item))
    );
  };

  // Toggle exam approval
  const toggleExamApproval = (index: number) => {
    setExamSuggestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, approved: !item.approved } : item))
    );
  };

  // Remove ICD suggestion
  const removeICDSuggestion = (index: number) => {
    setIcdSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove exam suggestion
  const removeExamSuggestion = (index: number) => {
    setExamSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Cleanup
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
              <h1 className="text-2xl font-bold">Telemedicina</h1>
              <p className="text-sm text-muted-foreground">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isCallActive ? "default" : "secondary"}>
              {isCallActive ? "Chamada Ativa" : "Chamada Inativa"}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                Gravando
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column - Video Call */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Display */}
              <Card className="relative">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    {/* Remote video (patient) */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Local video (doctor) - Picture in Picture */}
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* No call overlay */}
                    {!isCallActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-white mb-4">Clique para iniciar a chamada de vídeo</p>
                          <Button onClick={startVideoCall} size="lg">
                            <Video className="h-5 w-5 mr-2" />
                            Iniciar Chamada
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Call controls */}
                    {isCallActive && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center gap-2 bg-black/50 rounded-full p-2">
                          <Button
                            size="icon"
                            variant={isMicOn ? "secondary" : "destructive"}
                            onClick={toggleMic}
                            className="rounded-full"
                          >
                            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant={isVideoOn ? "secondary" : "destructive"}
                            onClick={toggleVideo}
                            className="rounded-full"
                          >
                            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={endVideoCall}
                            className="rounded-full"
                          >
                            <PhoneOff className="h-4 w-4" />
                          </Button>
                          {isRecording ? (
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={stopRecording}
                              className="rounded-full animate-pulse"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={startRecording}
                              className="rounded-full"
                              disabled={!isCallActive}
                            >
                              <Mic className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recording timer */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {formatTime(recordingTime)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Context */}
              <Card>
                <CardHeader>
                  <CardTitle>Contexto do paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Informações clínicas do paciente..."
                    value={patientContext}
                    onChange={(e) => setPatientContext(e.target.value)}
                    className="min-h-[100px] resize-y"
                  />
                </CardContent>
              </Card>

              {/* Transcription / Manual Entry */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Documentação</CardTitle>
                    <Tabs value={recordingMode} onValueChange={(v) => setRecordingMode(v as "voice" | "manual")}>
                      <TabsList className="grid w-[200px] grid-cols-2">
                        <TabsTrigger value="voice">Voz</TabsTrigger>
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  {recordingMode === "voice" ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {transcription.length === 0 && !fullTranscription ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aguardando transcrição...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fullTranscription && <p className="text-sm whitespace-pre-wrap">{fullTranscription}</p>}
                          {transcription.map((segment, index) => (
                            <div key={index} className="space-y-1">
                              <p className="text-xs text-muted-foreground font-mono">
                                {formatTimestamp(segment.timestamp)}
                              </p>
                              <p className="text-sm">{segment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Anamnese</label>
                        <Textarea
                          placeholder="História clínica..."
                          value={anamnesis}
                          onChange={(e) => setAnamnesis(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Exame Físico</label>
                        <Textarea
                          placeholder="Achados do exame..."
                          value={physicalExam}
                          onChange={(e) => setPhysicalExam(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Conduta</label>
                        <Textarea
                          placeholder="Tratamento, prescrições..."
                          value={conduct}
                          onChange={(e) => setConduct(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button onClick={loadAISuggestions} disabled={loadingSuggestions || (!anamnesis && !physicalExam)}>
                        {loadingSuggestions ? "Carregando..." : "Gerar Sugestões da IA"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Suggestions */}
            <div className="space-y-6">
              {/* ICD-10 Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sugestões de CID-10</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                  ) : icdSuggestions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Nenhuma sugestão disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {icdSuggestions.map((icd, index) => (
                        <Alert key={index} className={icd.approved ? "border-green-500 bg-green-50" : ""}>
                          <AlertDescription>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{icd.code}</p>
                                <p className="text-xs text-muted-foreground mt-1">{icd.description}</p>
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {Math.round(icd.confidence * 100)}% confiança
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={icd.approved ? "default" : "outline"}
                                  onClick={() => toggleICDApproval(index)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeICDSuggestion(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exam Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sugestões de Exames</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                  ) : examSuggestions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Nenhuma sugestão disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examSuggestions.map((exam, index) => (
                        <Alert key={index} className={exam.approved ? "border-green-500 bg-green-50" : ""}>
                          <AlertDescription>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{exam.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{exam.reason}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={exam.approved ? "default" : "outline"}
                                  onClick={() => toggleExamApproval(index)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => removeExamSuggestion(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
