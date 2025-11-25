/**
 * Frontend Integration Tests for AI Features
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { SymptomChecker } from '@/components/ai-diagnosis/SymptomChecker';
import { ICD10Suggestions } from '@/components/ai-diagnosis/ICD10Suggestions';
import { DrugInteractionChecker } from '@/components/ai-diagnosis/DrugInteractionChecker';

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
  API_URL: 'http://localhost:8000',
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getAccessToken: jest.fn(() => 'mock-token'),
}));

describe('AI Features - Voice Recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock MediaRecorder
    global.MediaRecorder = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
      stream: {
        getTracks: jest.fn(() => []),
      },
    }));
    
    // Mock getUserMedia
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn(() => Promise.resolve({
        getTracks: jest.fn(() => []),
      })),
    } as any;
  });

  it('VoiceRecorder renders recording buttons', () => {
    const mockCallback = jest.fn();
    render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);
    
    expect(screen.getByText('Iniciar Gravação')).toBeInTheDocument();
  });

  it('VoiceRecorder shows stop button when recording', async () => {
    const mockCallback = jest.fn();
    render(<VoiceRecorder onTranscriptionComplete={mockCallback} />);
    
    const startButton = screen.getByText('Iniciar Gravação');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parar Gravação')).toBeInTheDocument();
    });
  });
});

describe('AI Features - Symptom Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { api } = require('@/lib/api');
    api.get.mockResolvedValue({
      success: true,
      symptoms: ['febre', 'cefaleia', 'dor abdominal', 'náusea'],
      count: 4,
    });
  });

  it('SymptomChecker renders input field', () => {
    const mockCallback = jest.fn();
    render(<SymptomChecker onDiagnosisUpdate={mockCallback} />);
    
    expect(screen.getByPlaceholderText('Digite um sintoma...')).toBeInTheDocument();
  });

  it('SymptomChecker allows adding symptoms', async () => {
    const mockCallback = jest.fn();
    render(<SymptomChecker onDiagnosisUpdate={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Digite um sintoma...');
    fireEvent.change(input, { target: { value: 'febre' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('febre')).toBeInTheDocument();
    });
  });

  it('SymptomChecker shows analyze button when symptoms added', async () => {
    const mockCallback = jest.fn();
    render(<SymptomChecker onDiagnosisUpdate={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Digite um sintoma...');
    fireEvent.change(input, { target: { value: 'febre' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/Analisar.*Sintoma/i)).toBeInTheDocument();
    });
  });

  it('SymptomChecker calls API on analyze', async () => {
    const mockCallback = jest.fn();
    const { api } = require('@/lib/api');
    
    api.post.mockResolvedValue({
      success: true,
      symptoms_analyzed: ['febre'],
      differential_diagnoses: [
        {
          icd10_code: 'J06',
          description: 'Infeções agudas das vias respiratórias superiores',
          confidence: 0.7,
          supporting_symptoms: ['febre'],
          recommended_tests: ['Hemograma', 'Raio-X de tórax'],
        },
      ],
    });
    
    render(<SymptomChecker onDiagnosisUpdate={mockCallback} />);
    
    const input = screen.getByPlaceholderText('Digite um sintoma...');
    fireEvent.change(input, { target: { value: 'febre' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      const analyzeButton = screen.getByText(/Analisar.*Sintoma/i);
      fireEvent.click(analyzeButton);
    });
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/ai/symptoms/analyze',
        expect.objectContaining({
          symptoms: ['febre'],
        })
      );
    });
  });
});

describe('AI Features - ICD-10 Suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { api } = require('@/lib/api');
    api.post.mockResolvedValue({
      success: true,
      suggested_codes: [
        {
          code: 'I10',
          description: 'Hipertensão essencial (primária)',
          match_score: 0.85,
          category: 'Doenças do aparelho circulatório',
        },
      ],
      count: 1,
    });
  });

  it('ICD10Suggestions does not render for short text', () => {
    const mockCallback = jest.fn();
    const { container } = render(
      <ICD10Suggestions clinicalFindings="short" onCodeSelect={mockCallback} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('ICD10Suggestions renders for long text', async () => {
    const mockCallback = jest.fn();
    const longText = 'Paciente com hipertensão arterial e diabetes tipo 2';
    
    render(
      <ICD10Suggestions clinicalFindings={longText} onCodeSelect={mockCallback} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Sugestões de CID-10')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('AI Features - Drug Interaction Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { api } = require('@/lib/api');
    api.post.mockResolvedValue({
      success: true,
      interactions: [
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
          severity: 'severe',
          description: 'Interação potencial entre warfarin e aspirin',
          recommendation: 'ATENÇÃO: Interação de alto risco',
        },
      ],
      count: 1,
    });
  });

  it('DrugInteractionChecker does not render for single medication', () => {
    const { container } = render(
      <DrugInteractionChecker medications={['warfarin']} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('DrugInteractionChecker renders for multiple medications', async () => {
    render(
      <DrugInteractionChecker medications={['warfarin', 'aspirin']} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Verificação de Interações')).toBeInTheDocument();
    });
  });

  it('DrugInteractionChecker shows interactions when found', async () => {
    render(
      <DrugInteractionChecker medications={['warfarin', 'aspirin']} />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/warfarin.*aspirin/i)).toBeInTheDocument();
    });
  });
});

