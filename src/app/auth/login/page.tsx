'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const redirectTo = searchParams.get('redirectTo')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Email y contraseña son requeridos')
        setLoading(false)
        return
      }

      // Call API route for authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      const { redirectPath } = await response.json()

      // Redirect to the appropriate page
      window.location.href = redirectPath || '/dashboard'

    } catch (err) {
      console.error('Login error:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  async function handleOAuthSignIn(provider: 'google' | 'facebook' | 'apple') {
    setError('')
    setLoading(true)

    try {
      // OAuth placeholder - not implemented in simplified auth
      setError(`OAuth with ${provider} is not yet implemented in simplified auth mode`)
    } catch (err) {
      setError(`Error inesperado con ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Iniciar Sesión en VittaMed
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div data-testid="login-error" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="email-input"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  data-testid="password-input"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                data-testid="login-submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="ml-2">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn('apple')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 8.025.044 8.025.044c-.504.022-1.007.135-1.49.335-1.357.56-2.451 1.617-3.045 2.945-.297.665-.442 1.374-.442 2.096 0 .726.145 1.434.442 2.1.593 1.327 1.688 2.385 3.045 2.945.483.2.986.313 1.49.335 0 0 .371.044 3.992.044s3.992-.044 3.992-.044c.504-.022 1.007-.135 1.49-.335 1.357-.56 2.451-1.618 3.045-2.945.297-.666.442-1.374.442-2.1 0-.722-.145-1.431-.442-2.096C18.993 1.662 17.898.605 16.541.045 16.058-.155 15.555-.268 15.051-.29 15.051-.29 14.68-.334 11.059-.334L12.017 0zm-.017 6.667c-1.473 0-2.666 1.194-2.666 2.667 0 1.473 1.193 2.667 2.666 2.667s2.667-1.194 2.667-2.667c0-1.473-1.194-2.667-2.667-2.667zm5.338-1.154c-.343 0-.621-.278-.621-.621 0-.343.278-.621.621-.621.343 0 .621.278.621.621 0 .343-.278.621-.621.621zM12 14.667c-2.205 0-4-1.795-4-4s1.795-4 4-4 4 1.795 4 4-1.795 4-4 4z"/>
                </svg>
                <span className="ml-2">Apple</span>
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Usuarios de Demo</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Nota:</strong> Los usuarios se determinarán automáticamente por la base de datos</p>
                <p><strong>Rol admin:</strong> cualquier email con "admin@"</p>
                <p><strong>Rol doctor:</strong> usuarios registrados en la tabla doctors</p>
                <p><strong>Rol paciente:</strong> resto de usuarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}