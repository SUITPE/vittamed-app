/**
 * useSpeechRecognition - Custom hook para Web Speech API
 *
 * Maneja el reconocimiento de voz usando la Web Speech API del navegador.
 * Soporta transcripción en tiempo real y manejo de errores.
 */

'use client'

import { useRef, useState, useCallback } from 'react'
import { SpeechRecognitionError } from '@/components/medical/VoiceDictation.types'

// Extender tipos de window
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseSpeechRecognitionProps {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onTranscriptionComplete: (text: string) => void
  onTranscriptionUpdate?: (text: string) => void
  onError?: (error: SpeechRecognitionError) => void
}

export function useSpeechRecognition({
  language = 'es-ES',
  continuous = true,
  interimResults = true,
  onTranscriptionComplete,
  onTranscriptionUpdate,
  onError,
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const isSupported = useCallback(() => {
    return !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    )
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported()) {
      onError?.({
        code: 'not-supported',
        message:
          'Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Safari.',
      })
      return
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = language
      recognition.continuous = continuous
      recognition.interimResults = interimResults

      recognition.onstart = () => {
        console.log('[VoiceDictation] Recognition started')
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' '
          } else {
            interimTranscript += transcriptPart
          }
        }

        // Actualizar transcripción completa
        if (finalTranscript) {
          setTranscript((prev) => {
            const fullTranscript = prev + finalTranscript
            onTranscriptionUpdate?.(fullTranscript)
            return fullTranscript
          })
        }

        // Emitir interim results
        if (interimTranscript && onTranscriptionUpdate) {
          setTranscript((prev) => {
            onTranscriptionUpdate(prev + interimTranscript)
            return prev
          })
        }
      }

      recognition.onerror = (event: any) => {
        console.error('[VoiceDictation] Recognition error:', event.error)

        let errorCode: SpeechRecognitionError['code'] = 'unknown'
        let message = 'Error al reconocer voz'

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            errorCode = 'no-permission'
            message =
              'Permiso de micrófono denegado. Por favor habilita el micrófono en configuración del navegador.'
            break
          case 'network':
            errorCode = 'network-error'
            message = 'Error de conexión. Verifica tu conexión a internet.'
            break
          case 'no-speech':
            errorCode = 'no-speech'
            message =
              'No se detectó voz. Intenta hablar más cerca del micrófono.'
            break
          default:
            errorCode = 'unknown'
            message = `Error: ${event.error}`
        }

        onError?.({ code: errorCode, message })
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('[VoiceDictation] Recognition ended')
        setIsListening(false)

        // Emitir transcripción final
        if (transcript) {
          onTranscriptionComplete(transcript)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error('[VoiceDictation] Error starting recognition:', error)
      onError?.({
        code: 'unknown',
        message: 'Error al iniciar reconocimiento de voz',
      })
    }
  }, [
    language,
    continuous,
    interimResults,
    transcript,
    onTranscriptionComplete,
    onTranscriptionUpdate,
    onError,
    isSupported,
  ])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSupported(),
  }
}
