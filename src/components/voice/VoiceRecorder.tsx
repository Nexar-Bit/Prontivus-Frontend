"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: any) => void;
  consultationId?: number;
  appointmentId?: number;  // Alternative prop name for appointment ID
  language?: string;
  enhanceMedicalTerms?: boolean;
  structureSoap?: boolean;
}

export function VoiceRecorder({ 
  onTranscriptionComplete, 
  consultationId,
  appointmentId,
  language = 'pt-BR',
  enhanceMedicalTerms = true,
  structureSoap = true,
}: VoiceRecorderProps) {
  // Use appointmentId if provided, otherwise fall back to consultationId
  const activeAppointmentId = appointmentId || consultationId;
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Edge.');
        return;
      }

      // Check if we're on HTTPS (required for getUserMedia in most browsers)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        toast.error('Gravação de áudio requer conexão HTTPS. Por favor, use uma conexão segura.');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
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
          toast.error('O microfone não suporta as configurações solicitadas. Tentando configurações alternativas...', {
            duration: 3000,
          });
          // Try with simpler constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (retryError: any) {
            toast.error('Não foi possível acessar o microfone. Verifique as permissões e tente novamente.');
            return;
          }
        } else {
          toast.error(`Erro ao acessar microfone: ${mediaError.message || 'Erro desconhecido'}. Verifique as permissões.`, {
            duration: 5000,
          });
        }
        return;
      }
      
      streamRef.current = stream;
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error('Seu navegador não suporta gravação de áudio. Use uma versão mais recente do navegador.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Try to find a supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Try alternatives
        const alternatives = [
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/wav'
        ];
        mimeType = alternatives.find(type => MediaRecorder.isTypeSupported(type)) || '';
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Erro na gravação de áudio. Tente novamente.');
        stopRecording();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Gravação iniciada');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error('Erro inesperado ao iniciar gravação. Tente novamente.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast.success('Gravação finalizada');
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error('Nenhum áudio gravado');
      return;
    }

    setIsTranscribing(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('enhance_medical_terms', String(enhanceMedicalTerms));
      formData.append('structure_soap', String(structureSoap));
      
      // Add appointment_id if available (for patient recordings)
      if (activeAppointmentId) {
        formData.append('appointment_id', activeAppointmentId.toString());
      }

      const response = await fetch(`${API_URL}/api/v1/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Transcrição falhou');
      }

      onTranscriptionComplete(result);
      toast.success('Transcrição concluída com sucesso!');
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(error.message || 'Erro na transcrição. Tente novamente.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gravar Nota de Voz</h3>
          <p className="text-sm text-muted-foreground">
            Grave sua anotação clínica e converta em texto automaticamente
          </p>
        </div>
        <div className="flex gap-2">
          {!isRecording && !audioBlob && (
            <Button onClick={startRecording} className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Iniciar Gravação
            </Button>
          )}
          
          {isRecording && (
            <Button 
              onClick={stopRecording} 
              variant="destructive" 
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Parar Gravação
            </Button>
          )}
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="font-medium">Gravando... {formatTime(recordingTime)}</span>
          <span className="text-muted-foreground">Fale claramente próximo ao microfone.</span>
        </div>
      )}

      {audioBlob && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <audio src={audioUrl} controls className="flex-1 h-10" />
            <div className="flex gap-2">
              <Button 
                onClick={transcribeAudio} 
                disabled={isTranscribing}
                className="flex items-center gap-2"
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isTranscribing ? 'Transcrevendo...' : 'Transcrever'}
              </Button>
              <Button 
                onClick={clearRecording} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
          
          {isTranscribing && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <Loader2 className="h-4 w-4 inline-block animate-spin mr-2" />
              Processando áudio... Isso pode levar alguns segundos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

