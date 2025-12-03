'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'
import { Button } from '@/components/ui/Button'
import PublicHeader from '@/components/PublicHeader'

export default function RegisterBusinessPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: 'admin_tenant', // Fixed role for business registration
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      // Success - now login and redirect to tenant creation
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include',
      })

      if (loginResponse.ok) {
        // Use window.location.href to ensure cookies are properly set before navigation
        // This forces a full page reload which guarantees the auth cookie is available
        window.location.href = '/admin/create-tenant'
      } else {
        // Registration succeeded but login failed - redirect to login page
        window.location.href = '/auth/login?message=Cuenta creada. Inicia sesión para continuar.'
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#40C9C6]/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Registra tu Negocio
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Crea tu cuenta como administrador y configura tu clínica
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="font-medium text-[#40C9C6] hover:text-[#33a19e]">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  id="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <input
                  id="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
                placeholder="tu@negocio.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
                placeholder="Repite tu contraseña"
              />
            </div>

            <div className="bg-[#40C9C6]/10 border border-[#40C9C6]/20 rounded-md p-4">
              <div className="flex">
                <Icons.shield className="h-5 w-5 text-[#40C9C6] mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#003A47]">
                  <p className="font-medium mb-1">Cuenta de Administrador</p>
                  <p className="text-xs text-[#40C9C6]">
                    Tu cuenta tendrá acceso completo para gestionar tu clínica, servicios, personal y citas.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white border-0"
              >
                {loading ? (
                  <>
                    <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <Icons.userPlus className="mr-2 h-4 w-4" />
                    Crear Cuenta y Continuar
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Próximos pasos</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <span className="font-bold text-[#40C9C6] mr-2">1.</span>
                <span>Crea tu cuenta de administrador</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-[#40C9C6] mr-2">2.</span>
                <span>Configura la información de tu clínica</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-[#40C9C6] mr-2">3.</span>
                <span>Comienza a gestionar tus servicios y citas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
