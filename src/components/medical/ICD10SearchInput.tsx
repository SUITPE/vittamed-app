'use client';

/**
 * ICD10SearchInput Component
 *
 * Componente de búsqueda de códigos CIE-10 con autocompletado
 *
 * TASK: VT-230
 * Epic: Historias Clínicas Inteligentes
 *
 * Características:
 * - Búsqueda en tiempo real con debounce
 * - Navegación por teclado (flechas, Enter, Escape)
 * - Filtro por capítulo
 * - Muestra código + descripción
 * - Accesible (ARIA)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
  ICD10SearchInputProps,
  ICD10SearchResult,
  ICD10SearchResponse,
} from '@/types/icd10';

// Debounce delay en ms
const DEBOUNCE_DELAY = 300;

// Mínimo de caracteres para buscar
const MIN_SEARCH_LENGTH = 2;

export function ICD10SearchInput({
  value,
  onSelect,
  onClear,
  placeholder = 'Buscar código CIE-10 o diagnóstico...',
  disabled = false,
  chapterFilter,
  className,
  showSelectedDescription = true,
  id,
  name,
  label,
  error,
  required = false,
}: ICD10SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICD10SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState<ICD10SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch search results
  const fetchResults = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < MIN_SEARCH_LENGTH) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      try {
        let url = `/api/icd10/search?q=${encodeURIComponent(searchQuery)}&limit=10`;
        if (chapterFilter) {
          url += `&chapter=${encodeURIComponent(chapterFilter)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            setSearchError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            return;
          }
          throw new Error('Error en la búsqueda');
        }

        const data: ICD10SearchResponse = await response.json();
        setResults(data.results);
        setIsOpen(data.results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('ICD10 search error:', err);
        setSearchError('Error al buscar. Intente nuevamente.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [chapterFilter]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= MIN_SEARCH_LENGTH) {
      debounceRef.current = setTimeout(() => {
        fetchResults(query);
      }, DEBOUNCE_DELAY);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchResults]);

  // Handle selection
  const handleSelect = useCallback(
    (item: ICD10SearchResult) => {
      setSelectedItem(item);
      setQuery('');
      setIsOpen(false);
      setResults([]);
      onSelect(item);

      // Incrementar contador de uso (fire and forget)
      fetch('/api/icd10/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: item.code }),
      }).catch(() => {
        // Ignorar errores del incremento
      });
    },
    [onSelect]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedItem(null);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && results.length > 0) {
          setIsOpen(true);
          setSelectedIndex(0);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external value
  useEffect(() => {
    if (value && !selectedItem) {
      // Si hay un valor pero no hay item seleccionado, podríamos buscar el código
      // Por ahora, dejamos el campo vacío hasta que el usuario busque
    }
  }, [value, selectedItem]);

  const inputId = id || `icd10-search-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Selected item display */}
      {selectedItem ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <span className="font-mono font-semibold text-primary">
              {selectedItem.code}
            </span>
            {showSelectedDescription && (
              <span className="ml-2 text-gray-700 truncate">
                {selectedItem.description}
              </span>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              aria-label="Limpiar selección"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              id={inputId}
              name={name}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (results.length > 0) {
                  setIsOpen(true);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={`${inputId}-listbox`}
              aria-activedescendant={
                selectedIndex >= 0 ? `${inputId}-option-${selectedIndex}` : undefined
              }
              className={cn(
                'flex h-11 w-full rounded-xl border bg-white px-4 py-2 pr-10 text-sm text-gray-900',
                'placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200 focus:border-primary'
              )}
            />

            {/* Loading/Search icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <svg
                  className="h-5 w-5 animate-spin text-gray-400"
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
              ) : (
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Dropdown results */}
          {isOpen && (
            <ul
              ref={listRef}
              id={`${inputId}-listbox`}
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              {results.map((item, index) => (
                <li
                  key={item.code}
                  id={`${inputId}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'cursor-pointer px-4 py-2.5 transition-colors',
                    index === selectedIndex
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-semibold text-primary flex-shrink-0">
                      {item.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.description}
                      </p>
                      {item.category && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.category}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* No results message */}
          {isOpen && results.length === 0 && !isLoading && query.length >= MIN_SEARCH_LENGTH && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-sm text-gray-500">
                No se encontraron resultados para &quot;{query}&quot;
              </p>
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {(error || searchError) && (
        <p className="mt-1.5 text-sm text-red-600">{error || searchError}</p>
      )}

      {/* Helper text */}
      {!error && !searchError && !selectedItem && (
        <p className="mt-1.5 text-xs text-gray-500">
          Escriba al menos 2 caracteres para buscar
        </p>
      )}
    </div>
  );
}

export default ICD10SearchInput;
