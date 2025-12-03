/**
 * useDiagnosisSuggestions Hook
 *
 * Hook para obtener sugerencias de diagnóstico basadas en síntomas
 *
 * TASK: VT-232
 * Epic: Historias Clínicas Inteligentes
 *
 * @example
 * const { suggestions, isLoading, error, getSuggestions } = useDiagnosisSuggestions();
 *
 * // Obtener sugerencias
 * await getSuggestions({
 *   symptoms: ['dolor de cabeza', 'náuseas', 'sensibilidad a la luz'],
 *   patientContext: { age: 35, gender: 'F' }
 * });
 */

import { useState, useCallback } from 'react';
import type { AIProvider } from '@/types/nlp';

/**
 * Sugerencia de diagnóstico
 */
export interface DiagnosisSuggestion {
  diagnosis: string;
  icd10Code: string | null;
  icd10Description: string | null;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
  differentialDiagnoses?: string[];
  recommendedTests?: string[];
}

/**
 * Contexto del paciente
 */
export interface PatientContext {
  age?: number;
  gender?: 'M' | 'F' | 'other';
  knownConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

/**
 * Parámetros para obtener sugerencias
 */
export interface GetSuggestionsParams {
  symptoms: string[];
  clinicalText?: string;
  patientContext?: PatientContext;
  provider?: AIProvider;
  maxSuggestions?: number;
}

/**
 * Estado del hook
 */
export interface DiagnosisSuggestionsState {
  suggestions: DiagnosisSuggestion[];
  disclaimer: string | null;
  isLoading: boolean;
  error: string | null;
  provider: AIProvider | null;
  model: string | null;
  processingTime: number | null;
}

/**
 * Retorno del hook
 */
export interface UseDiagnosisSuggestionsReturn extends DiagnosisSuggestionsState {
  getSuggestions: (params: GetSuggestionsParams) => Promise<void>;
  clearSuggestions: () => void;
  selectDiagnosis: (suggestion: DiagnosisSuggestion) => void;
  selectedDiagnosis: DiagnosisSuggestion | null;
}

/**
 * Hook para sugerencias de diagnóstico
 */
export function useDiagnosisSuggestions(): UseDiagnosisSuggestionsReturn {
  const [state, setState] = useState<DiagnosisSuggestionsState>({
    suggestions: [],
    disclaimer: null,
    isLoading: false,
    error: null,
    provider: null,
    model: null,
    processingTime: null,
  });

  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisSuggestion | null>(null);

  /**
   * Obtener sugerencias de diagnóstico
   */
  const getSuggestions = useCallback(async (params: GetSuggestionsParams) => {
    const { symptoms, clinicalText, patientContext, provider, maxSuggestions = 5 } = params;

    if (symptoms.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'Se requiere al menos un síntoma',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/ai/suggest-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          clinicalText,
          patientContext,
          provider,
          maxSuggestions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener sugerencias');
      }

      setState({
        suggestions: data.data.suggestions,
        disclaimer: data.data.disclaimer,
        isLoading: false,
        error: null,
        provider: data.data.provider,
        model: data.data.model,
        processingTime: data.data.processingTime,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        suggestions: [],
      }));
    }
  }, []);

  /**
   * Limpiar sugerencias
   */
  const clearSuggestions = useCallback(() => {
    setState({
      suggestions: [],
      disclaimer: null,
      isLoading: false,
      error: null,
      provider: null,
      model: null,
      processingTime: null,
    });
    setSelectedDiagnosis(null);
  }, []);

  /**
   * Seleccionar un diagnóstico
   */
  const selectDiagnosis = useCallback((suggestion: DiagnosisSuggestion) => {
    setSelectedDiagnosis(suggestion);
  }, []);

  return {
    ...state,
    getSuggestions,
    clearSuggestions,
    selectDiagnosis,
    selectedDiagnosis,
  };
}

export default useDiagnosisSuggestions;
