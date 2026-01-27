'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { voiceApi, VoiceProcessingResult, VoiceCommandSuggestion } from '@/lib/voice-api';

interface VoiceInterfaceProps {
  appointmentId: number;
  onTranscriptionUpdate?: (transcription: string) => void;
  onStructuredDataUpdate?: (data: any) => void;
  className?: string;
}

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  sessionId?: string;
  transcription: string;
  structuredData: any;
  confidence: number;
  commands: any[];
  medicalTerms: any[];
  suggestions: VoiceCommandSuggestion[];
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  appointmentId,
  onTranscriptionUpdate,
  onStructuredDataUpdate,
  className = ''
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    transcription: '',
    structuredData: null,
    confidence: 0,
    commands: [],
    medicalTerms: [],
    suggestions: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load voice command suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await voiceApi.getVoiceCommandSuggestions(appointmentId);
        setVoiceState(prev => ({ ...prev, suggestions }));
      } catch (error) {
        console.error('Error loading voice suggestions:', error);
      }
    };

    loadSuggestions();
  }, [appointmentId]);

  // Initialize audio context
  const initializeAudio = useCallback(async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Edge.');
        return false;
      }

      // Check if we're on HTTPS (required for getUserMedia in most browsers)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        toast.error('Gravação de áudio requer conexão HTTPS. Por favor, use uma conexão segura.');
        return false;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000
          } 
        });
      } catch (mediaError: any) {
        console.error('getUserMedia error:', mediaError);
        
        // Handle specific error types
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          toast.error('Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.', {
            duration: 5000,
          });
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          toast.error('Nenhum microfone encontrado. Verifique se há um microfone conectado e tente novamente.', {
            duration: 5000,
          });
        } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
          toast.error('O microfone está sendo usado por outro aplicativo. Feche outros aplicativos que possam estar usando o microfone.', {
            duration: 5000,
          });
        } else if (mediaError.name === 'OverconstrainedError') {
          // Try with simpler constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (retryError: any) {
            toast.error('Não foi possível acessar o microfone. Verifique as permissões e tente novamente.');
            return false;
          }
        } else {
          toast.error(`Erro ao acessar microfone: ${mediaError.message || 'Erro desconhecido'}. Verifique as permissões.`, {
            duration: 5000,
          });
        }
        return false;
      }
      
      streamRef.current = stream;
      return true;
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      toast.error('Erro inesperado ao acessar o microfone. Tente novamente.');
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const hasAudio = await initializeAudio();
      if (!hasAudio) return;

      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setVoiceState(prev => ({ ...prev, isRecording: true }));
      
      toast.success('Gravação iniciada');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Erro ao iniciar gravação');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      toast.success('Gravação finalizada');
    }
  }, [voiceState.isRecording]);

  // Process audio
  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setVoiceState(prev => ({ ...prev, isProcessing: true }));

      const result: VoiceProcessingResult = await voiceApi.processVoiceAudio(
        audioBlob as File,
        appointmentId,
        voiceState.sessionId
      );

      setVoiceState(prev => ({
        ...prev,
        sessionId: result.session_id,
        transcription: result.transcription,
        structuredData: result.structured_data,
        confidence: result.confidence,
        commands: result.commands,
        medicalTerms: result.medical_terms,
        isProcessing: false
      }));

      // Notify parent components
      if (onTranscriptionUpdate) {
        onTranscriptionUpdate(result.transcription);
      }
      if (onStructuredDataUpdate) {
        onStructuredDataUpdate(result.structured_data);
      }

      toast.success('Áudio processado com sucesso');
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Erro ao processar áudio');
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [appointmentId, voiceState.sessionId, onTranscriptionUpdate, onStructuredDataUpdate]);

  // Create clinical note
  const createClinicalNote = useCallback(async () => {
    if (!voiceState.sessionId) {
      toast.error('Nenhuma sessão de voz ativa');
      return;
    }

    try {
      await voiceApi.createClinicalNoteFromVoice(voiceState.sessionId);
      toast.success('Nota clínica criada com sucesso');
    } catch (error) {
      console.error('Error creating clinical note:', error);
      toast.error('Erro ao criar nota clínica');
    }
  }, [voiceState.sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Voice Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Documentação por Voz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={voiceState.isRecording ? stopRecording : startRecording}
              disabled={voiceState.isProcessing}
              variant={voiceState.isRecording ? "destructive" : "default"}
              size="lg"
              className="flex items-center gap-2"
            >
              {voiceState.isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Parar Gravação
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Iniciar Gravação
                </>
              )}
            </Button>

            {voiceState.isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando áudio...
              </div>
            )}

            {voiceState.confidence > 0 && (
              <Badge 
                variant="secondary" 
                className={`${getConfidenceColor(voiceState.confidence)} text-white`}
              >
                Confiança: {getConfidenceText(voiceState.confidence)} ({Math.round(voiceState.confidence * 100)}%)
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={createClinicalNote}
              disabled={!voiceState.sessionId || voiceState.isProcessing}
              variant="outline"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Criar Nota Clínica
            </Button>

            <Button
              onClick={() => setVoiceState(prev => ({ ...prev, transcription: '', structuredData: null }))}
              disabled={!voiceState.transcription}
              variant="outline"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcription Display */}
      {voiceState.transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Transcrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={voiceState.transcription}
              onChange={(e) => setVoiceState(prev => ({ ...prev, transcription: e.target.value }))}
              placeholder="Transcrição aparecerá aqui..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Voice Commands */}
      {voiceState.commands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comandos de Voz Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {voiceState.commands.map((command, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge variant="outline">{command.command_type}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{command.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Confiança: {Math.round((command.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Terms */}
      {voiceState.medicalTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Termos Médicos Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {voiceState.medicalTerms.map((term, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {term.term}
                  {term.icd10_codes && term.icd10_codes.length > 0 && (
                    <span className="text-xs">({term.icd10_codes[0]})</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SOAP Notes Preview */}
      {voiceState.structuredData && (
        <Card>
          <CardHeader>
            <CardTitle>Notas SOAP Estruturadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {voiceState.structuredData.soap_notes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Anamnese</h4>
                  <p className="text-sm">{voiceState.structuredData.soap_notes.subjective || 'Nenhuma informação'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Exame Físico</h4>
                  <p className="text-sm">{voiceState.structuredData.soap_notes.objective || 'Nenhuma informação'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Opinião da IA</h4>
                  <p className="text-sm">{voiceState.structuredData.soap_notes.assessment || 'Nenhuma informação'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Conduta</h4>
                  <p className="text-sm">{voiceState.structuredData.soap_notes.plan || 'Nenhuma informação'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voice Command Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Comandos de Voz Sugeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 overflow-auto">
            <div className="space-y-2">
              {voiceState.suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.command_type}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{suggestion.suggestion}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {suggestion.description}
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {suggestion.example}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceInterface;
