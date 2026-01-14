"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, HelpCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConsultationMode = "presencial" | "telemedicina";

interface StartConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (mode: ConsultationMode, patientContext?: string, audioDeviceId?: string) => void;
  isStarting?: boolean;
}

export function StartConsultationDialog({
  open,
  onOpenChange,
  onStart,
  isStarting = false,
}: StartConsultationDialogProps) {
  const [mode, setMode] = useState<ConsultationMode>("presencial");
  const [patientContext, setPatientContext] = useState("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [currentAudioDevice, setCurrentAudioDevice] = useState<MediaDeviceInfo | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load audio devices
  useEffect(() => {
    if (open) {
      loadAudioDevices();
      requestMicrophoneAccess();
    } else {
      stopAudioMonitoring();
      cleanup();
    }
  }, [open]);

  // Monitor audio levels
  useEffect(() => {
    if (isAudioActive && analyserRef.current) {
      monitorAudioLevels();
    } else {
      stopAudioMonitoring();
    }

    return () => {
      stopAudioMonitoring();
    };
  }, [isAudioActive, selectedAudioDeviceId]);

  const loadAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === "audioinput");
      setAudioDevices(audioInputs);

      // Try to get current default device
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          const deviceId = settings.deviceId;
          
          const currentDevice = audioInputs.find((d) => d.deviceId === deviceId);
          if (currentDevice) {
            setCurrentAudioDevice(currentDevice);
            setSelectedAudioDeviceId(deviceId);
          } else if (audioInputs.length > 0) {
            setCurrentAudioDevice(audioInputs[0]);
            setSelectedAudioDeviceId(audioInputs[0].deviceId);
          }
        }
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Error getting default device:", error);
      }
    } catch (error) {
      console.error("Error loading audio devices:", error);
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Seu navegador não suporta acesso a microfone");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsAudioActive(true);

      // Setup audio context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (error: any) {
      console.error("Error requesting microphone:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Permissão de microfone negada. Por favor, permita o acesso nas configurações do navegador.");
      } else {
        toast.error("Erro ao acessar microfone");
      }
    }
  };

  const monitorAudioLevels = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevels = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Audio is active if average is above threshold
      setIsAudioActive(average > 5);

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsAudioActive(false);
  };

  const handleDeviceChange = async (deviceId: string) => {
    try {
      cleanup();
      setSelectedAudioDeviceId(deviceId);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      
      streamRef.current = stream;
      setIsAudioActive(true);

      // Setup audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const selectedDevice = audioDevices.find((d) => d.deviceId === deviceId);
      if (selectedDevice) {
        setCurrentAudioDevice(selectedDevice);
      }

      setShowDeviceSelect(false);
      toast.success("Dispositivo de áudio alterado");
    } catch (error: any) {
      console.error("Error changing device:", error);
      toast.error("Erro ao alterar dispositivo de áudio");
    }
  };

  const handleStart = () => {
    onStart(mode, patientContext || undefined, selectedAudioDeviceId || undefined);
    cleanup();
  };

  const getDeviceLabel = (device: MediaDeviceInfo) => {
    if (device.label) {
      return device.label;
    }
    return `Microfone ${audioDevices.indexOf(device) + 1}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Iniciar Atendimento</DialogTitle>
          <DialogDescription>
            Configure a modalidade e o contexto do atendimento antes de iniciar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Consultation Mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="mode">Modalidade da consulta</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Escolha se o atendimento será presencial ou por telemedicina</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "presencial" ? "default" : "outline"}
                className={`flex-1 ${
                  mode === "presencial"
                    ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                    : ""
                }`}
                onClick={() => setMode("presencial")}
              >
                Presencial
              </Button>
              <Button
                type="button"
                variant={mode === "telemedicina" ? "default" : "outline"}
                className={`flex-1 ${
                  mode === "telemedicina"
                    ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                    : ""
                }`}
                onClick={() => setMode("telemedicina")}
              >
                Telemedicina
              </Button>
            </div>
          </div>

          {/* Patient Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Contexto do paciente</Label>
            <Textarea
              id="context"
              placeholder="Preencha este campo com informações clínicas do paciente: medicamentos, prontuários anteriores ou exames. Isso ajuda a fornecer um documento clínico mais completo."
              value={patientContext}
              onChange={(e) => setPatientContext(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          </div>

          {/* Audio Configuration */}
          <div className="space-y-3">
            <Label>Configurações de áudio</Label>
            {!showDeviceSelect ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${isAudioActive ? "bg-green-100" : "bg-gray-200"}`}>
                    <Mic className={`h-4 w-4 ${isAudioActive ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentAudioDevice
                        ? getDeviceLabel(currentAudioDevice)
                        : "Nenhum dispositivo selecionado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAudioActive ? "Captando áudio" : "Áudio não disponível"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeviceSelect(true)}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 border rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                  {audioDevices.length > 0 ? (
                    <div className="space-y-2">
                      {audioDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          type="button"
                          onClick={() => handleDeviceChange(device.deviceId)}
                          className={`w-full text-left p-2 rounded hover:bg-gray-200 transition-colors ${
                            selectedAudioDeviceId === device.deviceId
                              ? "bg-purple-100 border border-purple-300"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Radio
                              className={`h-4 w-4 ${
                                selectedAudioDeviceId === device.deviceId
                                  ? "text-purple-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <span className="text-sm">{getDeviceLabel(device)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum dispositivo de áudio encontrado
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowDeviceSelect(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              cleanup();
              onOpenChange(false);
            }}
            disabled={isStarting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isStarting ? (
              <>
                <Mic className="h-4 w-4 mr-2 animate-pulse" />
                Iniciando...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Gravar consulta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
