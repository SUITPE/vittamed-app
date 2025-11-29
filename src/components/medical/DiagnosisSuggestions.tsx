'use client';
/**
 * DiagnosisSuggestions Component - VT-232
 */
import React from 'react';
import { cn } from '@/lib/utils';
import type { DiagnosisSuggestion } from '@/hooks/useDiagnosisSuggestions';

interface Props {
  suggestions: DiagnosisSuggestion[];
  disclaimer?: string;
  onSelect?: (s: DiagnosisSuggestion) => void;
  isLoading?: boolean;
  className?: string;
}

const CONF = {
  high: { label: 'Alta', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
  medium: { label: 'Media', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  low: { label: 'Baja', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' },
};

export function DiagnosisSuggestions({ suggestions, disclaimer, onSelect, isLoading, className }: Props) {
  if (isLoading) return <div className={cn('rounded-xl border p-6 text-center', className)}>Analizando...</div>;
  if (!suggestions.length) return null;

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold">Sugerencias de Diagnóstico <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">IA</span></h3>
      {disclaimer && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{disclaimer}</div>}
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const c = CONF[s.confidence];
          return (
            <div key={i} className={cn('rounded-xl border p-4 cursor-pointer hover:shadow', c.bg)} onClick={() => onSelect?.(s)}>
              <div className="flex justify-between">
                <div>
                  <h4 className="font-semibold">{s.diagnosis}</h4>
                  {s.icd10Code && <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded ml-2">{s.icd10Code}</span>}
                  {s.icd10Description && <p className="text-sm text-gray-600 mt-1">{s.icd10Description}</p>}
                  <p className="text-sm text-gray-700 mt-2">{s.reasoning}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs px-2 py-1 rounded-full', c.badge)}>Confianza {c.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(s.confidenceScore * 100)}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default DiagnosisSuggestions;
