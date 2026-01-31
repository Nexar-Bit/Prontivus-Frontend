"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { appointmentsApi } from "@/lib/appointments-api";
import { patientsApi } from "@/lib/patients-api";
import { Appointment, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Mic,
  Pause,
  Square,
  Upload,
  Download,
  Search,
  FileText,
  Phone,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInYears } from "date-fns";

interface TranscriptionMessage {
  id: string;
  timestamp: string;
  speaker: "doctor" | "patient";
  speakerName: string;
  text: string;
}

interface AttachedExam {
  id: number;
  name: string;
  date: string;
  size: string;
  status: string;
  url: string;
  selected?: boolean;
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

export default function RecordV2Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = Number(params.appointmentId);

  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Transcription state
  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Attached exams state
  const [attachedExams, setAttachedExams] = useState<AttachedExam[]>([]);
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [selectedExams, setSelectedExams] = useState<Set<number>>(new Set());
  const [showExamSelection, setShowExamSelection] = useState(false);

  // AI Suggestions state (shown after ending consultation)
  const [icdSuggestions, setIcdSuggestions] = useState<ICDSuggestion[]>([]);
  const [examSuggestions, setExamSuggestions] = useState<ExamSuggestion[]>([]);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load appointment data
  useEffect(() => {
    if (appointmentId) {
      loadData();
    }
  }, [appointmentId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const appointmentData = await appointmentsApi.getById(appointmentId);
      setAppointment(appointmentData);

      const patientData = await patientsApi.getById(appointmentData.patient_id);
      setPatient(patientData);

      // Load patient's exams
      await loadPatientExams(appointmentData.patient_id);
    } catch (error: any) {
      toast.error("Erro ao carregar dados", {
        description: error.message || "Não foi possível carregar os dados do atendimento",
      });
      router.push(`/medico/atendimento/${appointmentId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientExams = async (patientId: number) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/files/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const exams = await response.json();
        setAttachedExams(
          exams.map((exam: any) => ({
            id: exam.id,
            name: exam.filename,
            date: exam.upload_date,
            size: formatFileSize(exam.file_size || 0),
            status: exam.status || "Normal",
            url: exam.file_url,
            selected: false,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading patient exams:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + " " + sizes[i];
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Send chunk for real-time transcription
          await transcribeChunk(event.data);
        }
      };

      mediaRecorder.start(3000); // Collect data every 3 seconds
      setIsRecording(true);
      setRecordingTime(0);

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

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      if (timerRef.current) {
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }
      setIsPaused(false);
      toast.info("Gravação retomada");
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPaused(true);
      toast.info("Gravação pausada");
    }
  };

  // Stop recording and show exam selection
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }

      toast.success("Gravação finalizada");
      
      // Show exam selection dialog
      setShowExamSelection(true);
    }
  };

  // Transcribe audio chunk in real-time
  const transcribeChunk = async (chunk: Blob) => {
    if (!chunk || chunk.size === 0) return;

    try {
      setIsTranscribing(true);
      const token = getAccessToken();
      if (!token) return;

      const formData = new FormData();
      formData.append("audio_file", chunk, `chunk_${Date.now()}.webm`);
      formData.append("language", "pt-BR");
      formData.append("enhance_medical_terms", "true");
      formData.append("structure_soap", "false");
      formData.append("appointment_id", appointmentId.toString());

      const response = await fetch(`${API_URL}/voice/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.text) {
          // Add message to transcription
          const newMessage: TranscriptionMessage = {
            id: `msg_${Date.now()}`,
            timestamp: new Date().toISOString(),
            speaker: "doctor", // In real implementation, use speaker detection
            speakerName: user?.first_name + " " + user?.last_name || "Dr. Mitchell",
            text: result.text,
          };
          setMessages((prev) => [...prev, newMessage]);
          
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error transcribing chunk:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Analyze with AI (transcription + selected exams)
  const analyzeWithAI = async () => {
    try {
      setLoadingAISuggestions(true);
      setShowExamSelection(false);

      const token = getAccessToken();
      if (!token) return;

      // Get full transcription text
      const fullTranscription = messages.map((m) => `${m.speakerName}: ${m.text}`).join("\n\n");

      // Get selected exam IDs
      const selectedExamIds = Array.from(selectedExams);

      const response = await fetch(`${API_URL}/ai/analyze-consultation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: fullTranscription,
          appointment_id: appointmentId,
          exam_ids: selectedExamIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Set ICD suggestions
        if (result.icd_codes && Array.isArray(result.icd_codes)) {
          setIcdSuggestions(
            result.icd_codes.map((icd: any) => ({
              code: icd.code,
              description: icd.description,
              confidence: icd.confidence || 0.8,
              approved: false,
            }))
          );
        }

        // Set exam suggestions
        if (result.recommended_exams && Array.isArray(result.recommended_exams)) {
          setExamSuggestions(
            result.recommended_exams.map((exam: any) => ({
              name: exam.name || exam,
              reason: exam.reason || "Recomendado baseado no diagnóstico",
              approved: false,
            }))
          );
        }

        toast.success("Análise da IA concluída");
      } else {
        throw new Error("Erro ao analisar consulta");
      }
    } catch (error: any) {
      console.error("Error analyzing with AI:", error);
      toast.error("Erro ao analisar com IA");
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Toggle exam selection
  const toggleExamSelection = (examId: number) => {
    setSelectedExams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Filter exams
  const filteredExams = attachedExams.filter((exam) =>
    exam.name.toLowerCase().includes(examSearchQuery.toLowerCase())
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/medico/atendimento/${appointmentId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {patient.first_name[0]}{patient.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {patient.first_name} {patient.last_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.date_of_birth ? `${differenceInYears(new Date(), new Date(patient.date_of_birth))} anos` : "N/A"}
                  </span>
                  <span>ID: P-{patient.id}</span>
                  <span>{format(new Date(), "HH:mm a")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-500">Active</Badge>
            <Button size="sm" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Chamar Paciente
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Real-Time Transcription */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-220px)] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Transcrição em Tempo Real</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isRecording ? "Áudio sendo gravado e transcrito" : "Inicie a gravação para começar"}
                      </p>
                    </div>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="animate-pulse">
                        Gravando
                      </Badge>
                      <span className="text-sm font-mono font-semibold">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                      <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aguardando transcrição...</p>
                      <p className="text-sm mt-2">Clique em "Iniciar Gravação" para começar</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.speaker === "doctor" ? "flex-row" : "flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.speaker === "doctor" ? "bg-blue-100" : "bg-purple-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold ${
                              message.speaker === "doctor" ? "text-blue-600" : "text-purple-600"
                            }`}
                          >
                            {message.speakerName.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div
                          className={`flex-1 ${
                            message.speaker === "doctor" ? "text-left" : "text-right"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{message.speakerName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.timestamp), "HH:mm a")}
                            </span>
                          </div>
                          <div
                            className={`inline-block px-4 py-2 rounded-lg ${
                              message.speaker === "doctor"
                                ? "bg-blue-50 text-blue-900"
                                : "bg-purple-50 text-purple-900"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTranscribing && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="text-sm ml-2">Transcrevendo...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>

              {/* Bottom Controls */}
              <div className="border-t p-4 flex items-center justify-center gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="w-full max-w-md">
                    <Mic className="h-5 w-5 mr-2" />
                    Iniciar Gravação
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} size="lg" variant="outline" className="flex-1">
                      <Pause className="h-5 w-5 mr-2" />
                      {isPaused ? "Retomar Gravação" : "Pausar Gravação"}
                    </Button>
                    <Button onClick={stopRecording} size="lg" variant="destructive" className="flex-1">
                      <Square className="h-5 w-5 mr-2" />
                      Finalizar Consulta
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Right - Attached Exams */}
          <div>
            <Card className="h-[calc(100vh-220px)] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Exames Anexados</CardTitle>
                  <Button size="sm" variant="ghost">+</Button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exames..."
                    value={examSearchQuery}
                    onChange={(e) => setExamSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
                {filteredExams.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum exame anexado</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <p className="text-sm font-semibold">{exam.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(exam.date), "MMM dd, yyyy")} • {exam.size}
                            </p>
                            <Badge
                              variant="outline"
                              className={`mt-2 text-xs ${
                                exam.status === "Normal"
                                  ? "border-green-500 text-green-600"
                                  : exam.status === "Review"
                                  ? "border-yellow-500 text-yellow-600"
                                  : "border-blue-500 text-blue-600"
                              }`}
                            >
                              {exam.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4">
                <Button className="w-full" variant="default">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Exam
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* AI Suggestions (shown after analysis) */}
        {(icdSuggestions.length > 0 || examSuggestions.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* ICD Suggestions */}
            {icdSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sugestões de CID-10</CardTitle>
                </CardHeader>
                <CardContent>
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
                            <Checkbox
                              checked={icd.approved}
                              onCheckedChange={() => {
                                setIcdSuggestions((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, approved: !item.approved } : item
                                  )
                                );
                              }}
                            />
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exam Suggestions */}
            {examSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Exames Recomendados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {examSuggestions.map((exam, index) => (
                      <Alert key={index} className={exam.approved ? "border-green-500 bg-green-50" : ""}>
                        <AlertDescription>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{exam.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{exam.reason}</p>
                            </div>
                            <Checkbox
                              checked={exam.approved}
                              onCheckedChange={() => {
                                setExamSuggestions((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, approved: !item.approved } : item
                                  )
                                );
                              }}
                            />
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Exam Selection Dialog */}
      {showExamSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Selecione os exames para análise da IA</CardTitle>
              <p className="text-sm text-muted-foreground">
                A IA analisará a transcrição junto com os exames selecionados para sugerir códigos CID e exames necessários.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attachedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExamSelection(exam.id)}
                  >
                    <Checkbox checked={selectedExams.has(exam.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(exam.date), "MMM dd, yyyy")} • {exam.size}
                      </p>
                    </div>
                    <Badge variant="outline">{exam.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="border-t p-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExamSelection(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={analyzeWithAI}
                disabled={loadingAISuggestions}
              >
                {loadingAISuggestions ? "Analisando..." : "Analisar com IA"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
