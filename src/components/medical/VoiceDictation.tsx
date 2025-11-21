/**
 * VoiceDictation - Componente de Dictado por Voz
 *
 * Permite grabar y transcribir voz en tiempo real usando Web Speech API.
 * Incluye indicadores visuales, manejo de errores y 3 variantes de diseño.
 *
 * @example
 * <VoiceDictation
 *   onTranscriptionComplete={(text) => setNotes(text)}
 *   variant="compact"
 * />
 */

'use client'

import { useState } from 'react'
import { Mic, Circle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { VoiceDictationProps } from './VoiceDictation.types'

export function VoiceDictation({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  onRecordingStateChange,
  onError,
  language = 'es-ES',
  continuous = true,
  interimResults = true,
  buttonLabel,
  variant = 'default',
  disabled = false,
}: VoiceDictationProps) {
  const [error, setError] = useState<string | null>(null)

  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition({
      language,
      continuous,
      interimResults,
      onTranscriptionComplete,
      onTranscriptionUpdate,
      onError: (err) => {
        setError(err.message)
        onError?.(err)
      },
    })

  const handleToggle = () => {
    if (isListening) {
      stopListening()
      onRecordingStateChange?.(false)
    } else {
      setError(null)
      startListening()
      onRecordingStateChange?.(true)
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o
        Safari.
      </div>
    )
  }

  const buttonClasses = {
    default: 'h-14 px-6 rounded-lg font-medium',
    compact: 'h-10 px-4 rounded-md text-sm',
    floating: 'h-16 w-16 rounded-full shadow-lg',
  }

  return (
    <div className="space-y-3">
      {/* Botón de dictado */}
      <motion.button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          ${buttonClasses[variant]}
          flex items-center justify-center gap-2
          transition-colors
          ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {/* Ícono con animación */}
        {isListening ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Circle className="h-5 w-5 fill-current" />
            </motion.div>
            {buttonLabel && variant === 'default' && <span>Detener</span>}
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            {buttonLabel && variant === 'default' && <span>{buttonLabel}</span>}
          </>
        )}
      </motion.button>

      {/* Indicador de grabación */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-2 bg-red-600 rounded-full"
          />
          <span>Escuchando...</span>
        </motion.div>
      )}

      {/* Mensaje de error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
        >
          {error}
        </motion.div>
      )}

      {/* Transcripción en tiempo real (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          <div className="font-medium mb-1">Transcripción:</div>
          <div className="text-gray-600">{transcript}</div>
        </div>
      )}
    </div>
  )
}
