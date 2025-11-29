'use client';

/**
 * DiagnosisSuggestions Component
 *
 * Componente para mostrar sugerencias de diagnóstico generadas por AI
 *
 * TASK: VT-232
 * Epic: Historias Clínicas Inteligentes
 *
 * Características:
 * - Muestra sugerencias con nivel de confianza
 * - Código CIE-10 clickeable
 * - Disclaimer médico obligatorio
 * - Diagnósticos diferenciales
 * - Pruebas recomendadas
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DiagnosisSuggestion } from '@/hooks/useDiagnosisSuggestions';

interface DiagnosisSuggestionsProps {
  /** Lista de sugerencias */
  suggestions: DiagnosisSuggestion[];
  /** Disclaimer médico */
  disclaimer?: string;
  /** Callback al seleccionar un diagnóstico */
  onSelect?: (suggestion: DiagnosisSuggestion) => void;
  /** Diagnóstico seleccionado */
  selectedCode?: string;
  /** Estado de carga */
  isLoading?: boolean;
  /** Mostrar diagnósticos diferenciales expandidos */
  showDifferentials?: boolean;
  /** Mostrar pruebas recomendadas */
  showRecommendedTests?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Configuración de colores por nivel de confianza
 */
const CONFIDENCE_CONFIG = {
  high: {
    label: 'Alta',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    icon: '✓',
  },
  medium: {
    label: 'Media',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    icon: '~',
  },
  low: {
    label: 'Baja',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-700',
    icon: '?',
  },
};

export function DiagnosisSuggestions({
  suggestions,
  disclaimer,
  onSelect,
  selectedCode,
  isLoading = false,
  showDifferentials = true,
  showRecommendedTests = true,
  className,
}: DiagnosisSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-6', className)}>
        <div className="flex items-center justify-center gap-3">
          <svg
            className="h-5 w-5 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-600">Analizando síntomas...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">
          Sugerencias de Diagnóstico
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          IA
        </span>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-amber-800">{disclaimer}</p>
          </div>
        </div>
      )}

      {/* Sugerencias */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const config = CONFIDENCE_CONFIG[suggestion.confidence];
          const isExpanded = expandedIndex === index;
          const isSelected = selectedCode === suggestion.icd10Code;

          return (
            <div
              key={`${suggestion.icd10Code || suggestion.diagnosis}-${index}`}
              className={cn(
                'rounded-xl border transition-all duration-200',
                config.borderColor,
                isSelected ? 'ring-2 ring-primary ring-offset-1' : '',
                onSelect ? 'cursor-pointer hover:shadow-md' : ''
              )}
            >
              {/* Header de la sugerencia */}
              <div
                className={cn('p-4', config.bgColor)}
                onClick={() => onSelect?.(suggestion)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Diagnóstico y código */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">
                        {suggestion.diagnosis}
                      </h4>
                      {suggestion.icd10Code && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                          {suggestion.icd10Code}
                        </span>
                      )}
                    </div>

                    {/* Descripción CIE-10 */}
                    {suggestion.icd10Description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {suggestion.icd10Description}
                      </p>
                    )}

                    {/* Razonamiento */}
                    <p className="mt-2 text-sm text-gray-700">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Badge de confianza */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                        config.badgeColor
                      )}
                    >
                      <span>{config.icon}</span>
                      <span>Confianza {config.label}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(suggestion.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>

                {/* Botón expandir */}
                {(suggestion.differentialDiagnoses?.length ||
                  suggestion.recommendedTests?.length) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedIndex(isExpanded ? null : index);
                    }}
                    className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    {isExpanded ? 'Ver menos' : 'Ver más detalles'}
                  </button>
                )}
              </div>

              {/* Contenido expandido */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-white p-4 space-y-4">
                  {/* Diagnósticos diferenciales */}
                  {showDifferentials && suggestion.differentialDiagnoses?.length ? (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Diagnósticos Diferenciales
                      </h5>
                      <ul className="space-y-1">
                        {suggestion.differentialDiagnoses.map((diff, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Pruebas recomendadas */}
                  {showRecommendedTests && suggestion.recommendedTests?.length ? (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Pruebas Diagnósticas Recomendadas
                      </h5>
                      <ul className="space-y-1">
                        {suggestion.recommendedTests.map((test, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <svg
                              className="h-4 w-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            {test}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DiagnosisSuggestions;
