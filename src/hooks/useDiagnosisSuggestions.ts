/**
 * useDiagnosisSuggestions Hook - VT-232
 */
import { useState, useCallback } from 'react';
import type { AIProvider } from '@/types/nlp';

export interface DiagnosisSuggestion {
  diagnosis: string;
  icd10Code: string | null;
  icd10Description: string | null;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasoning: string;
}

export function useDiagnosisSuggestions() {
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisSuggestion | null>(null);

  const getSuggestions = useCallback(async (params: { symptoms: string[]; provider?: AIProvider }) => {
    if (!params.symptoms.length) { setError('Se requiere síntomas'); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await fetch('/api/ai/suggest-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSuggestions(data.data.suggestions);
      setDisclaimer(data.data.disclaimer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setSuggestions([]);
    } finally { setIsLoading(false); }
  }, []);

  const clearSuggestions = useCallback(() => { setSuggestions([]); setDisclaimer(null); setSelectedDiagnosis(null); }, []);
  const selectDiagnosis = useCallback((s: DiagnosisSuggestion) => setSelectedDiagnosis(s), []);

  return { suggestions, disclaimer, isLoading, error, selectedDiagnosis, getSuggestions, clearSuggestions, selectDiagnosis };
}
export default useDiagnosisSuggestions;
