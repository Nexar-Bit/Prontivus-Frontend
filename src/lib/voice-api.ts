/**
 * Voice Processing API Client
 * Handles voice-to-text clinical documentation
 */

import { api } from './api';

export interface VoiceSession {
  session_id: string;
  appointment_id: number;
  created_at: string;
  expires_at: string;
}

export interface VoiceCommand {
  id: number;
  session_id: string;
  command_type: string;
  raw_text: string;
  processed_content: string;
  confidence_score?: number;
  medical_terms?: string[];
  icd10_codes?: string[];
  created_at: string;
}

export interface MedicalTerm {
  id: number;
  term: string;
  category: string;
  icd10_codes: string[];
  synonyms: string[];
  confidence?: number;
  language: string;
}

export interface VoiceConfiguration {
  provider: string;
  language: string;
  model: string;
  enable_auto_punctuation: boolean;
  enable_word_time_offsets: boolean;
  confidence_threshold: number;
  enable_icd10_suggestions: boolean;
  enable_medication_recognition: boolean;
  auto_delete_after_hours: number;
  enable_encryption: boolean;
  enable_audit_logging: boolean;
}

export interface VoiceProcessingResult {
  transcription: string;
  commands: any[];
  medical_terms: any[];
  structured_data: {
    soap_notes: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    symptoms: any[];
    diagnoses: any[];
    medications: any[];
    vital_signs: any;
    icd10_codes: string[];
    confidence_scores: any;
  };
  confidence: number;
  session_id: string;
  timestamp: string;
}

export interface VoiceCommandSuggestion {
  command_type: string;
  suggestion: string;
  description: string;
  example: string;
}

export const voiceApi = {
  /**
   * Process voice audio and return transcription with medical analysis
   */
  processVoiceAudio: async (
    audioFile: File,
    appointmentId: number,
    sessionId?: string
  ): Promise<VoiceProcessingResult> => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('appointment_id', appointmentId.toString());
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/voice/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clinicore_access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to process voice audio: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new voice session
   */
  createVoiceSession: async (appointmentId: number): Promise<VoiceSession> => {
    return api.post<VoiceSession>('/api/voice/sessions', {
      appointment_id: appointmentId,
    });
  },

  /**
   * Get voice session information
   */
  getVoiceSession: async (sessionId: string): Promise<VoiceSession> => {
    return api.get<VoiceSession>(`/api/voice/sessions/${sessionId}`);
  },

  /**
   * List voice sessions
   */
  listVoiceSessions: async (
    appointmentId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<VoiceSession[]> => {
    const params = new URLSearchParams();
    if (appointmentId) params.append('appointment_id', appointmentId.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return api.get<VoiceSession[]>(`/api/voice/sessions?${params.toString()}`);
  },

  /**
   * Create clinical note from voice session
   */
  createClinicalNoteFromVoice: async (sessionId: string): Promise<any> => {
    return api.post(`/api/voice/sessions/${sessionId}/create-note`);
  },

  /**
   * Get medical terms
   */
  getMedicalTerms: async (
    category?: string,
    search?: string,
    limit: number = 100
  ): Promise<MedicalTerm[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    return api.get<MedicalTerm[]>(`/api/voice/medical-terms?${params.toString()}`);
  },

  /**
   * Get voice configuration
   */
  getVoiceConfiguration: async (): Promise<VoiceConfiguration> => {
    return api.get<VoiceConfiguration>('/api/voice/configuration');
  },

  /**
   * Delete voice session
   */
  deleteVoiceSession: async (sessionId: string): Promise<void> => {
    return api.delete(`/api/voice/sessions/${sessionId}`);
  },

  /**
   * Get voice command suggestions based on context
   */
  getVoiceCommandSuggestions: async (appointmentId: number): Promise<VoiceCommandSuggestion[]> => {
    // This would be implemented based on the appointment context
    // For now, return static suggestions
    return [
      {
        command_type: 'subjective',
        suggestion: 'Adicionar queixa principal',
        description: 'Adiciona informações sobre os sintomas relatados pelo paciente',
        example: 'Adicionar queixa principal: dor abdominal há 3 dias'
      },
      {
        command_type: 'objective',
        suggestion: 'Exame físico',
        description: 'Adiciona achados do exame físico',
        example: 'Exame físico: abdomen doloroso à palpação em FID'
      },
      {
        command_type: 'assessment',
        suggestion: 'Hipótese diagnóstica',
        description: 'Adiciona impressão diagnóstica',
        example: 'Hipótese diagnóstica: apendicite aguda'
      },
      {
        command_type: 'plan',
        suggestion: 'Conduta',
        description: 'Adiciona plano terapêutico e orientações',
        example: 'Conduta: solicitar USG abdominal e iniciar antibioticoterapia'
      },
      {
        command_type: 'vital_signs',
        suggestion: 'Sinais vitais',
        description: 'Adiciona sinais vitais do paciente',
        example: 'Sinais vitais: PA 120/80, FC 80 bpm, T 37.2°C'
      },
      {
        command_type: 'medication',
        suggestion: 'Medicação',
        description: 'Adiciona prescrição medicamentosa',
        example: 'Medicação: dipirona 500mg 6/6h por 3 dias'
      }
    ];
  }
};

export default voiceApi;
