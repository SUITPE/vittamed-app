'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Filter out browser extension errors
    const isBrowserExtensionError =
      error.message?.includes('message channel closed') ||
      error.message?.includes('listener indicated') ||
      error.message?.includes('Extension context invalidated') ||
      error.message?.includes('chrome-extension://') ||
      error.message?.includes('moz-extension://')

    if (isBrowserExtensionError) {
      console.warn('Browser extension error caught and ignored:', error.message)
      return { hasError: false }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out browser extension errors
    const isBrowserExtensionError =
      error.message?.includes('message channel closed') ||
      error.message?.includes('listener indicated') ||
      error.message?.includes('Extension context invalidated') ||
      error.message?.includes('chrome-extension://') ||
      error.message?.includes('moz-extension://')

    if (isBrowserExtensionError) {
      console.warn('Browser extension error in componentDidCatch, ignoring:', error.message)
      return
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Algo salió mal
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>Ocurrió un error inesperado. Por favor, intenta recargar la página.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={resetError}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-3 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary