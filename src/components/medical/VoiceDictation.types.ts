/**
 * VoiceDictation - Tipos TypeScript
 *
 * Definiciones de tipos para el componente de dictado por voz
 * usando Web Speech API
 */

export interface VoiceDictationProps {
  /** Callback cuando la transcripción finaliza (usuario detiene grabación) */
  onTranscriptionComplete: (text: string) => void

  /** Callback para actualizaciones en tiempo real (interim results) */
  onTranscriptionUpdate?: (text: string) => void

  /** Callback cuando el estado de grabación cambia */
  onRecordingStateChange?: (isRecording: boolean) => void

  /** Callback cuando hay un error */
  onError?: (error: SpeechRecognitionError) => void

  /** Idioma de reconocimiento (default: 'es-ES') */
  language?: string

  /** Modo continuo: no detiene automáticamente tras pausa (default: true) */
  continuous?: boolean

  /** Mostrar resultados intermedios durante grabación (default: true) */
  interimResults?: boolean

  /** Texto del botón (default: null, solo ícono) */
  buttonLabel?: string

  /** Variante visual: 'default' | 'compact' | 'floating' */
  variant?: 'default' | 'compact' | 'floating'

  /** Disabled state */
  disabled?: boolean
}

export interface SpeechRecognitionError {
  code: 'not-supported' | 'no-permission' | 'network-error' | 'no-speech' | 'unknown'
  message: string
}
