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

import { useState, useEffect } from 'react'
import { Mic, Circle, Check, X, Edit3 } from 'lucide-react'
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
  const [editableText, setEditableText] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition({
      language,
      continuous,
      interimResults,
      onTranscriptionComplete: (text) => {
        // En lugar de enviar directamente, mostramos el editor
        setEditableText(text)
        setShowEditor(true)
      },
      onTranscriptionUpdate,
      onError: (err) => {
        setError(err.message)
        onError?.(err)
      },
    })

  // Sincronizar transcript con editableText durante la grabación
  useEffect(() => {
    if (isListening && transcript) {
      setEditableText(transcript)
    }
  }, [isListening, transcript])

  const handleApplyText = () => {
    if (editableText.trim()) {
      onTranscriptionComplete(editableText.trim())
    }
    setShowEditor(false)
    setEditableText('')
    resetTranscript()
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditableText('')
    resetTranscript()
  }

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

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
        type="button"
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

      {/* Transcripción en tiempo real durante grabación */}
      {isListening && editableText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
        >
          <div className="font-medium mb-1 flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Transcribiendo...
          </div>
          <div className="text-blue-700">{editableText}</div>
        </motion.div>
      )}

      {/* Editor de transcripción (después de detener grabación) */}
      {showEditor && !isListening && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700 flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Revisar y editar transcripción
            </label>
            <span className="text-xs text-gray-500">
              Puedes corregir el texto antes de aplicar
            </span>
          </div>

          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       resize-none"
            placeholder="La transcripción aparecerá aquí..."
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                         hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyText}
              disabled={!editableText.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                         hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                         rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Aplicar texto
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
